#!/usr/bin/env python3
"""Generate sitemap.xml from wordles.json data."""

import json
import os
from datetime import datetime

SITE_URL = "https://grit.garden"
DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "wordles.json")
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "sitemap.xml")


def generate():
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        entries = json.load(f)

    today = datetime.now().strftime("%Y-%m-%d")

    urls = []

    # Static pages
    urls.append(f"""  <url>
    <loc>{SITE_URL}/</loc>
    <lastmod>{today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>""")

    urls.append(f"""  <url>
    <loc>{SITE_URL}/garden.html</loc>
    <lastmod>{today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>""")

    # Poem pages
    for entry in sorted(entries, key=lambda e: e["date"], reverse=True):
        date = entry["date"]
        urls.append(f"""  <url>
    <loc>{SITE_URL}/poem.html?date={date}</loc>
    <lastmod>{date}</lastmod>
    <changefreq>never</changefreq>
    <priority>0.7</priority>
  </url>""")

    sitemap = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{chr(10).join(urls)}
</urlset>
"""

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        f.write(sitemap)

    print(f"Generated sitemap.xml with {len(urls)} URLs")


if __name__ == "__main__":
    generate()
