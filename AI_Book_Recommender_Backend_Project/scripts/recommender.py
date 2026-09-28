import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

class CSBookRecommender:
    def __init__(self, books_csv, courses_csv):
        self.books = pd.read_csv(books_csv).fillna("")
        self.courses = pd.read_csv(courses_csv).fillna("")

        # Works with both the seed dataset and the large Open Library dataset.
        text_cols = []
        for c in ["title", "subtitle", "authors", "subjects", "topics",
                  "description", "dewey_decimal_class", "lc_classifications"]:
            if c in self.books.columns:
                text_cols.append(c)

        self.books["search_text"] = self.books[text_cols].astype(str).agg(" ".join, axis=1)

        self.vectorizer = TfidfVectorizer(
            stop_words="english",
            ngram_range=(1, 2),
            min_df=1,
            max_features=200000
        )
        self.book_matrix = self.vectorizer.fit_transform(self.books["search_text"])

    def recommend(self, course_title, top_n=10):
        matches = self.courses[
            self.courses["course_title"].astype(str).str.lower()
            == course_title.lower()
        ]

        if matches.empty:
            matches = self.courses[
                self.courses["course_title"].astype(str).str.lower()
                .str.contains(course_title.lower(), regex=False)
            ]

        if matches.empty:
            raise ValueError("Course not found.")

        course = matches.iloc[0]
        query = str(course.get("course_title","")) + " " + str(course.get("topics",""))

        q = self.vectorizer.transform([query])
        scores = cosine_similarity(q, self.book_matrix).ravel()

        # Don't recommend zero-similarity records.
        valid = scores > 0
        ranked = scores.argsort()[::-1]
        ranked = [i for i in ranked if valid[i]][:top_n]

        result = self.books.iloc[ranked].copy()
        result.insert(0, "similarity_score", [round(float(scores[i]),4) for i in ranked])
        result.insert(0, "course", course["course_title"])

        return result

if __name__ == "__main__":
    model = CSBookRecommender(
        "books_seed_open_textbook_library.csv",
        "courses_cs.csv"
    )

    print(model.recommend("Artificial Intelligence", 5).to_string(index=False))
