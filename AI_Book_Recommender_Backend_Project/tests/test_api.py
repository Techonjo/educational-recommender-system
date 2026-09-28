from fastapi.testclient import TestClient
from app.main import app
from app.core.security import get_current_user
from app.models.user import User

def mock_get_current_user():
    return User(user_id="test_user", email="test@example.com", name="Test User", hashed_password="fake")

app.dependency_overrides[get_current_user] = mock_get_current_user

client = TestClient(app)

def get_auth_headers():
    return {"Authorization": "Bearer mock-token"}

def test_health():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_read_courses():
    response = client.get("/api/v1/courses")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_read_course_valid():
    response = client.get("/api/v1/courses/CS301")
    assert response.status_code == 200
    assert response.json()["course_id"] == "CS301"

def test_read_course_invalid():
    response = client.get("/api/v1/courses/INVALID999")
    assert response.status_code == 404
    assert response.json()["detail"]["error_code"] == "COURSE_NOT_FOUND"

def test_read_books():
    response = client.get("/api/v1/books")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_recommendations():
    payload = {"course_id": "CS301", "top_n": 5}
    response = client.post("/api/v1/recommendations", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "recommendations" in data
    # Test that recommendations are returned for CS301 (Artificial Intelligence)
    assert len(data["recommendations"]) > 0
    assert len(data["recommendations"]) <= 5

def test_recommendations_invalid_course():
    payload = {"course_id": "INVALID999", "top_n": 5}
    response = client.post("/api/v1/recommendations", json=payload)
    assert response.status_code == 404
    assert response.json()["detail"]["error_code"] == "COURSE_NOT_FOUND"

def test_recommendations_invalid_top_n():
    payload = {"course_id": "CS301", "top_n": 100} # ge=1, le=50
    response = client.post("/api/v1/recommendations", json=payload)
    assert response.status_code == 422 # FastAPI validation error

def test_create_interaction():
    payload = {
        "user_id": "test_user",
        "book_id": "OTL001",
        "interaction_type": "view"
    }
    response = client.post("/api/v1/interactions", json=payload, headers=get_auth_headers())
    assert response.status_code == 200
    assert response.json()["user_id"] == "test_user"

def test_create_interaction_invalid_type():
    payload = {
        "user_id": "test_user",
        "book_id": "OTL001",
        "interaction_type": "invalid_type"
    }
    response = client.post("/api/v1/interactions", json=payload, headers=get_auth_headers())
    assert response.status_code == 400
    assert response.json()["detail"]["error_code"] == "INVALID_INTERACTION"

def test_user_recommendations_fallback():
    # For a user without much history, we expect a fallback response (or a valid response nonetheless)
    response = client.get("/api/v1/recommendations/personalized", headers=get_auth_headers())
    assert response.status_code == 200
    assert response.json()["success"] is True
