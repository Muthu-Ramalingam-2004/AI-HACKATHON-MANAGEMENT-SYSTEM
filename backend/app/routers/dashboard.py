from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any
from app.core.database import get_db
from app.crud import crud
from app.schemas import schemas
from app.routers.deps import get_current_user, RoleChecker
from app.models import models

router = APIRouter()

@router.get("/leaderboard", response_model=List[schemas.LeaderboardEntry])
def get_leaderboard(hackathon_id: int = None, db: Session = Depends(get_db)):
    # Calculate leaderboard standings.
    # Total Score = average of all judges' total score (innovation + technical + feasibility + presentation) for each team submission.
    
    # Query all submissions
    query = db.query(models.Submission)
    if hackathon_id:
        query = query.join(models.Team).filter(models.Team.hackathon_id == hackathon_id)
        
    submissions = query.all()
    
    leaderboard = []
    for sub in submissions:
        evals = sub.evaluations
        if not evals:
            # Submissions with no evaluations yet get 0
            avg_inno = 0.0
            avg_tech = 0.0
            avg_feas = 0.0
            avg_pres = 0.0
            total = 0.0
        else:
            n = len(evals)
            avg_inno = sum(e.innovation_score for e in evals) / n
            avg_tech = sum(e.technical_score for e in evals) / n
            avg_feas = sum(e.feasibility_score for e in evals) / n
            avg_pres = sum(e.presentation_score for e in evals) / n
            total = avg_inno + avg_tech + avg_feas + avg_pres
            
        leaderboard.append({
            "team_id": sub.team.id,
            "team_name": sub.team.team_name,
            "hackathon_title": sub.team.hackathon.title,
            "innovation_score": round(avg_inno, 2),
            "technical_score": round(avg_tech, 2),
            "feasibility_score": round(avg_feas, 2),
            "presentation_score": round(avg_pres, 2),
            "total_score": round(total, 2),
            "submitted_at": sub.submitted_at
        })
        
    # Sort leaderboard by total_score descending, then by submitted_at ascending (tie-breaker)
    leaderboard.sort(key=lambda x: (-x["total_score"], x["submitted_at"]))
    
    # Add ranks
    for index, entry in enumerate(leaderboard):
        entry["rank"] = index + 1
        
    return leaderboard

@router.get("/admin", response_model=Dict[str, Any])
def get_admin_dashboard_stats(
    current_user: models.User = Depends(RoleChecker(["admin"])),
    db: Session = Depends(get_db)
):
    total_users = db.query(models.User).count()
    total_colleges = db.query(models.College).count()
    total_hackathons = db.query(models.Hackathon).count()
    total_teams = db.query(models.Team).count()
    total_submissions = db.query(models.Submission).count()
    
    # Get user role distribution
    roles = db.query(models.User.role, func.count(models.User.role)).group_by(models.User.role).all()
    role_dist = {r[0]: r[1] for r in roles}
    
    return {
        "stats": {
            "users": total_users,
            "colleges": total_colleges,
            "hackathons": total_hackathons,
            "teams": total_teams,
            "submissions": total_submissions
        },
        "role_distribution": role_dist
    }

@router.get("/college", response_model=Dict[str, Any])
def get_college_dashboard_stats(
    current_user: models.User = Depends(RoleChecker(["admin", "college"])),
    db: Session = Depends(get_db)
):
    college_id = current_user.college_id
    if not college_id:
        raise HTTPException(status_code=400, detail="User is not associated with any college")
        
    total_students = db.query(models.User).filter(
        models.User.college_id == college_id,
        models.User.role == "participant"
    ).count()
    
    # Teams that contain at least one member from this college
    teams_with_students = db.query(models.Team).join(models.TeamMember).join(models.User).filter(
        models.User.college_id == college_id
    ).distinct().count()
    
    # List of students from the college and their participation details
    students = db.query(models.User).filter(
        models.User.college_id == college_id,
        models.User.role == "participant"
    ).all()
    
    student_list = []
    for s in students:
        teams = db.query(models.Team).join(models.TeamMember).filter(models.TeamMember.user_id == s.id).all()
        student_list.append({
            "id": s.id,
            "name": s.name,
            "email": s.email,
            "teams_count": len(teams),
            "teams": [{"team_name": t.team_name, "hackathon": t.hackathon.title} for t in teams]
        })
        
    return {
        "stats": {
            "students_count": total_students,
            "teams_count": teams_with_students
        },
        "students": student_list
    }

@router.get("/judge", response_model=Dict[str, Any])
def get_judge_dashboard_stats(
    current_user: models.User = Depends(RoleChecker(["admin", "judge"])),
    db: Session = Depends(get_db)
):
    # Retrieve all project submissions to evaluate
    submissions = db.query(models.Submission).all()
    
    sub_list = []
    evaluated_count = 0
    
    for sub in submissions:
        # Check if current judge evaluated this submission
        eval_obj = db.query(models.Evaluation).filter(
            models.Evaluation.submission_id == sub.id,
            models.Evaluation.judge_id == current_user.id
        ).first()
        
        is_evaluated = eval_obj is not None
        if is_evaluated:
            evaluated_count += 1
            
        sub_list.append({
            "id": sub.id,
            "project_title": sub.project_title,
            "description": sub.description,
            "github_url": sub.github_url,
            "ppt_file": sub.ppt_file,
            "submitted_at": sub.submitted_at,
            "team_name": sub.team.team_name,
            "hackathon_title": sub.team.hackathon.title,
            "is_evaluated": is_evaluated,
            "scores": {
                "innovation": eval_obj.innovation_score if is_evaluated else 0,
                "technical": eval_obj.technical_score if is_evaluated else 0,
                "feasibility": eval_obj.feasibility_score if is_evaluated else 0,
                "presentation": eval_obj.presentation_score if is_evaluated else 0,
                "total": (eval_obj.innovation_score + eval_obj.technical_score + eval_obj.feasibility_score + eval_obj.presentation_score) if is_evaluated else 0,
                "comments": eval_obj.comments if is_evaluated else ""
            } if is_evaluated else None
        })
        
    return {
        "stats": {
            "total_submissions": len(submissions),
            "evaluated_submissions": evaluated_count,
            "pending_submissions": len(submissions) - evaluated_count
        },
        "submissions": sub_list
    }

@router.get("/participant", response_model=Dict[str, Any])
def get_participant_dashboard_stats(
    current_user: models.User = Depends(RoleChecker(["participant"])),
    db: Session = Depends(get_db)
):
    # Teams this user belongs to
    memberships = db.query(models.TeamMember).filter(models.TeamMember.user_id == current_user.id).all()
    teams_data = []
    
    for mem in memberships:
        team = mem.team
        sub = db.query(models.Submission).filter(models.Submission.team_id == team.id).first()
        teams_data.append({
            "team_id": team.id,
            "team_name": team.team_name,
            "hackathon": {
                "id": team.hackathon.id,
                "title": team.hackathon.title,
                "status": team.hackathon.status
            },
            "is_leader": team.leader_id == current_user.id,
            "submitted": sub is not None,
            "submission": {
                "id": sub.id,
                "project_title": sub.project_title,
                "submitted_at": sub.submitted_at,
                "github_url": sub.github_url
            } if sub else None
        })
        
    return {
        "teams": teams_data
    }
