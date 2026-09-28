"""
YouTube Video Recommendation Service
--------------------------------------
Uses YouTube Data API v3 to fetch videos relevant to a query, then
re-ranks them using TF-IDF cosine similarity so the ML model drives ordering.

If no YOUTUBE_API_KEY is configured, returns a clear "no-key" signal
so the frontend can show an appropriate placeholder.
"""

import logging
import requests
from typing import List, Dict, Any, Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from app.config import settings

logger = logging.getLogger(__name__)

YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"
YOUTUBE_VIDEOS_URL = "https://www.googleapis.com/youtube/v3/videos"


def _fetch_youtube_videos(query: str, max_results: int = 20) -> List[Dict]:
    """
    Call YouTube Data API v3 search endpoint.
    Returns raw list of video items with snippet data.
    Retries once on connection/timeout errors.
    """
    params = {
        "part": "snippet",
        "q": query,
        "type": "video",
        "maxResults": max_results,
        "relevanceLanguage": "en",
        "safeSearch": "moderate",
        "key": settings.YOUTUBE_API_KEY,
    }
    for attempt in range(2):  # try twice
        try:
            resp = requests.get(YOUTUBE_SEARCH_URL, params=params, timeout=12)
            resp.raise_for_status()
            data = resp.json()
            return data.get("items", [])
        except requests.exceptions.Timeout:
            logger.warning(f"YouTube API timeout (attempt {attempt + 1}/2) for query: '{query}'")
            if attempt == 1:
                raise  # re-raise on second failure so caller can surface it
        except requests.exceptions.ConnectionError as e:
            logger.warning(f"YouTube API connection error (attempt {attempt + 1}/2): {e}")
            if attempt == 1:
                raise
        except Exception as e:
            logger.error(f"YouTube API search failed: {e}")
            return []
    return []


def _fetch_video_details(video_ids: List[str]) -> Dict[str, Dict]:
    """
    Fetch contentDetails (duration) and statistics (viewCount)
    for a list of video IDs. Returns a dict keyed by video_id.
    """
    if not video_ids:
        return {}
    params = {
        "part": "contentDetails,statistics",
        "id": ",".join(video_ids),
        "key": settings.YOUTUBE_API_KEY,
    }
    details: Dict[str, Dict] = {}
    try:
        resp = requests.get(YOUTUBE_VIDEOS_URL, params=params, timeout=10)
        resp.raise_for_status()
        for item in resp.json().get("items", []):
            vid_id = item["id"]
            duration_iso = item.get("contentDetails", {}).get("duration", "PT0S")
            view_count = item.get("statistics", {}).get("viewCount", "0")
            details[vid_id] = {
                "duration": _parse_iso8601_duration(duration_iso),
                "view_count": int(view_count),
            }
    except Exception as e:
        logger.warning(f"YouTube video details fetch failed: {e}")
    return details


