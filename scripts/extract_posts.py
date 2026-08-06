"""
extract_posts.py — pull the published blog posts out of the WordPress dump.

Unlike the pages, the posts were written in the classic editor: the content
is plain HTML, not WPBakery shortcodes. So we keep the HTML, but normalise
it on the way out:

  * WordPress auto-paragraphs on render (wpautop) rather than storing <p>,
    so bare newline-separated text has to be wrapped here instead.
  * <img> srcs point at the live uploads URL. We rewrite the ones whose
    file exists in src/assets and flag the rest.
  * Internal links point at the old absolute domain; those become relative.
  * Inline style/class/width/height junk from the editor is stripped.
"""

import sys
from pathlib import Path

# Paths are resolved relative to this file so the extractors can be run
# from anywhere:  python scripts/extract.py [path/to/dump.sql]
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
import html
import json
import os
import re

from dbread import read_table

DUMP = str(Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT.parent / "local.sql")
PREFIX = "18d8v6q_"
OUT = str(ROOT / "src/data/content/posts.json")
ASSETS = str(ROOT / "src/assets")

# Any of the old hosts the content might reference.
HOSTS = re.compile(
    r"https?://(?:www\.)?(?:luxury-property-group\.local"
    r"|elegant-address\.letsgrowdemo\.agency"
    r"|elegant-address\.com)", re.I)

UPLOAD_SRC = re.compile(r'src="([^"]*?/wp-content/uploads/([^"]+?))"', re.I)
# WordPress appends -WIDTHxHEIGHT before the extension for resized copies.
RESIZED = re.compile(r"-\d{2,4}x\d{2,4}(\.[a-z]+)$", re.I)

STRIP_ATTRS = re.compile(
    r'\s+(?:class|style|width|height|srcset|sizes|id|data-[a-z-]+)="[^"]*"', re.I)
EMPTY_P = re.compile(r"<p>\s*(?:&nbsp;)?\s*</p>", re.I)


def load_asset_index():
    """filename (lowercased, no resize suffix) -> path under src/assets."""
    index = {}
    for root, _, files in os.walk(ASSETS):
        for f in files:
            rel = os.path.relpath(os.path.join(root, f), ASSETS)
            index[f.lower()] = rel.replace(os.sep, "/")
    return index


def wpautop(text):
    """Minimal stand-in for WordPress's wpautop."""
    if "<p" in text.lower():
        return text
    chunks = [c.strip() for c in re.split(r"\n\s*\n", text) if c.strip()]
    return "\n".join(
        c if re.match(r"\s*<(?:p|div|ul|ol|h[1-6]|blockquote|figure|table)\b", c, re.I)
        else f"<p>{c}</p>"
        for c in chunks)


def clean(content, assets, missing):
    out = content.replace("\r\n", "\n")
    out = wpautop(out)

    def swap(m):
        full, tail = m.group(1), m.group(2)
        name = RESIZED.sub(r"\1", tail.split("/")[-1]).lower()
        hit = assets.get(name)
        if hit:
            return f'src="@asset/{hit}"'
        missing.add(tail)
        # Mark for removal — the file isn't in the export, and a broken
        # <img> is worse than no image. See missing-media.json.
        return 'src="" data-missing="1"'

    out = UPLOAD_SRC.sub(swap, out)
    # Remove the <img> (and any <figure>/<a> that only wrapped it).
    out = re.sub(r"<img[^>]*data-missing=\"1\"[^>]*>", "", out, flags=re.I)
    out = re.sub(r"<a[^>]*>\s*</a>", "", out, flags=re.I)
    out = re.sub(r"<figure[^>]*>\s*(?:<figcaption[^>]*>.*?</figcaption>)?\s*</figure>",
                 "", out, flags=re.I | re.S)
    out = HOSTS.sub("", out)
    out = STRIP_ATTRS.sub("", out)
    out = EMPTY_P.sub("", out)
    out = re.sub(r"\n{3,}", "\n\n", out)
    return out.strip()


def excerpt_from(stored, content, limit=180):
    if stored and stored.strip():
        text = stored
    else:
        text = re.sub(r"<[^>]+>", " ", content)
    text = html.unescape(re.sub(r"\s+", " ", text)).strip()
    if len(text) <= limit:
        return text
    return text[:limit].rsplit(" ", 1)[0].rstrip(",.;:") + "…"


def main():
    _, posts = read_table(DUMP, PREFIX + "posts")
    _, meta = read_table(DUMP, PREFIX + "postmeta")

    thumbs = {m["post_id"]: m["meta_value"]
              for m in meta if m["meta_key"] == "_thumbnail_id"}
    files = {m["post_id"]: m["meta_value"]
             for m in meta if m["meta_key"] == "_wp_attached_file"}

    assets = load_asset_index()
    missing = set()

    published = [p for p in posts
                 if p["post_type"] == "post" and p["post_status"] == "publish"]
    published.sort(key=lambda p: p["post_date"], reverse=True)

    out = []
    for p in published:
        body = clean(p["post_content"] or "", assets, missing)

        cover = None
        tid = thumbs.get(p["ID"])
        if tid and tid in files:
            name = RESIZED.sub(r"\1", files[tid].split("/")[-1]).lower()
            cover = assets.get(name)

        out.append({
            "slug": p["post_name"],
            "path": f'/blog/{p["post_name"]}',
            "title": html.unescape(p["post_title"]),
            "date": p["post_date"][:10],
            "excerpt": excerpt_from(p.get("post_excerpt"), body),
            "cover": cover,
            "html": body,
            "wpId": p["ID"],
        })

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as fh:
        json.dump(out, fh, indent=2, ensure_ascii=False)

    manifest = os.path.join(os.path.dirname(OUT), "missing-media.json")
    with open(manifest, "w", encoding="utf-8") as fh:
        json.dump({
            "note": "Referenced by blog posts but absent from the WordPress "
                    "export. Drop the originals into wp-content/uploads and "
                    "re-run extract_posts.py to restore them.",
            "count": len(missing),
            "files": sorted(missing),
        }, fh, indent=2)

    covered = sum(1 for p in out if p["cover"])
    print(f"  {len(out)} posts written to {OUT}")
    print(f"  {covered}/{len(out)} have a featured image available")
    print(f"  {len(missing)} missing images removed — listed in {manifest}")


if __name__ == "__main__":
    main()
