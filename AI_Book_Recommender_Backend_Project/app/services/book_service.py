from sqlalchemy.orm import Session
from app.models.book import Book

def get_book(db: Session, book_id: str):
    return db.query(Book).filter(Book.book_id == book_id).first()

def get_books(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Book).offset(skip).limit(limit).all()
