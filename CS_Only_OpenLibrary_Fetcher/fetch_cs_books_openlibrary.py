"""
CS-only Open Library dataset fetcher.

This is intended for a manageable development catalogue, not bulk harvesting.
Open Library recommends low-volume API use and provides monthly dumps for
true bulk access. The script uses caching, a delay between requests, and
deduplicates works.
"""

import csv
import json
import re
import time
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen

BASE_URL = "https://openlibrary.org/search.json"
MAX_PER_SUBJECT = 50
REQUEST_DELAY_SECONDS = 1.2

SUBJECTS = [
    "computer science", "programming", "data structures", "algorithms",
    "artificial intelligence", "machine learning", "software engineering",
    "cybersecurity", "computer networks", "databases", "operating systems",
    "web development", "cloud computing", "data science", "computer graphics",
    "computer vision", "natural language processing", "distributed systems",
    "computer architecture", "cryptography",
]

CACHE_DIR = Path("data/openlibrary_cache")
OUTPUT = Path("data/computer_science_books_openlibrary.csv")


def clean(value):
    if value is None:
        return ""
    if isinstance(value, list):
        return "; ".join(str(x) for x in value if x)
    return str(value).strip()


def slug(text):
    return re.sub(r"[^a-z0-9]+", "_", text.lower()).strip("_")


def fetch(subject):
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    cache = CACHE_DIR / f"{slug(subject)}.json"

    if cache.exists():
        print(f"[CACHE] {subject}")
        return json.loads(cache.read_text(encoding="utf-8"))

    params = {
        "q": f'subject:"{subject}"',
        "fields": "key,title,author_name,first_publish_year,subject,isbn,publisher,number_of_pages_median,cover_i,language",
        "limit": MAX_PER_SUBJECT,
        "page": 1,
    }

    url = BASE_URL + "?" + urlencode(params)
    req = Request(
        url,
        headers={"User-Agent": "AI-Book-Recommender-Student-Project/1.0"},
    )

    print(f"[FETCH] {subject}")
    with urlopen(req, timeout=60) as response:
        data = json.load(response)

    cache.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
    return data


def main():
    records = {}

    for i, subject in enumerate(SUBJECTS):
        try:
            data = fetch(subject)

            for doc in data.get("docs", []):
                key = doc.get("key")
                if not key:
                    continue

                if key not in records:
                    records[key] = {
                        "book_id": key.replace("/works/", ""),
                        "openlibrary_key": key,
                        "title": clean(doc.get("title")),
                        "authors": clean(doc.get("author_name")),
                        "first_publish_year": doc.get("first_publish_year") or "",
                        "subjects": clean(doc.get("subject")),
                        "isbn": clean(doc.get("isbn")),
                        "publisher": clean(doc.get("publisher")),
                        "pages": doc.get("number_of_pages_median") or "",
                        "cover_id": doc.get("cover_i") or "",
                        "languages": clean(doc.get("language")),
                        "matched_subject": subject,
                        "source": "Open Library Search API",
                    }
                elif subject not in records[key]["matched_subject"].split("; "):
                    records[key]["matched_subject"] += "; " + subject

        except Exception as e:
            print(f"[ERROR] {subject}: {e}")

        if i < len(SUBJECTS) - 1:
            time.sleep(REQUEST_DELAY_SECONDS)

    rows = sorted(records.values(), key=lambda x: x["title"].lower())
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)

    fields = [
        "book_id", "openlibrary_key", "title", "authors",
        "first_publish_year", "subjects", "isbn", "publisher",
        "pages", "cover_id", "languages", "matched_subject", "source",
    ]

    with OUTPUT.open("w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)

    print(f"\nDONE: {len(rows)} unique CS-focused books saved to {OUTPUT}")


if __name__ == "__main__":
    main()