def _parse_iso8601_duration(duration: str) -> str:
    """Convert PT1H2M3S → 1:02:03, PT5M30S → 5:30, etc."""
    import re
    pattern = re.compile(r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?")
    match = pattern.match(duration)
    if not match:
        return ""
    hours, minutes, seconds = (int(x or 0) for x in match.groups())
    if hours:
        return f"{hours}:{minutes:02d}:{seconds:02d}"
    return f"{minutes}:{seconds:02d}"


def _ml_rerank(query: str, videos: List[Dict], top_n: int) -> List[Dict]:
    """
    Re-rank video list using TF-IDF cosine similarity between the
    search query and each video's title + description text.

    Scoring strategy:
      1. Compute raw TF-IDF cosine similarity (0–1 range, rarely hits 1.0)
      2. Add a title-match bonus: if query words appear in the video title,
         the score is boosted (title relevance is a strong signal)
      3. Normalise scores so the top result always appears as ~95–100%
         (min-max normalisation scaled to a [0.55, 1.0] output range)

    This makes the displayed percentages meaningful and reaches near 100%
    for the best matching video.
    """
    if not videos:
        return videos

    query_words = set(query.lower().split())

    corpus = [f"{v['title']} {v['title']} {v['description']}" for v in videos]  # weight title 2x
    try:
        vectorizer = TfidfVectorizer(stop_words="english", max_features=5000)
        tfidf_matrix = vectorizer.fit_transform(corpus)
        query_vec = vectorizer.transform([query])
        raw_scores = cosine_similarity(query_vec, tfidf_matrix).flatten()

        # Title-match bonus: add 0.15 for each query word found in the title (capped at 0.4)
        boosted = []
        for i, video in enumerate(videos):
            title_words = set(video["title"].lower().split())
            overlap = len(query_words & title_words)
            bonus = min(overlap * 0.15, 0.4)
            boosted.append(float(raw_scores[i]) + bonus)

        # Min-max normalise into [0.55, 1.0] so the best result reads near 100%
        min_s, max_s = min(boosted), max(boosted)
        OUTPUT_MIN, OUTPUT_MAX = 0.55, 1.0
        if max_s == min_s:
            # All videos scored identically (or only one video) — give them all top score
            for video in videos:
                video["similarity_score"] = OUTPUT_MAX
        else:
            scale = max_s - min_s
            for i, video in enumerate(videos):
                normalised = (boosted[i] - min_s) / scale      # 0.0 – 1.0
                final = OUTPUT_MIN + normalised * (OUTPUT_MAX - OUTPUT_MIN)
                video["similarity_score"] = round(final, 4)

        videos.sort(key=lambda x: x["similarity_score"], reverse=True)

    except Exception as e:
        logger.warning(f"ML re-ranking failed (returning original order): {e}")
        for v in videos:
            v.setdefault("similarity_score", 0.0)

    return videos[:top_n]


def get_video_recommendations(query: str, top_n: int = 10) -> Dict[str, Any]:
    """
    Main entry point.
    Returns dict with keys:
      - success: bool
      - videos: list of video dicts
      - requires_api_key: bool  (True when no key is configured)
      - message: str
    """
    # --- Guard: No API key ---
    if not settings.YOUTUBE_API_KEY:
        return {
            "success": False,
            "videos": [],
            "requires_api_key": True,
            "message": (
                "YouTube recommendations require a free YouTube Data API v3 key. "
                "Add YOUTUBE_API_KEY=your_key to a .env file in the project root."
            ),
        }

    try:
        raw_items = _fetch_youtube_videos(query, max_results=min(top_n * 2, 25))
    except (requests.exceptions.Timeout, requests.exceptions.ConnectionError):
        return {
            "success": False,
            "videos": [],
            "requires_api_key": False,
            "message": (
                "Could not reach YouTube’s servers — your network timed out. "
                "Check your internet connection and try again."
            ),
        }

    if not raw_items:
        return {
            "success": False,
            "videos": [],
            "requires_api_key": False,
            "message": f"No YouTube videos found for '{query}'.",
        }

    # Normalise raw API items into our video schema
    videos: List[Dict] = []
    video_ids: List[str] = []

    for item in raw_items:
        vid_id = item.get("id", {}).get("videoId")
        if not vid_id:
            continue
        snippet = item.get("snippet", {})
        thumbnails = snippet.get("thumbnails", {})
        thumb = (
            thumbnails.get("high")
            or thumbnails.get("medium")
            or thumbnails.get("default")
            or {}
        )

        videos.append({
            "video_id": vid_id,
            "title": snippet.get("title", "Untitled"),
            "description": snippet.get("description", ""),
            "channel_name": snippet.get("channelTitle", ""),
            "thumbnail_url": thumb.get("url", ""),
            "published_at": snippet.get("publishedAt", ""),
            "watch_url": f"https://www.youtube.com/watch?v={vid_id}",
            "embed_url": f"https://www.youtube.com/embed/{vid_id}",
            "duration": "",
            "view_count": 0,
            "similarity_score": 0.0,
        })
        video_ids.append(vid_id)

    # Enrich with duration + view count
    details = _fetch_video_details(video_ids)
    for v in videos:
        d = details.get(v["video_id"], {})
        v["duration"] = d.get("duration", "")
        v["view_count"] = d.get("view_count", 0)

    # ML re-rank and trim to top_n
    ranked = _ml_rerank(query, videos, top_n)

    return {
        "success": True,
        "videos": ranked,
        "requires_api_key": False,
        "message": f"Found {len(ranked)} videos for '{query}'.",
    }
