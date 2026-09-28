import os
import joblib
import json
import logging
from typing import List, Dict, Any
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from app.config import settings
from sqlalchemy.orm import Session
from app.models.book import Book

logger = logging.getLogger(__name__)

class RecommendationService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(RecommendationService, cls).__new__(cls)
            cls._instance._load_model()
        return cls._instance

    def _load_model(self):
        # Load content-based models
        try:
            self.vectorizer = joblib.load(settings.VECTORIZER_PATH)
            self.matrix = joblib.load(settings.MATRIX_PATH)
            with open(settings.INDEX_PATH, 'r') as f:
                self.book_index = json.load(f) # list of book_ids corresponding to matrix rows
            logger.info("Content-based model loaded successfully.")
        except Exception as e:
            logger.warning(f"Could not load content-based model artifacts: {e}")
            self.vectorizer = None
            self.matrix = None
            self.book_index = None

        # Load collaborative filtering models
        try:
            self.cf_user_factors = joblib.load(settings.CF_USER_FACTORS_PATH)
            self.cf_item_factors = joblib.load(settings.CF_ITEM_FACTORS_PATH)
            with open(settings.CF_USER_INDEX_PATH, 'r') as f:
                self.cf_user_index = json.load(f)
            with open(settings.CF_ITEM_INDEX_PATH, 'r') as f:
                self.cf_item_index = json.load(f)
            logger.info("Collaborative filtering model loaded successfully.")
        except Exception as e:
            logger.warning(f"Could not load CF model artifacts: {e}")
            self.cf_user_factors = None
            self.cf_item_factors = None
            self.cf_user_index = None
            self.cf_item_index = None

    def get_recommendations(self, db: Session, course, top_n: int = 10) -> List[Dict[str, Any]]:
        if self.vectorizer is None or self.matrix is None or self.book_index is None:
            return []

        # 4. Build a course query from course title + topics
        query_parts = []
        if course.course_title:
            query_parts.append(course.course_title)
        if course.topics:
            query_parts.append(course.topics)
        if course.description:
             query_parts.append(course.description)
        query = " ".join(query_parts)

        if not query.strip():
            return []

        # 5. Calculate cosine similarity
        query_vec = self.vectorizer.transform([query])
        sim_scores = cosine_similarity(query_vec, self.matrix).flatten()

        # 6. Rank results
        # 7. Exclude zero scores
        # 8. Avoid duplicate editions where possible (we can group by title and take highest score)
        
        book_scores = []
        for idx, score in enumerate(sim_scores):
            if score > 0:
                book_scores.append((self.book_index[idx], score))
                
        book_scores.sort(key=lambda x: x[1], reverse=True)

        recommendations = []
        seen_titles = set()
        
        for book_id, score in book_scores:
            if len(recommendations) >= top_n:
                break
                
            book = db.query(Book).filter(Book.book_id == book_id).first()
            if book:
                title_lower = book.title.lower() if book.title else ""
                if title_lower in seen_titles:
                    continue
                seen_titles.add(title_lower)
                
                # 9. Return similarity_score, matching_topics and a simple reason
                reason = f"Recommended because it matches topics like '{course.course_title}'."
                recommendations.append({
                    "book_id": book.book_id,
                    "title": book.title,
                    "authors": book.authors,
                    "cover_url": book.cover_url,
                    "source_url": book.source_url,
                    "similarity_score": round(float(score), 4),
                    "matching_topics": book.subjects if book.subjects else "",
                    "reason": reason
                })

        return recommendations

    def get_collaborative_recommendations(self, db: Session, user_id: str, interacted_book_ids: List[str], top_n: int = 10) -> List[Dict[str, Any]]:
        if self.cf_user_factors is None or self.cf_item_factors is None:
            return []
            
        try:
            user_idx = self.cf_user_index.index(user_id)
        except ValueError:
            # User not in the CF training data (Cold Start)
            return []

        # Get user latent vector
        user_vector = self.cf_user_factors[user_idx]
        
        # Predict scores for all items: dot product of user vector and item matrix (which is item_factors.T)
        # cf_item_factors is (n_items, n_components)
        scores = np.dot(self.cf_item_factors, user_vector)
        
        # Rank items
        top_indices = np.argsort(scores)[::-1]
        
        recommendations = []
        interacted_set = set(interacted_book_ids)
        seen_titles = set()
        
        for idx in top_indices:
            if len(recommendations) >= top_n:
                break
                
            book_id = self.cf_item_index[idx]
            score = scores[idx]
            
            if score <= 0 or book_id in interacted_set:
                continue
                
            book = db.query(Book).filter(Book.book_id == book_id).first()
            if book:
                title_lower = book.title.lower() if book.title else ""
                if title_lower in seen_titles:
                    continue
                seen_titles.add(title_lower)
                
                reason = "Recommended based on what similar users are reading."
                recommendations.append({
                    "book_id": book.book_id,
                    "title": book.title,
                    "authors": book.authors,
                    "cover_url": book.cover_url,
                    "source_url": book.source_url,
                    "similarity_score": round(float(score), 4),
                    "matching_topics": book.subjects if book.subjects else "",
                    "reason": reason
                })

        return recommendations

recommendation_service = RecommendationService()
