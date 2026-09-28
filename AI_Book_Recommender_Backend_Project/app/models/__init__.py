from app.models.book import Book
from app.models.course import Course, CourseBookRelationship
from app.models.interaction import Interaction
from app.models.user import User
from app.database import engine, Base

def init_db():
    Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    init_db()
    print("Database tables created.")
