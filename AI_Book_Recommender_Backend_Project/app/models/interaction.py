from sqlalchemy import Column, String, Integer, ForeignKey, DateTime
from datetime import datetime, timezone
from app.database import Base

class Interaction(Base):
    __tablename__ = "interactions"

    interaction_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, index=True, nullable=False)
    book_id = Column(String, ForeignKey("books.book_id"), index=True, nullable=False)
    course_id = Column(String, ForeignKey("courses.course_id"), index=True, nullable=True)
    interaction_type = Column(String, index=True, nullable=False)
    rating = Column(Integer, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
