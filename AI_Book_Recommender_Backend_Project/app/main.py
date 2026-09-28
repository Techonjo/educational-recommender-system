from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.models import init_db
from app.api import health, books, courses, recommendations, interactions, auth
import logging

logging.basicConfig(level=logging.INFO)

# Initialize Database
init_db()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS configuration for Flutter
# In production, these should be restricted via environment variables
origins = [
    "http://localhost",
    "http://localhost:8080",
    "http://127.0.0.1",
    "http://127.0.0.1:8000",
    "*"  # Allow all for now, flutter mobile apps don't have an origin header typically, but can configure.
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix=settings.API_V1_STR, tags=["health"])
app.include_router(books.router, prefix=settings.API_V1_STR, tags=["books"])
app.include_router(courses.router, prefix=settings.API_V1_STR, tags=["courses"])
app.include_router(recommendations.router, prefix=settings.API_V1_STR, tags=["recommendations"])
app.include_router(interactions.router, prefix=settings.API_V1_STR, tags=["interactions"])
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
