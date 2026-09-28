"""
fetch_openlibrary_books.py
==========================
Fetch Computer Science books from the Open Library Search API and
seed them directly into the local SQLite database.

NO DUMP FILE NEEDED — uses the free public API.

Usage:
    python scripts/fetch_openlibrary_books.py

What it does:
  1. Searches Open Library for books across ~15 CS subjects
  2. Fetches up to 100 books per subject (configurable)
  3. De-duplicates by book_id
  4. Inserts new books into the database
  5. Rebuilds the TF-IDF recommendation model automatically
"""

import sys
import os
import time
import json
import logging

# Allow running from the project root
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import requests
from app.database import SessionLocal
from app.models.book import Book
from app.models import init_db

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

# ─── Configuration ────────────────────────────────────────────────────────────

SUBJECTS = [
    "computer_science",
    "computer_programming",
    "algorithms",
    "data_structures",
    "artificial_intelligence",
    "machine_learning",
    "software_engineering",
    "operating_systems",
    "computer_networks",
    "database_management",
    "cybersecurity",
    "web_development",
    "computer_architecture",
    "discrete_mathematics",
    "data_science",
]

BOOKS_PER_SUBJECT = 100   # max 100 per API call; increase if you want more
REQUEST_DELAY    = 0.5    # seconds between requests (be polite to the API)
BASE_URL         = "https://openlibrary.org/subjects/{subject}.json?limit={limit}"

# ─── Helpers ──────────────────────────────────────────────────────────────────

def fetch_subject(subject: str, limit: int = 100) -> list[dict]:
    """Fetch books for a single subject from the Open Library Subjects API."""
    url = BASE_URL.format(subject=subject, limit=limit)
    try:
        resp = requests.get(url, timeout=15)
        resp.raise_for_status()
        data = resp.json()
        works = data.get("works", [])
        logger.info(f"  [{subject}] fetched {len(works)} works")
        return works
    except Exception as e:
        logger.warning(f"  [{subject}] failed: {e}")
        return []


def work_to_book(work: dict, subject: str) -> dict | None:
    """Convert a Subjects API work entry to a flat book dict."""
    key = work.get("key", "")           # e.g. /works/OL12345W
    if not key:
        return None

    book_id = key.replace("/works/", "OL_")   # e.g. OL_12345W

    title = work.get("title", "").strip()
    if not title:
        return None

    # Authors list → comma-separated string
    authors = ", ".join(
        a.get("name", "") for a in work.get("authors", []) if a.get("name")
    )

    # Subjects list → semicolon-separated string
    subjects_list = work.get("subject", []) or []
    subjects_str  = "; ".join(str(s) for s in subjects_list[:20])  # cap length

    cover_id = work.get("cover_id")
    cover_url = (
        f"https://covers.openlibrary.org/b/id/{cover_id}-M.jpg"
        if cover_id
        else None
    )

    first_publish_year = work.get("first_publish_year")

    return {
        "book_id":          book_id,
        "title":            title,
        "authors":          authors or None,
        "subjects":         subjects_str or subject.replace("_", " "),
        "publication_date": str(first_publish_year) if first_publish_year else None,
        "cover_url":        cover_url,
        "source_url":       f"https://openlibrary.org{key}",
    }


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    logger.info("Initialising database …")
    init_db()

    db = SessionLocal()
    inserted = 0
    skipped  = 0
    seen_ids: set[str] = set()

    try:
        for subject in SUBJECTS:
            logger.info(f"Fetching subject: {subject}")
            works = fetch_subject(subject, limit=BOOKS_PER_SUBJECT)

            for work in works:
                book_data = work_to_book(work, subject)
                if not book_data:
                    continue

                book_id = book_data["book_id"]
                if book_id in seen_ids:
                    skipped += 1
                    continue
                seen_ids.add(book_id)

                # Skip if already in DB
                existing = db.query(Book).filter(Book.book_id == book_id).first()
                if existing:
                    skipped += 1
                    continue

                db.add(Book(**book_data))
                inserted += 1

            db.commit()
            logger.info(f"  Committed batch. Total inserted so far: {inserted}")
            time.sleep(REQUEST_DELAY)

    finally:
        db.close()

    logger.info(f"\n Done! Inserted {inserted} new books, skipped {skipped} duplicates.")

    # Automatically rebuild the recommendation model
    if inserted > 0:
        logger.info("\n Rebuilding recommendation model …")
        import subprocess
        result = subprocess.run(
            [sys.executable, "scripts/build_model.py"],
            capture_output=True, text=True
        )
        print(result.stdout)
        if result.returncode == 0:
            logger.info(" Model rebuilt successfully.")
        else:
            logger.error(f" Model rebuild failed:\n{result.stderr}")
    else:
        logger.info("No new books inserted — model rebuild skipped.")


if __name__ == "__main__":
    main()
