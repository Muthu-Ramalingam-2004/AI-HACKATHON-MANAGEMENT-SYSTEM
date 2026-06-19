from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import logging
from app.core.database import get_db
from app.crud import crud
from app.schemas import schemas
from app.routers.deps import get_current_user, RoleChecker
from app.models import models

logger = logging.getLogger("app.routers.teams")

router = APIRouter()

participant_required = RoleChecker(["participant"])

@router.post("/", response_model=schemas.TeamResponse)
def create_team(
    team: schemas.TeamCreate,
    current_user: models.User = Depends(participant_required),
    db: Session = Depends(get_db)
):
    logger.info(f"User '{current_user.email}' (ID: {current_user.id}) is attempting to create team '{team.team_name}' for hackathon ID {team.hackathon_id}")
    
    # Verify hackathon exists and is active
    hackathon = crud.get_hackathon_by_id(db, team.hackathon_id)
    if not hackathon:
        logger.warning(f"Hackathon ID {team.hackathon_id} not found during team creation")
        raise HTTPException(status_code=404, detail="Hackathon not found")
    if hackathon.status != "active":
        logger.warning(f"Hackathon ID {team.hackathon_id} is in status '{hackathon.status}', not 'active'")
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
        logger.warning(f"User '{current_user.email}' is already a member of team ID {user_teams.team_id} in hackathon ID {team.hackathon_id}")
        raise HTTPException(
            status_code=400,
            detail="You are already a member of a team in this hackathon"
        )
        
    res = crud.create_team(db, team=team, leader_id=current_user.id)
    logger.info(f"Successfully created team '{team.team_name}' (ID: {res.id}) with leader ID: {current_user.id}")
    return res

@router.post("/{team_id}/members", response_model=schemas.TeamMemberResponse)
def add_team_member(
    team_id: int,
    member_in: schemas.TeamMemberCreate,
    current_user: models.User = Depends(participant_required),
    db: Session = Depends(get_db)
):
    logger.info(f"User '{current_user.email}' (ID: {current_user.id}) attempting to add member with email '{member_in.email}' to team ID {team_id}")
    
    # Check team exists
    team = crud.get_team_by_id(db, team_id)
    if not team:
        logger.warning(f"Team ID {team_id} not found during add_team_member")
        raise HTTPException(status_code=404, detail="Team not found")
        
    # Security: Only team leader can add members
    if team.leader_id != current_user.id:
        logger.warning(f"Unauthorized: User {current_user.id} tried to add members to team {team_id} led by leader ID {team.leader_id}")
        raise HTTPException(
            status_code=403,
            detail="Only the team leader can add members to the team"
        )
        
    # Check member user exists by email
    member_user = crud.get_user_by_email(db, email=member_in.email)
    if not member_user:
        logger.warning(f"Add member failed: User with email '{member_in.email}' not found in database")
        raise HTTPException(
            status_code=404,
            detail=f"User with email '{member_in.email}' is not registered on HackAI. Please verify spelling."
        )
    if member_user.role != "participant":
        logger.warning(f"Add member failed: User '{member_in.email}' has role '{member_user.role}', not 'participant'")
        raise HTTPException(
            status_code=400,
            detail=f"User '{member_in.email}' is registered but has the role '{member_user.role}'. Only 'participant' users can join teams."
        )
        
    # Check if that user is already in another team for the same hackathon
    existing_team = db.query(models.TeamMember).join(models.Team).filter(
        models.TeamMember.user_id == member_user.id,
        models.Team.hackathon_id == team.hackathon_id
    ).first()
    if existing_team:
        logger.warning(f"Add member failed: User '{member_in.email}' is already in team ID {existing_team.team_id} for hackathon ID {team.hackathon_id}")
        raise HTTPException(
            status_code=400,
            detail=f"User '{member_in.email}' is already a member of a team in this hackathon."
        )
        
    res = crud.add_team_member(db, team_id=team_id, user_id=member_user.id)
    logger.info(f"Successfully added member '{member_in.email}' (ID: {member_user.id}) to team ID {team_id}")
    return res

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
