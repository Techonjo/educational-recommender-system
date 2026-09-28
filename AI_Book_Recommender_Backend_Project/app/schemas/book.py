from pydantic import BaseModel, ConfigDict
from typing import Optional

class BookBase(BaseModel):
    title: str
    authors: Optional[str] = None
    publication_date: Optional[str] = None
    publishers: Optional[str] = None
    isbn_10: Optional[str] = None
    isbn_13: Optional[str] = None
    subjects: Optional[str] = None
    description: Optional[str] = None
    pages: Optional[int] = None
    languages: Optional[str] = None
    cover_url: Optional[str] = None
    source_url: Optional[str] = None

class BookCreate(BookBase):
    book_id: str

class Book(BookBase):
    book_id: str

    model_config = ConfigDict(from_attributes=True)
