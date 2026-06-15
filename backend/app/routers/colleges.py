from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.crud import crud
from app.schemas import schemas
from app.routers.deps import get_current_user, RoleChecker
from app.models import models

router = APIRouter()

@router.post("/", response_model=schemas.CollegeResponse)
def register_college(college: schemas.CollegeCreate, db: Session = Depends(get_db)):
    return crud.create_college(db, college=college)

@router.get("/", response_model=List[schemas.CollegeResponse])
def list_colleges(db: Session = Depends(get_db)):
    return crud.get_colleges(db)

@router.get("/{college_id}", response_model=schemas.CollegeResponse)
def get_college(college_id: int, db: Session = Depends(get_db)):
    db_college = crud.get_college_by_id(db, college_id=college_id)
    if not db_college:
        raise HTTPException(status_code=404, detail="College not found")
    return db_college

@router.get("/{college_id}/students", response_model=List[schemas.UserResponse])
def view_college_students(
    college_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Security: Only admins or users with college role belonging to this college can view students
    if current_user.role not in ["admin", "college"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    if current_user.role == "college" and current_user.college_id != college_id:
        raise HTTPException(status_code=403, detail="Not authorized for this college")
        
    students = db.query(models.User).filter(
        models.User.college_id == college_id,
        models.User.role == "participant"
    ).all()
    return students
