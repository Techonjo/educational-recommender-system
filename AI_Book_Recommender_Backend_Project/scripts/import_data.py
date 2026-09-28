import pandas as pd
import numpy as np
import os
from app.database import SessionLocal, engine, Base
from app.models.book import Book
from app.models.course import Course
from app.models import init_db

def load_books(db):
    print("Loading books...")
    df = pd.read_csv("data/books_seed_open_textbook_library.csv")
    df = df.replace({np.nan: None})
    
    count = 0
    for _, row in df.iterrows():
        existing = db.query(Book).filter(Book.book_id == str(row['book_id'])).first()
        if not existing:
            book = Book(
                book_id=str(row['book_id']),
                title=str(row['title']) if row['title'] else None,
                authors=str(row['authors']) if row['authors'] else None,
                publication_date=str(row.get('publication_year', '')),
                subjects=str(row.get('topics', '')),
                source_url=str(row.get('source', ''))
            )
            db.add(book)
            count += 1
    db.commit()
    print(f"Inserted {count} new books.")

def load_courses(db):
    print("Loading courses...")
    df = pd.read_csv("data/courses_cs.csv")
    df = df.replace({np.nan: None})
    
    count = 0
    for _, row in df.iterrows():
        existing = db.query(Course).filter(Course.course_id == str(row['course_id'])).first()
        if not existing:
            course = Course(
                course_id=str(row['course_id']),
                programme=str(row.get('programme', '')),
                level=str(row.get('level', '')),
                semester=str(row.get('semester', '')),
                course_title=str(row.get('course_title', '')),
                topics=str(row.get('topics', ''))
            )
            db.add(course)
            count += 1
    db.commit()
    print(f"Inserted {count} new courses.")

if __name__ == "__main__":
    print("Initializing database...")
    init_db()
    
    db = SessionLocal()
    try:
        load_books(db)
        load_courses(db)
        print("Data import complete.")
    finally:
        db.close()
