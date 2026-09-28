import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import pandas as pd
import joblib
import json
from sklearn.feature_extraction.text import TfidfVectorizer
from app.database import SessionLocal
from app.models.book import Book
from app.config import settings

def build_model():
    print("Fetching books from database...")
    db = SessionLocal()
    try:
        books = db.query(Book).all()
    finally:
        db.close()

    if not books:
        print("No books found in the database. Run import_data.py first.")
        return

    print(f"Building model for {len(books)} books...")
    
    documents = []
    book_index = []
    
    for book in books:
        # Combine text features
        parts = []
        if book.title: parts.append(book.title)
        if book.authors: parts.append(book.authors)
        if book.subjects: parts.append(book.subjects)
        if book.description: parts.append(book.description)
        
        text = " ".join(parts)
        documents.append(text)
        book_index.append(book.book_id)

    print("Fitting TF-IDF Vectorizer...")
    vectorizer = TfidfVectorizer(stop_words='english', ngram_range=(1, 2))
    matrix = vectorizer.fit_transform(documents)

    print("Saving model artifacts...")
    os.makedirs(settings.MODEL_DIR, exist_ok=True)
    
    joblib.dump(vectorizer, settings.VECTORIZER_PATH)
    joblib.dump(matrix, settings.MATRIX_PATH)
    
    with open(settings.INDEX_PATH, 'w') as f:
        json.dump(book_index, f)
        
    print(f"Model built and saved to {settings.MODEL_DIR}")

if __name__ == "__main__":
    build_model()
