"""
extract.py — turn the WordPress/WPBakery pages into a normalised
section model the React app can render.

Every Salient page here follows the same grammar: a stack of `vc_row`
bands, each with a background (colour, image or YouTube video) and a
handful of content blocks. We flatten each row to:

  { background: {...}, blocks: [ {type, ...}, ... ] }

Blocks are one of: heading | text | button | gallery | cards | form.
"""

import sys
from pathlib import Path

# Paths are resolved relative to this file so the extractors can be run
# from anywhere:  python scripts/extract.py [path/to/dump.sql]
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
import json
import re
import os
from dbread import read_table
import vcparse

DUMP = str(Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT.parent / "local.sql")
PREFIX = "18d8v6q_"

# attachment id -> path under src/assets, mirroring scripts/migrate-assets.mjs
ASSET_MAP = {
    "53": "logos/favicon-source.jpg",
    "54": "logos/logo-elegant-address-r.png",
    "55": "logos/logo-elegant-address.png",
    "56": "logos/logo-elegant-address-white-r.png",
    "57": "logos/logo-elegant-address-white.png",
    "126": "images/destinations/south-of-france.jpg",
    "127": "images/destinations/barbados.jpg",
    "161": "images/awards/award-badges.png",
    "162": "images/destinations/barbados-alt-1.jpg",
    "163": "images/destinations/south-of-france-alt-1.jpg",
    "164": "images/destinations/barbados-alt-2.jpg",
    "165": "images/destinations/south-of-france-alt-2.jpg",
    "171": "images/awards/queens-award-presentation.jpeg",
    "186": "images/backgrounds/penthouse-pool.jpg",
    "192": "images/about/team.jpg",
    "38724": "images/destinations/cassis-coast.jpeg",
    "38726": "images/destinations/monaco-facade.jpeg",
    "38728": "images/destinations/cannes-harbour.jpeg",
    "38729": "images/lifestyle/supercar.jpeg",
    "38733": "images/destinations/carlton-cannes.jpeg",
    "38735": "images/destinations/sunset-terrace.jpeg",
    "38736": "images/destinations/cannes-old-town.png",
    "38750": "images/lifestyle/cocktail.jpg",
    "38751": "images/lifestyle/dining.jpg",
    "38752": "images/lifestyle/private-jet.jpg",
    "38753": "images/lifestyle/rolls-royce.jpg",
    "38754": "images/lifestyle/shopping.jpg",
    "38755": "images/lifestyle/yacht-alt.jpg",
    "38763": "images/lifestyle/yacht.jpg",
    "38768": "images/properties/property-13-poolside.png",
    "38769": "images/properties/property-01-infinity-pool.jpeg",
    "38770": "images/properties/property-02-estate-lawn.jpeg",
    "38772": "images/properties/property-03-courtyard-pool.jpeg",
    "38795": "images/properties/property-04-formal-gardens.jpeg",
    "38796": "images/properties/property-05-terraced-gardens.jpeg",
    "38797": "images/properties/property-06-glass-orangery.jpeg",
    "38798": "images/properties/property-07-cloister.jpeg",
    "38799": "images/properties/property-08-dining-room.jpeg",
    "38800": "images/properties/property-09-loggia.jpeg",
    "38801": "images/properties/property-10-frescoed-suite.jpeg",
    "38802": "images/properties/property-11-bedroom.jpeg",
    "38817": "images/properties/property-12-villa-pool.jpeg",
    "38839": "images/backgrounds/barbados.png",
    "38841": "images/backgrounds/barbados-alt.jpg",
}

# WordPress slug -> React route. The nav and in-page buttons disagree on
# the South of France page (menu points at /france, buttons at
# /south-of-france); we standardise on the descriptive slug and redirect
# the old one.
SLUG_REWRITE = {
    "france": "south-of-france",
    "home": "",
}

# The published `page` records that actually carry content.
PAGES = ["home", "france", "barbados", "about", "contact",
         "approach", "featured-properties", "cannes-congress"]

# Nine further pages are published in WordPress but have a completely
# empty post_content — they are stubs, not content we failed to read:
#
#   saint-jean-cap-ferrat, cap-dantibes, cannes,
#   villefranche-and-villages, saint-tropez, mougins-and-villages
#       → targets of the region grid on the South of France page. The
#         grid's own link_url is "#", so they were never wired up live.
#   blog                → posts index, rendered by the theme's template
#   terms-and-conditions, 404-page → empty
#
# They are listed in src/data/stubs.js so the nav can link honestly
# rather than 404.
EMPTY_PAGES = [
    "saint-jean-cap-ferrat", "cap-dantibes", "cannes",
    "villefranche-and-villages", "saint-tropez", "mougins-and-villages",
    "blog", "terms-and-conditions", "404-page",
]


def asset(aid):
    aid = (aid or "").strip()
    return ASSET_MAP.get(aid)


def youtube_id(url):
    m = re.search(r"(?:v=|youtu\.be/)([A-Za-z0-9_\-]{6,})", url or "")
    return m.group(1) if m else None


