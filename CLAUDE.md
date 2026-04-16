# myadminextra — CLAUDE.md

## What This Module Is

A personal PrestaShop 1.7 admin-enhancement module for **gellifique.co.uk** (UK) and **gellifique.eu** (EU) — a nail/beauty product ecommerce store. Written by the repo owner (vallka) over several years. It is not a general-purpose module; it is tightly coupled to the owner's specific store setup, external APIs, and operational workflows.

Version: 0.1.7.1

---

## Directory Layout

```
myadminextra/
├── myadminextra.php               # Main module file — hooks, install, config page
├── upload.php                     # DPD CSV upload endpoint (updates shipping numbers)
├── cron.php                       # Cron: sends review-invite emails after delivery
├── product_feed.php               # Google Shopping / generic product feed
├── product_feed_gs1.php           # GS1-format product feed
├── product_feed_fb.php            # Facebook product feed (UK)
├── product_feed_fbeu.php          # Facebook product feed (EU)
├── get_products_ean13.php         # Returns product EAN13 / price data (DYMO labels)
├── printDeliverySlips.php         # Legacy standalone delivery-slip PDF script
├── bartest.php                    # Barcode test page
├── controllers/
│   └── admin/
│       └── AdminPrintDeliverySlipsController.php  # Proper controller for delivery PDFs
├── views/
│   ├── css/myadminextra.css       # Minimal admin styling
│   ├── js/myadminextra.js         # MAIN FILE — 2 000+ lines of admin UI enhancement
│   ├── js/myadminextra-old.js     # Old reference copy (do not ship)
│   ├── js/myadminextra-1768.js    # Timestamped snapshot (do not ship)
│   ├── js/myadminextra (conflicted).js    # Stale merge artifact — can be deleted
│   ├── js/myadminextra (conflicted 1).js  # Stale merge artifact — can be deleted
│   └── js/JsBarcode.ean-upc.min.js        # Barcode-rendering library
│   └── templates/admin/configure.tpl      # Module config page template
├── sql/
│   ├── install.php                # Creates ps_myadminextra table (currently unused)
│   └── uninstall.php
├── mails/en/                      # Email templates (review-invite, follow-up series)
├── translations/en.php
└── upgrade/upgrade-1.1.0.php
```

---

## Core Architecture

### How the Module Works

1. **Hook `backOfficeHeader`** — injects `myadminextra.css` and `myadminextra.js` into every admin page.
2. **The JS file does everything.** On `$(document).ready` it detects which admin page is loaded (by inspecting the URL or DOM) and runs the relevant setup functions.
3. **External API calls** from the browser (not from PHP) hit `app.gellifique.co.uk` and `blog.gellifique.co.uk` to read/write orders, products, notes, shipping data.
4. **PrestaShop WebAPI** (`/api/`) is also called directly from JS to read orders, addresses, customers, carriers.

### Domain Detection

```js
let domain = 'uk';
if (window.location.hostname.indexOf('.eu') > -1) domain = 'eu';
if (window.location.hostname.indexOf('test.') > -1) domain = 'test';
```

This single switch controls which API endpoints and keys the JS uses throughout.

---

## What the JS Does (Feature Map)

| Function | Triggered on | Purpose |
|---|---|---|
| `setup_order_list()` | Orders list page | Enriches grid: shipping status, carrier, postcode, tracking links |
| `setup_orders_bulk_actions()` | Orders list page | Adds DPD CSV, DHL CSV, Print Slips, Upload CSV buttons |
| `setup_tracking_info_bo()` | Order detail page | Converts raw tracking numbers to clickable carrier links |
| `get_tracking_a()` | Order detail page | Maps carrier patterns (Royal Mail, UPS, DPD, DHL, Hermes…) to tracking URLs |
| `setup_order_in_stock()` | Order detail page | Shows per-product in-stock status at time of order |
| `setup_add_order_by_barcode()` | Order detail page | EAN13 barcode scan → add product to cart |
| `setup_product_list()` | Products catalog page | Enriches grid: ES names, stock, EAN13 validity, supplier ref, monthly qty |
| `setup_bulk_actions()` | Products catalog page | Adds bulk update, DYMO labels CSV, SQL/JSON debug actions |
| `do_bulk_update()` | Products catalog page | Batch-edit names, descriptions, prices, features, categories, stock status |
| `setup_product_actions()` | Single product page | Adds toolbar buttons: stock stats, orders report |
| `setup_product_pack_info()` | Single product page | Shows pack component availability |
| `setup_productnotes_actions()` | Product list + detail | CRUD notes stored on blog.gellifique.co.uk |
| `setup_product_reorder()` | Products catalog page | Modal iframe for drag-reorder of products |
| `setup_customer()` | Customer detail page | Shows certificates, referrer, Instagram link from app API |
| `setup_transcopy_actions()` | EU product pages | Copies product data from UK API into EU form fields |
| `setup_dhl_button()` | Order detail page | DHL shipment creation / label print |
| `setup_ups_button()` | Order detail page | UPS shipment creation / label print / tracking |
| `csv_for_dpd()` | Orders bulk action | Generates DPD export CSV with calculated dispatch date |
| `get_dhl()` | Orders bulk action | Generates DHL batch CSV |
| `printDeliverySlips()` | Orders bulk action | Opens delivery-slip PDF for selected orders |

