import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.core.config import settings
from app.crud import crud
from app.schemas import schemas
from app.routers.deps import get_current_user, RoleChecker
from app.models import models

router = APIRouter()

participant_required = RoleChecker(["participant"])

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

@router.post("/", response_model=schemas.SubmissionResponse)
def submit_project(
    team_id: int = Form(...),
    project_title: str = Form(...),
    description: Optional[str] = Form(None),
    github_url: Optional[str] = Form(None),
    ppt_file: UploadFile = File(...),
    current_user: models.User = Depends(participant_required),
    db: Session = Depends(get_db)
):
    # Verify team exists
    team = crud.get_team_by_id(db, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
        
    # Verify user is the leader of the team
    if team.leader_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Only the team leader can submit the project"
        )
        
    # File validation: accept only PPT and PPTX
    file_ext = os.path.splitext(ppt_file.filename)[1].lower()
    if file_ext not in [".ppt", ".pptx", ".pdf"]:  # Adding pdf as helper
        raise HTTPException(
            status_code=400,
            detail="Invalid file format. Only .ppt, .pptx and .pdf files are allowed."
        )
        
    # Create a unique filename to avoid collision
    safe_filename = f"team_{team_id}_{current_user.id}_{int(os.times()[4])}{file_ext}"
    dest_path = os.path.join(settings.UPLOAD_DIR, safe_filename)
    
    try:
        with open(dest_path, "wb") as buffer:
            shutil.copyfileobj(ppt_file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save uploaded file: {str(e)}"
        )
        
    # Save/Update submission
    sub_create = schemas.SubmissionCreate(
        team_id=team_id,
        project_title=project_title,
        description=description,
        github_url=github_url
    )
    
    return crud.create_submission(db, submission=sub_create, ppt_file_path=dest_path)

@router.get("/team/{team_id}", response_model=schemas.SubmissionResponse)
def get_team_submission(
    team_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify user is in team or admin/judge
    team = crud.get_team_by_id(db, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
        
    is_member = db.query(models.TeamMember).filter(
        models.TeamMember.team_id == team_id,
        models.TeamMember.user_id == current_user.id
    ).first()
    
    if not is_member and current_user.role not in ["admin", "judge"]:
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to view this team's submission"
        )
        
    sub = crud.get_submission_by_team(db, team_id=team_id)
    if not sub:
        raise HTTPException(status_code=404, detail="No submission found for this team")
    return sub

@router.get("/", response_model=list[schemas.SubmissionResponse])
def get_all_submissions(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Judges and admins can see all submissions
    if current_user.role not in ["admin", "judge"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    return db.query(models.Submission).all()
