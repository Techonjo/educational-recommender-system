from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.interaction import InteractionCreate, Interaction
from app.services import interaction_service
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter()

@router.post("/interactions", response_model=Interaction)
def create_interaction(
    interaction: InteractionCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Build a new object with the correct user_id from the verified JWT token
    secured_interaction = InteractionCreate(
        user_id=current_user.user_id,
        book_id=interaction.book_id,
        course_id=interaction.course_id,
        interaction_type=interaction.interaction_type,
        rating=interaction.rating,
    )
    
    # Basic validation for interaction types
    valid_types = {"view", "click", "save", "unsave", "read", "rate", "helpful", "not_helpful", "interest"}
    if secured_interaction.interaction_type not in valid_types:
        raise HTTPException(status_code=400, detail={"success": False, "message": "Invalid interaction type", "error_code": "INVALID_INTERACTION"})
    
    if secured_interaction.interaction_type == "rate" and (secured_interaction.rating is None or not (1 <= secured_interaction.rating <= 5)):
        raise HTTPException(status_code=400, detail={"success": False, "message": "Rating must be between 1 and 5", "error_code": "INVALID_RATING"})
        
    return interaction_service.create_interaction(db=db, interaction=secured_interaction)
