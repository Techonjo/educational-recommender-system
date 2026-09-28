HOW TO BUILD THE CS-ONLY DATASET

1. Put fetch_cs_books_openlibrary.py in your backend project root.
2. Open the VS Code terminal in that folder.
3. Run:

   python fetch_cs_books_openlibrary.py

4. The generated dataset will be:

   data/computer_science_books_openlibrary.csv

The script targets Computer Science and major CS areas only. It caches
responses, waits between requests, and removes duplicate Open Library works.

Open Library currently reports 18,831 works under the Computer Science subject,
with many related CS subjects. Its API documentation says the API is for
low-volume discovery and is not intended as a bulk-data backend. For a
production-scale bulk catalogue, use their monthly dumps or contact them.
