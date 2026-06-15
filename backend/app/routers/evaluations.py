from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.crud import crud
from app.schemas import schemas
from app.routers.deps import get_current_user, RoleChecker
from app.models import models

router = APIRouter()

judge_required = RoleChecker(["judge"])
admin_or_judge = RoleChecker(["admin", "judge"])

@router.post("/", response_model=schemas.EvaluationResponse)
def evaluate_project(
    eval_in: schemas.EvaluationCreate,
    current_user: models.User = Depends(judge_required),
    db: Session = Depends(get_db)
):
    # Verify submission exists
    sub = crud.get_submission_by_id(db, submission_id=eval_in.submission_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
        
    return crud.create_evaluation(db, eval_data=eval_in, judge_id=current_user.id)

@router.get("/submission/{submission_id}", response_model=List[schemas.EvaluationResponse])
def get_submission_evaluations(
    submission_id: int,
    current_user: models.User = Depends(admin_or_judge),
    db: Session = Depends(get_db)
):
    # Verify submission exists
    sub = crud.get_submission_by_id(db, submission_id=submission_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
        
    return crud.get_evaluations_for_submission(db, submission_id=submission_id)

@router.get("/submission/{submission_id}/my-evaluation", response_model=schemas.EvaluationResponse)
def get_my_evaluation(
    submission_id: int,
    current_user: models.User = Depends(judge_required),
    db: Session = Depends(get_db)
):
    eval_obj = db.query(models.Evaluation).filter(
        models.Evaluation.submission_id == submission_id,
        models.Evaluation.judge_id == current_user.id
    ).first()
    if not eval_obj:
        raise HTTPException(status_code=404, detail="Evaluation not found")
    return eval_obj
