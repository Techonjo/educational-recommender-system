import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Book Recommender Backend"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./recommendation.db")
    
    # Model
    MODEL_DIR: str = os.path.join(os.path.dirname(os.path.dirname(__file__)), "model")
    VECTORIZER_PATH: str = os.path.join(MODEL_DIR, "tfidf_vectorizer.joblib")
    MATRIX_PATH: str = os.path.join(MODEL_DIR, "book_matrix.joblib")
    INDEX_PATH: str = os.path.join(MODEL_DIR, "book_index.json")
    
    # Collaborative Filtering Model Paths
    CF_USER_FACTORS_PATH: str = os.path.join(MODEL_DIR, "cf_user_factors.joblib")
    CF_ITEM_FACTORS_PATH: str = os.path.join(MODEL_DIR, "cf_item_factors.joblib")
    CF_USER_INDEX_PATH: str = os.path.join(MODEL_DIR, "cf_user_index.json")
    CF_ITEM_INDEX_PATH: str = os.path.join(MODEL_DIR, "cf_item_index.json")

    # YouTube Data API v3 — loaded automatically from .env file
    YOUTUBE_API_KEY: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",          # auto-load .env from the working directory
        env_file_encoding="utf-8",
        case_sensitive=True,
    )

settings = Settings()
