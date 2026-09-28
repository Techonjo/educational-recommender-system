from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class RecommendationRequest(BaseModel):
    course_id: str
    top_n: int = Field(10, ge=1, le=50)

class SearchRequest(BaseModel):
    query: str = Field(..., min_length=2, description="Free-text course or topic to search for")
    top_n: int = Field(10, ge=1, le=50)

class RecommendationItem(BaseModel):
    book_id: str
    title: str
    authors: Optional[str] = None
    cover_url: Optional[str] = None
    source_url: Optional[str] = None
    similarity_score: float
    matching_topics: str
    reason: str

class RecommendationResponse(BaseModel):
    success: bool
    course: dict
    recommendations: List[RecommendationItem]


# ── Video Schemas ─────────────────────────────────────────────────

class VideoSearchRequest(BaseModel):
    query: str = Field(..., min_length=2, description="Topic or subject to find videos for")
    top_n: int = Field(10, ge=1, le=25)

class VideoItem(BaseModel):
    video_id: str
    title: str
    description: Optional[str] = ""
    channel_name: Optional[str] = ""
    thumbnail_url: Optional[str] = ""
    published_at: Optional[str] = ""
    watch_url: str
    embed_url: str
    duration: Optional[str] = ""
    view_count: Optional[int] = 0
    similarity_score: float = 0.0

class VideoRecommendationResponse(BaseModel):
    success: bool
    query: str
    videos: List[VideoItem]
    requires_api_key: bool = False
    message: str = ""
