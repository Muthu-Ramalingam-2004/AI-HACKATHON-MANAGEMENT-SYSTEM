from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.crud import crud
from app.schemas import schemas
from app.routers.deps import get_current_user, RoleChecker
from app.models import models

router = APIRouter()

# Admin check dependencies
admin_required = RoleChecker(["admin"])

@router.post("/", response_model=schemas.HackathonResponse)
def create_hackathon(
    hackathon: schemas.HackathonCreate,
    current_user: models.User = Depends(admin_required),
    db: Session = Depends(get_db)
):
    return crud.create_hackathon(db, hackathon=hackathon)

@router.get("/", response_model=List[schemas.HackathonResponse])
def list_hackathons(
    status: str = None,
    db: Session = Depends(get_db)
):
    return crud.get_hackathons(db, status=status)

@router.get("/{hackathon_id}", response_model=schemas.HackathonResponse)
def get_hackathon(hackathon_id: int, db: Session = Depends(get_db)):
    db_hackathon = crud.get_hackathon_by_id(db, hackathon_id=hackathon_id)
    if not db_hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    return db_hackathon

@router.put("/{hackathon_id}", response_model=schemas.HackathonResponse)
def update_hackathon(
    hackathon_id: int,
    hackathon: schemas.HackathonUpdate,
    current_user: models.User = Depends(admin_required),
    db: Session = Depends(get_db)
):
    updated = crud.update_hackathon(db, hackathon_id=hackathon_id, hackathon=hackathon)
    if not updated:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    return updated

@router.delete("/{hackathon_id}")
def delete_hackathon(
    hackathon_id: int,
    current_user: models.User = Depends(admin_required),
    db: Session = Depends(get_db)
):
    success = crud.delete_hackathon(db, hackathon_id=hackathon_id)
    if not success:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    return {"message": "Hackathon deleted successfully"}

@router.post("/{hackathon_id}/publish", response_model=schemas.HackathonResponse)
def publish_hackathon(
    hackathon_id: int,
    current_user: models.User = Depends(admin_required),
    db: Session = Depends(get_db)
):
    update_data = schemas.HackathonUpdate(status="active")
    updated = crud.update_hackathon(db, hackathon_id=hackathon_id, hackathon=update_data)
    if not updated:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    return updated