def rewrite_url(url):
    if not url:
        return url
    url = url.strip()
    if url.startswith(("tel:", "mailto:", "http", "#")):
        return re.sub(r"tel:\+?44\s*\(0\)?", "tel:+44", url).replace(" ", "")
    slug = url.strip("/")
    return "/" + SLUG_REWRITE.get(slug, slug)


def walk_blocks(nodes, out):
    """Flatten a row's descendants into ordered content blocks."""
    for n in nodes:
        tag, a = n["tag"], n["attrs"]

        if tag == "split_line_heading" and a.get("text_content"):
            out.append({
                "type": "heading",
                "level": a.get("font_style", "h3"),
                "text": vcparse.clean_text(a["text_content"]),
                "color": a.get("text_color"),
            })

        elif tag == "vc_custom_heading" and a.get("text"):
            out.append({"type": "heading", "level": "h4",
                        "text": vcparse.clean_text(a["text"])})

        elif tag == "vc_column_text":
            body = vcparse.clean_text(n["text"])
            if body:
                paras = [p.strip() for p in body.split("\n") if p.strip()]
                out.append({"type": "text", "paragraphs": paras})

        elif tag == "nectar_btn" and a.get("text"):
            out.append({"type": "button",
                        "label": vcparse.clean_text(a["text"]),
                        "href": rewrite_url(a.get("url", "#"))})

        elif tag == "vc_gallery" and a.get("images"):
            imgs = [asset(i) for i in a["images"].split(",")]
            out.append({"type": "gallery",
                        "images": [i for i in imgs if i]})

        elif tag == "fancy_box":
            out.append({"type": "card",
                        "label": vcparse.clean_text(n["text"]),
                        "image": asset(a.get("image_url")),
                        "href": rewrite_url(a.get("url", ""))})

        elif tag == "image_with_animation" and a.get("image_url"):
            img = asset(a["image_url"])
            if img:
                out.append({"type": "image", "src": img})

        walk_blocks(n["children"], out)

        # Contact Form 7 is embedded as raw text inside a column
        txt = n["text"] or ""
        m = re.search(r'\[contact-form-7 id="(\d+)"', txt)
        if m:
            out.append({"type": "form", "formId": m.group(1)})

    return out


def group_cards(blocks):
    """Merge consecutive `card` blocks into one `cards` grid."""
    merged, buf = [], []
    for b in blocks:
        if b["type"] == "card":
            buf.append(b)
            continue
        if buf:
            merged.append({"type": "cards",
                           "items": [{k: v for k, v in c.items() if k != "type"}
                                     for c in buf]})
            buf = []
        merged.append(b)
    if buf:
        merged.append({"type": "cards",
                       "items": [{k: v for k, v in c.items() if k != "type"}
                                 for c in buf]})
    return merged


def find_inners(nodes, depth=0):
    """Direct `vc_row_inner` descendants, not recursing into nested ones."""
    found = []
    for n in nodes:
        if n["tag"] == "vc_row_inner":
            found.append(n)
        elif n["tag"] in ("vc_column",):
            found.extend(find_inners(n["children"], depth + 1))
    return found


def extract_page(post):
    tree = vcparse.parse(post["post_content"])
    sections = []

    for row in tree:
        if row["tag"] != "vc_row":
            continue
        a = row["attrs"]

        # A row may hold several `vc_row_inner` bands (e.g. the home page
        # stacks "South of France" and "Barbados" inside one row). Keep
        # them apart so the renderer can alternate the media side.
        inners = find_inners(row["children"])
        if len(inners) > 1:
            groups = [group_cards(walk_blocks([i], [])) for i in inners]
            groups = [g for g in groups if g]
        else:
            groups = [group_cards(walk_blocks(row["children"], []))]
            groups = [g for g in groups if g]

        if not groups:
            continue

        blocks = [b for g in groups for b in g]

        bg = {}
        if a.get("bg_color"):
            bg["color"] = a["bg_color"].lower()
        if asset(a.get("bg_image")):
            bg["image"] = asset(a["bg_image"])
        if a.get("color_overlay"):
            bg["overlay"] = a["color_overlay"]
        vid = youtube_id(a.get("video_external"))
        if vid:
            bg["video"] = vid

        sections.append({"background": bg, "groups": groups, "blocks": blocks})

    slug = SLUG_REWRITE.get(post["post_name"], post["post_name"])
    return {
        "slug": slug,
        "path": "/" + slug,
        "title": post["post_title"],
        "wpId": post["ID"],
        "wpSlug": post["post_name"],
        "sections": sections,
    }


def main():
    _, posts = read_table(DUMP, PREFIX + "posts")
    pages = {p["post_name"]: p for p in posts
             if p["post_type"] == "page" and p["post_status"] == "publish"}

    out = [extract_page(pages[s]) for s in PAGES if s in pages]

    os.makedirs(str(ROOT / "src/data/content"), exist_ok=True)
    with open(str(ROOT / "src/data/content/pages.json"), "w", encoding="utf-8") as fh:
        json.dump(out, fh, indent=2, ensure_ascii=False)

    for p in out:
        blocks = sum(len(s["blocks"]) for s in p["sections"])
        print(f'  {p["path"]:<24} {len(p["sections"])} sections, {blocks} blocks')


if __name__ == "__main__":
    main()
