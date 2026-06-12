# Note: This module is the ONLY place that reads or writes products.csv.
# Keeping all file access here means the rest of the app works with plain
# Python dicts and never worries about CSV details.

import csv
from pathlib import Path

# Note: Paths are anchored to the project root (one level above api/) so the
# CSV files land in the same place no matter where the server is started from.
PROJECT_ROOT = Path(__file__).resolve().parents[1]
PRODUCTS_FILE = PROJECT_ROOT / "products.csv"
FIELDNAMES = ["id", "name", "quantity", "unit"]

# Note: Seed data for a coffee shop supply store. A couple of items are
# intentionally below the default threshold of 10 so /inventory/alerts has
# something to show on a fresh install.
SEED_PRODUCTS = [
    {"id": 1, "name": "Espresso Beans (1kg)", "quantity": 24, "unit": "bag"},
    {"id": 2, "name": "Oat Milk (1L)", "quantity": 8, "unit": "carton"},
    {"id": 3, "name": "Paper Cups 12oz", "quantity": 300, "unit": "unit"},
    {"id": 4, "name": "Cup Lids 12oz", "quantity": 180, "unit": "unit"},
    {"id": 5, "name": "Vanilla Syrup", "quantity": 5, "unit": "bottle"},
    {"id": 6, "name": "Cleaning Tablets", "quantity": 12, "unit": "box"},
]


def ensure_products_file() -> None:
    # Note: Auto-create the data file with seed rows if it does not exist yet.
    if not PRODUCTS_FILE.exists():
        save_products(SEED_PRODUCTS)


def load_products() -> list[dict]:
    # Note: Read every row and convert numeric columns back to ints
    # (CSV stores everything as strings).
    ensure_products_file()
    with open(PRODUCTS_FILE, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        return [
            {
                "id": int(row["id"]),
                "name": row["name"],
                "quantity": int(row["quantity"]),
                "unit": row["unit"],
            }
            for row in reader
        ]


def save_products(products: list[dict]) -> None:
    # Note: Rewrite the whole file on every change. At this scale (a small
    # store's inventory) that is a deliberate, simple persistence strategy.
    with open(PRODUCTS_FILE, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
        writer.writeheader()
        writer.writerows(products)


def next_id(products: list[dict]) -> int:
    # Note: Simple auto-increment; ids are never reused even after deletes.
    return max((p["id"] for p in products), default=0) + 1
