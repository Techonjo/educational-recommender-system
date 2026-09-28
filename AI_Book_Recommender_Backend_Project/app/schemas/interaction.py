from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime

class InteractionCreate(BaseModel):
    user_id: str
    book_id: str
    course_id: Optional[str] = None
    interaction_type: str = Field(..., description="view, click, save, unsave, read, rate, helpful, not_helpful")
    rating: Optional[int] = Field(None, ge=1, le=5)

class Interaction(InteractionCreate):
    interaction_id: int
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)
