from sqlalchemy import Column, String, Integer, Text
from app.database import Base

class Book(Base):
    __tablename__ = "books"

    book_id = Column(String, primary_key=True, index=True)
    title = Column(String, index=True)
    authors = Column(String)
    publication_date = Column(String)
    publishers = Column(String)
    isbn_10 = Column(String, index=True)
    isbn_13 = Column(String, index=True)
    subjects = Column(Text)
    description = Column(Text)
    pages = Column(Integer)
    languages = Column(String)
    cover_url = Column(String)
    source_url = Column(String)
