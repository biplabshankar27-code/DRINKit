#!/usr/bin/env python3
"""
DRINKit image downloader.
Fill data/image-sources.json with verified direct image URLs before running.
Only download images whose license/permission has been verified for your intended use.
"""
import json, os, hashlib
from pathlib import Path
from urllib.request import Request, urlopen

ROOT=Path(__file__).resolve().parents[1]
manifest=json.loads((ROOT/"data/image-sources.json").read_text(encoding="utf-8"))
for item in manifest["products"]:
    url=item.get("source_url")
    if not url or not item.get("verified"):
        continue
    dest=ROOT/"images"/item["image_filename"]
    dest.parent.mkdir(parents=True,exist_ok=True)
    req=Request(url,headers={"User-Agent":"DRINKit asset downloader/1.0"})
    with urlopen(req,timeout=30) as r:
        data=r.read()
    dest.write_bytes(data)
    print("Downloaded:",dest)
