"""
vcparse.py — turn WPBakery (js_composer) shortcode soup into a tree.

Salient pages are stored as deeply nested [vc_row][vc_column][element]
shortcodes carrying 40+ presentational attributes each. This parser keeps
the structure and the handful of attributes that actually carry content or
meaningful design intent, and drops the rest.
"""
import re
import html
from html.parser import HTMLParser

SHORTCODE = re.compile(r"\[(/?)([a-zA-Z0-9_]+)((?:\s+[^\]]*?)?)(/?)\]", re.S)
ATTR = re.compile(r'([a-zA-Z0-9_\-]+)\s*=\s*"([^"]*)"')

# Shortcodes that never have a closing tag.
SELF_CLOSING = {
    "vc_single_image", "vc_empty_space", "image_with_animation",
    "divider", "nectar_cta", "split_line_heading", "vc_separator",
    "nectar_blog", "nectar_slider", "contact-form-7", "vc_gallery",
    "nectar_highlighted_text", "nectar_icon", "vc_video", "vc_widget_sidebar",
    "nectar_animated_title", "portfolio_items", "nectar_food_menu_item",
}

# Attributes worth keeping, grouped by why they matter.
KEEP = {
    # content
    "title", "heading", "text", "image", "image_url", "url", "link",
    "link_text", "src", "id", "images", "source", "video_external",
    "subtitle", "caption", "alt", "html", "text_content", "image_id",
    "img_link", "button_text", "link_url", "heading_tag", "el_id",
    # layout / design intent
    "bg_image", "bg_color", "color_overlay", "overlay_strength",
    "text_color", "font_style", "text_align", "full_height", "width",
    "columns", "layout", "style", "alignment", "max_width",
    "content_alignment", "font_size", "column_padding", "type",
}


class _TextExtractor(HTMLParser):
    """Flatten inner HTML to readable text, keeping paragraph breaks."""

    def __init__(self):
        super().__init__()
        self.parts = []
        self._skip = 0

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style"):
            self._skip += 1
        elif tag in ("p", "br", "div", "li", "h1", "h2", "h3", "h4", "tr"):
            self.parts.append("\n")

    def handle_endtag(self, tag):
        if tag in ("script", "style") and self._skip:
            self._skip -= 1
        elif tag in ("p", "div", "li", "h1", "h2", "h3", "h4", "tr"):
            self.parts.append("\n")

    def handle_data(self, data):
        if not self._skip:
            self.parts.append(data)

    def text(self):
        raw = "".join(self.parts)
        raw = html.unescape(raw)
        raw = re.sub(r"[ \t\xa0]+", " ", raw)
        raw = re.sub(r"\n\s*\n+", "\n\n", raw)
        return raw.strip()


def clean_text(s):
    p = _TextExtractor()
    p.feed(s or "")
    return p.text()


def parse(content):
    """Return a list of nodes. Each node:
       {tag, attrs, text, children}"""
    root = {"tag": "_root", "attrs": {}, "text": "", "children": []}
    stack = [root]
    pos = 0

    for m in SHORTCODE.finditer(content or ""):
        # plain text between shortcodes belongs to the current node
        between = content[pos:m.start()]
        if between.strip():
            stack[-1]["text"] += "\n" + between
        pos = m.end()

        closing, tag, attr_str, selfclose = m.groups()

        if closing:
            # close the nearest matching open tag
            for i in range(len(stack) - 1, 0, -1):
                if stack[i]["tag"] == tag:
                    del stack[i:]
                    break
            continue

        attrs = {k: v for k, v in ATTR.findall(attr_str or "") if k in KEEP and v}
        node = {"tag": tag, "attrs": attrs, "text": "", "children": []}
        stack[-1]["children"].append(node)

        if not selfclose and tag not in SELF_CLOSING:
            stack.append(node)

    tail = content[pos:] if content else ""
    if tail.strip():
        root["text"] += "\n" + tail

    return root["children"]


# Structural wrappers that carry no content of their own.
WRAPPERS = {"vc_row", "vc_column", "vc_row_inner", "vc_column_inner",
            "vc_tta_section", "vc_tta_tabs", "vc_tta_tour"}


def outline(nodes, depth=0, out=None, show_wrappers=False):
    """Human-readable outline of a parsed page."""
    if out is None:
        out = []
    for n in nodes:
        txt = clean_text(n["text"])
        is_wrap = n["tag"] in WRAPPERS
        if show_wrappers or not is_wrap:
            bits = []
            for k in ("text_content", "title", "heading", "text", "url",
                      "image", "images", "image_url", "video_external",
                      "bg_image", "bg_color", "font_style", "color_overlay"):
                if k in n["attrs"]:
                    bits.append(f'{k}={n["attrs"][k][:70]!r}')
            label = f'{"  " * depth}[{n["tag"]}] ' + " ".join(bits)
            out.append(label.rstrip())
            if txt:
                for line in txt.split("\n"):
                    if line.strip():
                        out.append(f'{"  " * (depth + 1)}| {line.strip()[:150]}')
        outline(n["children"], depth + (0 if is_wrap and not show_wrappers else 1),
                out, show_wrappers)
    return out


def collect_text(nodes, acc=None):
    """All human-readable text on a page, in document order."""
    if acc is None:
        acc = []
    for n in nodes:
        for k in ("text_content", "title", "heading", "text"):
            v = n["attrs"].get(k)
            if v:
                t = clean_text(v)
                if t:
                    acc.append(t)
        t = clean_text(n["text"])
        if t:
            acc.append(t)
        collect_text(n["children"], acc)
    return acc