---

## External Dependencies

### APIs (hardcoded in JS — visible to browser)

| Host | Purpose | Auth token in JS |
|---|---|---|
| `app.gellifique.co.uk` | Shipping, bulk product ops, customer data, DHL/UPS | `6b246cc18769c6ec02dc20009649d5ae5903d454` |
| `blog.gellifique.co.uk` | Product notes, product reorder iframe | `e98f798b7deda3402bdae0d6f42f786dd7082a4c` |
| `www.gellifique.co.uk/api/` | PS WebAPI (UK) | key `P7PBB7VK2Z5NZLQ27LRE314I3XMT7R65` |
| `www.gellifique.eu/api/` | PS WebAPI (EU) | key `GDMMH7YNA6KYW51J5CZWVCFT62J7R34W` |
| `test.gellifique.co.uk` | Test environment | |

### PrestaShop Config Keys Used

| Key | Purpose |
|---|---|
| `MYADMINEXTRA_LIVE_MODE` | Boolean toggle (mostly unused) |
| `MYADMINEXTRA_CSS_TS` | Timestamp for CSS cache-busting |
| `MYADMINEXTRA_JS_TS` | Timestamp for JS cache-busting |
| `MYADMINEXTRA_CAT_IMG_TS` | Timestamp for catalog image cache |
| `MYADMINEXTRA_ACCOUNT_EMAIL` | Account email (stored in config) |
| `MYADMINEXTRA_ACCOUNT_PASSWORD` | Account password (stored in config — security risk) |

---

## Known Issues / Quirks

1. **`ps_myadminextra` table** is created on install but never used — placeholder only.
2. **`true ||` in main dispatch condition** — `if (true || myadminextra_param==1 || myadminextra_param==3)` means the block always executes regardless of employee ID. Likely a debugging leftover.
3. **Conflicted JS files** (`myadminextra (conflicted).js`, `myadminextra (conflicted 1).js`) are stale merge artifacts, identical to each other, older than the current file. Safe to delete.
4. **Multiple old JS snapshots** (`myadminextra-old.js`, `myadminextra-1768.js`) clutter `views/js/` but are not loaded.
5. **Hardcoded API tokens** in JS are browser-visible. This is accepted for a private admin-only module.
6. **`upload.php` referrer check** is not CSRF-safe — relies on `HTTP_REFERER`.
7. **Mixed async styles** — some functions use `async/await`, others use jQuery `.ajax()` callbacks.
8. **Heavy global state** — variables like `tracking_link`, `transcopy_data`, `qqq`, `ups_error` pollute global scope.

---

## Working Conventions

- **Do not touch the old/conflicted JS files** unless explicitly asked.
- **The active JS is `views/js/myadminextra.js`** — all JS changes go here.
- **CSS changes** go in `views/css/myadminextra.css`.
- **No build step** — JS and CSS are served directly. Cache-busting is done via the `MYADMINEXTRA_JS_TS` / `MYADMINEXTRA_CSS_TS` config values (updated manually or via config page).
- **PrestaShop 1.7 conventions** apply: Smarty templates, HelperForm, ModuleAdminController.
- The module is tightly coupled to specific store APIs — do not generalise or abstract away domain-specific logic unless asked.
