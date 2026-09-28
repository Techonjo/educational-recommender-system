"""
Build a large Computer Science book catalogue from an Open Library monthly dump.

Why this approach:
- Open Library has 20M+ editions and provides monthly bulk dumps.
- Their documentation says bulk projects should use dumps instead of repeatedly calling the API.
- This script streams the compressed editions dump so you do NOT need to load the whole file into RAM.

Usage:
  python build_openlibrary_cs_dataset.py /path/to/ol_dump_editions_latest.txt.gz

Output:
  openlibrary_cs_books.csv

The script keeps records whose subjects/classifications/title/description
contain Computer Science-related terms. It is intentionally broad, then
deduplicates by work/title.
"""

import csv, gzip, json, re, sys

KEYWORDS = {
    "computer science","computer programming","programming","software",
    "software engineering","algorithms","data structures","artificial intelligence",
    "machine learning","cybersecurity","computer security","information security",
    "cloud computing","distributed systems","operating systems","computer networks",
    "web development","databases","database","computer graphics","computer vision",
    "natural language processing","robotics","internet of things","iot",
    "data science","information systems","compiler","compilers",
    "human-computer interaction","human computer interaction","computer architecture",
    "computer organization","theory of computation","discrete mathematics",
    "mobile computing","mobile application","parallel computing","concurrency",
    "cryptography","networking","deep learning","pattern recognition"
}

def flatten_text(value):
    if isinstance(value, str):
        return value
    if isinstance(value, list):
        return " ".join(flatten_text(x) for x in value)
    if isinstance(value, dict):
        return " ".join(flatten_text(v) for v in value.values())
    return ""

def matches(rec):
    parts = [
        flatten_text(rec.get("title")),
        flatten_text(rec.get("subtitle")),
        flatten_text(rec.get("subjects")),
        flatten_text(rec.get("description")),
        flatten_text(rec.get("lc_classifications")),
        flatten_text(rec.get("dewey_decimal_class")),
    ]
    text = " ".join(parts).lower()
    return any(k in text for k in KEYWORDS)

def first(v):
    if isinstance(v, list):
        return v[0] if v else ""
    return v or ""

def authors(rec):
    out=[]
    for a in rec.get("authors",[]) or []:
        if isinstance(a,dict):
            key=a.get("key","")
            out.append(key.split("/")[-1] if key else "")
        else:
            out.append(str(a))
    return "; ".join(x for x in out if x)

if len(sys.argv) != 2:
    print("Usage: python build_openlibrary_cs_dataset.py ol_dump_editions_latest.txt.gz")
    raise SystemExit(1)

src=sys.argv[1]
out="openlibrary_cs_books.csv"

fields=["book_key","title","subtitle","authors","publishers","publish_date",
        "isbn10","isbn13","languages","number_of_pages","subjects",
        "dewey_decimal_class","lc_classifications","covers"]

seen=set()
count=0

with gzip.open(src,"rt",encoding="utf-8",errors="ignore") as f, \
     open(out,"w",newline="",encoding="utf-8") as g:
    w=csv.DictWriter(g,fieldnames=fields)
    w.writeheader()

    for line in f:
        # Open Library dump rows are tab-separated; JSON is the last column.
        parts=line.rstrip("\n").split("\t")
        if len(parts) < 5:
            continue
        try:
            rec=json.loads(parts[-1])
        except Exception:
            continue

        if rec.get("type") not in ("/type/edition","/type/edition"):
            continue
        if not matches(rec):
            continue

        title=first(rec.get("title"))
        if not title:
            continue

        # Deduplicate on title + first author + publication year.
        dedupe=(title.lower(), authors(rec).split("; ")[0].lower(), str(first(rec.get("publish_date"))))
        if dedupe in seen:
            continue
        seen.add(dedupe)

        row={
            "book_key":rec.get("key",""),
            "title":title,
            "subtitle":first(rec.get("subtitle")),
            "authors":authors(rec),
            "publishers":"; ".join(str(x) for x in rec.get("publishers",[]) or []),
            "publish_date":first(rec.get("publish_date")),
            "isbn10":"; ".join(str(x) for x in rec.get("isbn_10",[]) or []),
            "isbn13":"; ".join(str(x) for x in rec.get("isbn_13",[]) or []),
            "languages":"; ".join(str(x) for x in rec.get("languages",[]) or []),
            "number_of_pages":rec.get("number_of_pages",""),
            "subjects":"; ".join(str(x) for x in rec.get("subjects",[]) or []),
            "dewey_decimal_class":"; ".join(str(x) for x in rec.get("dewey_decimal_class",[]) or []),
            "lc_classifications":"; ".join(str(x) for x in rec.get("lc_classifications",[]) or []),
            "covers":"; ".join(str(x) for x in rec.get("covers",[]) or []),
        }
        w.writerow(row)
        count += 1

print(f"Created {out} with {count} CS-related records.")
