from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.recommendation import (
    RecommendationRequest, RecommendationResponse, SearchRequest,
    VideoSearchRequest, VideoRecommendationResponse,
)
from app.services import course_service, interaction_service
from app.services.recommendation_service import recommendation_service
from app.services.open_library_search import search_and_recommend
from app.services.youtube_service import get_video_recommendations
from app.core.security import get_current_user
from app.models.user import User
from app.models.book import Book

router = APIRouter()

@router.post("/recommendations", response_model=RecommendationResponse)
def get_recommendations_for_course(request: RecommendationRequest, db: Session = Depends(get_db)):
    course = course_service.get_course(db, course_id=request.course_id)
    if course is None:
        raise HTTPException(status_code=404, detail={"success": False, "message": "Course not found", "error_code": "COURSE_NOT_FOUND"})
    
    recommendations = recommendation_service.get_recommendations(db, course, top_n=request.top_n)
    
    return RecommendationResponse(
        success=True,
        course={"course_id": course.course_id, "course_title": course.course_title},
        recommendations=recommendations
    )

@router.post("/recommendations/search", response_model=RecommendationResponse)
def search_books_live(request: SearchRequest):
    """
    Live Open Library search — accepts any free-text course or topic.
    Does NOT require a pre-seeded course in the database.
    """
    books = search_and_recommend(request.query, top_n=request.top_n)
    return RecommendationResponse(
        success=True,
        course={"course_id": "live_search", "course_title": request.query},
        recommendations=books
    )

@router.get("/recommendations/personalized", response_model=RecommendationResponse)
def get_personalized_recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    True Personalization: Fetches books based on the user's interaction history.
    Extracts topics from interacted books and performs a smart Open Library search.
    """
    interactions = interaction_service.get_user_interactions(db, user_id=current_user.user_id)

    final_recommendations = []
    seen_ids = set()

    # Try Collaborative Filtering first (works when user is in training data)
    if interactions:
        interacted_book_ids = [inter.book_id for inter in interactions]
        cf_recommendations = recommendation_service.get_collaborative_recommendations(
            db=db,
            user_id=current_user.user_id,
            interacted_book_ids=interacted_book_ids,
            top_n=10
        )
        if cf_recommendations:
            final_recommendations.extend(cf_recommendations)
            for r in cf_recommendations:
                seen_ids.add(r['book_id'])

    # If CF didn't fill the quota, use Content-Based / Open Library search
    if len(final_recommendations) < 10:
        # Build a topic profile from the user's interaction course_id labels
        # (these are clean strings like "Machine Learning", "World History" set by the frontend)
        topics = set()
        if interactions:
            ignored_labels = {"live_search", "ignored", "personalized", "Personalized For You", "For You", None, ""}
            for inter in interactions:
                if inter.course_id:
                    raw_label = str(inter.course_id).strip()
                    if raw_label not in ignored_labels:
                        # Split by comma in case the frontend sent a joined string from onboarding
                        for part in raw_label.split(','):
                            clean_part = part.strip()
                            if clean_part and clean_part not in ignored_labels:
                                topics.add(clean_part)

            # If no clean course labels, try subjects from local DB books
            if not topics:
                # We need interacted_book_ids again
                interacted_book_ids = [inter.book_id for inter in interactions]
                books_in_db = db.query(Book).filter(Book.book_id.in_(interacted_book_ids)).all()
                for book in books_in_db:
                    if book.subjects:
                        book_topics = [s.strip() for s in book.subjects.split(',')]
                        clean = [t for t in book_topics if len(t) < 35]
                        topics.update(clean[:2])

        # If still no topics (brand new user), use popular broad subjects so the page is never empty
        if not topics:
            topics = {"Science", "History", "Literature", "Philosophy", "Mathematics"}

        import random
        # Pick a single random topic to avoid an overly restrictive query (ANDing unrelated subjects yields 0 results)
        profile_query = random.choice(list(topics))

        needed = 10 - len(final_recommendations)
        recommended_books = search_and_recommend(profile_query, top_n=needed + 5)
        
        for book in recommended_books:
            if len(final_recommendations) >= 10:
                break
            if book['book_id'] not in seen_ids:
                final_recommendations.append(book)
                seen_ids.add(book['book_id'])

    # ULTIMATE FALLBACK: If Open Library failed/timed out, fill with local DB books
    if len(final_recommendations) < 10:
        needed = 10 - len(final_recommendations)
        from sqlalchemy.sql.expression import func
        fallback_books = db.query(Book).order_by(func.random()).limit(needed + 5).all()
        
        for book in fallback_books:
            if len(final_recommendations) >= 10:
                break
            if book.book_id not in seen_ids:
                final_recommendations.append({
                    "book_id": book.book_id,
                    "title": book.title,
                    "authors": book.authors,
                    "cover_url": book.cover_url,
                    "source_url": book.source_url,
                    "similarity_score": 0.0,
                    "matching_topics": book.subjects if book.subjects else "",
                    "reason": "Highly rated book from our core library."
                })
                seen_ids.add(book.book_id)

    return RecommendationResponse(
        success=True,
        course={"course_id": "personalized", "course_title": "For You"},
        recommendations=final_recommendations
    )


@router.post("/recommendations/videos", response_model=VideoRecommendationResponse)
def get_video_recommendations_endpoint(request: VideoSearchRequest):
    """
    YouTube Video Recommendations.
    Uses YouTube Data API v3 to find relevant videos, then re-ranks
    them with TF-IDF cosine similarity (same ML approach as book search).

    Requires YOUTUBE_API_KEY set in the environment / .env file.
    Returns requires_api_key=True when no key is configured so the
    frontend can render a helpful setup prompt instead of an error.
    """
    result = get_video_recommendations(request.query, top_n=request.top_n)
    return VideoRecommendationResponse(
        success=result["success"],
        query=request.query,
        videos=result["videos"],
        requires_api_key=result.get("requires_api_key", False),
        message=result.get("message", ""),
    )
