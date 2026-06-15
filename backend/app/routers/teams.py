from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.crud import crud
from app.schemas import schemas
from app.routers.deps import get_current_user, RoleChecker
from app.models import models

router = APIRouter()

participant_required = RoleChecker(["participant"])

@router.post("/", response_model=schemas.TeamResponse)
def create_team(
    team: schemas.TeamCreate,
    current_user: models.User = Depends(participant_required),
    db: Session = Depends(get_db)
):
    # Verify hackathon exists and is active
    hackathon = crud.get_hackathon_by_id(db, team.hackathon_id)
    if not hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    if hackathon.status != "active":
        raise HTTPException(
            status_code=400,
            detail="Cannot register for a hackathon that is not active"
        )
    
    # Check if user already registered for this hackathon
    user_teams = db.query(models.TeamMember).join(models.Team).filter(
        models.TeamMember.user_id == current_user.id,
        models.Team.hackathon_id == team.hackathon_id
    ).first()
    if user_teams:
        raise HTTPException(
            status_code=400,
            detail="You are already a member of a team in this hackathon"
        )
        
    return crud.create_team(db, team=team, leader_id=current_user.id)

@router.post("/{team_id}/members", response_model=schemas.TeamMemberResponse)
def add_team_member(
    team_id: int,
    member_in: schemas.TeamMemberCreate,
    current_user: models.User = Depends(participant_required),
    db: Session = Depends(get_db)
):
    # Check team exists
    team = crud.get_team_by_id(db, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
        
    # Security: Only team leader can add members
    if team.leader_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Only the team leader can add members to the team"
        )
        
    # Check member user exists by email
    member_user = crud.get_user_by_email(db, email=member_in.email)
    if not member_user:
        raise HTTPException(
            status_code=404,
            detail="User with this email not found"
        )
    if member_user.role != "participant":
        raise HTTPException(
            status_code=400,
            detail="Only users with the 'participant' role can be added to teams"
        )
        
    # Check if that user is already in another team for the same hackathon
    existing_team = db.query(models.TeamMember).join(models.Team).filter(
        models.TeamMember.user_id == member_user.id,
        models.Team.hackathon_id == team.hackathon_id
    ).first()
    if existing_team:
        raise HTTPException(
            status_code=400,
            detail="This user is already a member of a team in this hackathon"
        )
        
    return crud.add_team_member(db, team_id=team_id, user_id=member_user.id)

@router.get("/me", response_model=List[schemas.TeamResponse])
def get_my_teams(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return crud.get_user_teams(db, user_id=current_user.id)

@router.get("/{team_id}", response_model=schemas.TeamResponse)
def get_team_detail(
    team_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    team = crud.get_team_by_id(db, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team
