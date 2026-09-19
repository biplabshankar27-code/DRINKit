# DRINKit Product Catalog Asset Package

This package is prepared for the DRINKit development project.

## Included
- `data/products.json` — 120 seed products with structured product/AI metadata.
- `data/image-sources.json` — one image record per product.
- `scripts/download_images.py` — downloader for verified direct image URLs.
- `images/` — target directory structure for product images.
- `attribution/IMAGE-CREDITS.md` — attribution template.

## Important
The product prices are development/demo values and must be verified before production.
Image files are NOT falsely represented as downloaded. This environment cannot bulk-download external web images. Populate the image manifest with verified URLs/permissions, then run the downloader.

Wikimedia Commons contains liquor-bottle categories, but its guidance notes that product packaging can be copyrighted and each file's license must be checked individually.
