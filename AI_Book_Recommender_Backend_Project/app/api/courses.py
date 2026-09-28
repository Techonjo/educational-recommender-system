from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.course import Course
from app.services import course_service

router = APIRouter()

@router.get("/courses", response_model=List[Course])
def read_courses(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    courses = course_service.get_courses(db, skip=skip, limit=limit)
    return courses

@router.get("/courses/{course_id}", response_model=Course)
def read_course(course_id: str, db: Session = Depends(get_db)):
    course = course_service.get_course(db, course_id=course_id)
    if course is None:
        raise HTTPException(status_code=404, detail={"success": False, "message": "Course not found", "error_code": "COURSE_NOT_FOUND"})
    return course
