"""
open_library_search.py
======================
Live Open Library search service.
Given a free-text query (any course or topic), it:
  1. Queries the Open Library Search API
  2. Parses and ranks the results
  3. Returns structured book dicts with working source_url/cover_url
"""

import requests
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

OL_SEARCH_URL = "https://openlibrary.org/search.json"


def _query_open_library(query: str, limit: int = 40) -> List[Dict]:
    """Hit the Open Library full-text search API and return raw doc list."""
    params = {
        "q": query,
        "limit": limit,
        "fields": "key,title,author_name,subject,cover_i,first_publish_year,publisher,isbn",
        "mode": "everything",
    }
    try:
        resp = requests.get(OL_SEARCH_URL, params=params, timeout=15)
        resp.raise_for_status()
        return resp.json().get("docs", [])
    except Exception as e:
        logger.warning(f"Open Library search failed for '{query}': {e}")
        return []


def _doc_to_book(doc: Dict, query_lower: str) -> Dict[str, Any] | None:
    """Convert a raw OL search doc to our standardised book dict."""
    key = doc.get("key", "")
    title = (doc.get("title") or "").strip()
    if not key or not title:
        return None

    book_id = "OL_" + key.replace("/works/", "")

    authors = ", ".join(doc.get("author_name") or []) or None
    subjects = doc.get("subject") or []
    subjects_str = "; ".join(str(s) for s in subjects[:20])

    cover_id = doc.get("cover_i")
    cover_url = f"https://covers.openlibrary.org/b/id/{cover_id}-M.jpg" if cover_id else None
    source_url = f"https://openlibrary.org{key}"
    pub_year = doc.get("first_publish_year")

    # Simple relevance score: count how many subject words match the query
    subject_text = subjects_str.lower()
    query_words = set(query_lower.split())
    match_count = sum(1 for w in query_words if w in subject_text or w in title.lower())

    return {
        "book_id": book_id,
        "title": title,
        "authors": authors,
        "cover_url": cover_url,
        "source_url": source_url,
        "subjects": subjects_str,
        "publication_date": str(pub_year) if pub_year else None,
        "_match_count": match_count,
    }


def search_and_recommend(query: str, top_n: int = 10) -> List[Dict[str, Any]]:
    """
    Main entry point. Returns a ranked list of recommendation dicts
    ready to be serialised by the API.
    """
    query_lower = query.lower().strip()
    docs = _query_open_library(query, limit=max(top_n * 4, 40))

    books = []
    seen_ids = set()
    seen_titles = set()

    for doc in docs:
        item = _doc_to_book(doc, query_lower)
        if not item:
            continue
        if item["book_id"] in seen_ids:
            continue
        title_key = item["title"].lower()
        if title_key in seen_titles:
            continue
        seen_ids.add(item["book_id"])
        seen_titles.add(title_key)
        books.append(item)

    # Sort: higher match count first, then just natural API order (already relevance-ranked)
    books.sort(key=lambda b: b["_match_count"], reverse=True)

    results = []
    for book in books[:top_n]:
        match_count = book.pop("_match_count", 0)
        reason = (
            f"Matched {match_count} topic keyword(s) related to '{query}'."
            if match_count > 0
            else f"Selected by Open Library for the topic '{query}'."
        )
        results.append({
            "book_id": book["book_id"],
            "title": book["title"],
            "authors": book.get("authors"),
            "cover_url": book.get("cover_url"),
            "source_url": book["source_url"],
            "similarity_score": round(min(match_count / max(len(query.split()), 1), 1.0), 4),
            "matching_topics": book.get("subjects", ""),
            "reason": reason,
        })

    return results
