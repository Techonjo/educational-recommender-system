from sqlalchemy import Column, String, Integer, Text, ForeignKey, Float
from app.database import Base

class Course(Base):
    __tablename__ = "courses"

    course_id = Column(String, primary_key=True, index=True)
    programme = Column(String, index=True)
    level = Column(String, index=True)
    semester = Column(String)
    course_code = Column(String, index=True)
    course_title = Column(String, index=True)
    description = Column(Text)
    topics = Column(Text)
    prerequisites = Column(Text)

class CourseBookRelationship(Base):
    __tablename__ = "course_book_relationships"

    id = Column(Integer, primary_key=True, autoincrement=True)
    course_id = Column(String, ForeignKey("courses.course_id"), index=True)
    book_id = Column(String, ForeignKey("books.book_id"), index=True)
    relevance_score = Column(Float, nullable=True)
