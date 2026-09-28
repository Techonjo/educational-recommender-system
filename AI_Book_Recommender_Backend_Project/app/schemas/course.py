from pydantic import BaseModel, ConfigDict
from typing import Optional

class CourseBase(BaseModel):
    programme: Optional[str] = None
    level: Optional[str] = None
    semester: Optional[str] = None
    course_code: Optional[str] = None
    course_title: Optional[str] = None
    description: Optional[str] = None
    topics: Optional[str] = None
    prerequisites: Optional[str] = None

class CourseCreate(CourseBase):
    course_id: str

class Course(CourseBase):
    course_id: str

    model_config = ConfigDict(from_attributes=True)
