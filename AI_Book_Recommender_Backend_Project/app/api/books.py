from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.book import Book
from app.services import book_service

router = APIRouter()

@router.get("/books", response_model=List[Book])
def read_books(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    books = book_service.get_books(db, skip=skip, limit=limit)
    return books

@router.get("/books/{book_id}", response_model=Book)
def read_book(book_id: str, db: Session = Depends(get_db)):
    book = book_service.get_book(db, book_id=book_id)
    if book is None:
        raise HTTPException(status_code=404, detail={"success": False, "message": "Book not found", "error_code": "BOOK_NOT_FOUND"})
    return book
