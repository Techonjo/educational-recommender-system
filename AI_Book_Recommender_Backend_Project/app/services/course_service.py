from sqlalchemy.orm import Session
from app.models.course import Course

def get_course(db: Session, course_id: str):
    return db.query(Course).filter(Course.course_id == course_id).first()

def get_courses(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Course).offset(skip).limit(limit).all()
