from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import models
from app.schemas import schemas
from app.core.security import get_password_hash

# User Operations
def get_user_by_id(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    if not email:
        return None
    return db.query(models.User).filter(func.lower(models.User.email) == email.strip().lower()).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_pwd = get_password_hash(user.password)
    db_user = models.User(
        name=user.name,
        email=user.email,
        password=hashed_pwd,
        role=user.role,
        college_id=user.college_id
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user_profile(db: Session, user_id: int, updates: schemas.UserUpdate):
    db_user = get_user_by_id(db, user_id)
    if not db_user:
        return None
    for field, value in updates.model_dump(exclude_unset=True).items():
        setattr(db_user, field, value)
    db.commit()
    db.refresh(db_user)
    return db_user

# College Operations
def create_college(db: Session, college: schemas.CollegeCreate):
    db_college = models.College(**college.model_dump())
    db.add(db_college)
    db.commit()
    db.refresh(db_college)
    return db_college

def get_colleges(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.College).offset(skip).limit(limit).all()

def get_college_by_id(db: Session, college_id: int):
    return db.query(models.College).filter(models.College.id == college_id).first()

# Hackathon Operations
def create_hackathon(db: Session, hackathon: schemas.HackathonCreate):
    db_hackathon = models.Hackathon(**hackathon.model_dump())
    db.add(db_hackathon)
    db.commit()
    db.refresh(db_hackathon)
    return db_hackathon

def get_hackathons(db: Session, skip: int = 0, limit: int = 100, status: str = None):
    query = db.query(models.Hackathon)
    if status:
        query = query.filter(models.Hackathon.status == status)
    return query.offset(skip).limit(limit).all()

def get_hackathon_by_id(db: Session, hackathon_id: int):
    return db.query(models.Hackathon).filter(models.Hackathon.id == hackathon_id).first()

def update_hackathon(db: Session, hackathon_id: int, hackathon: schemas.HackathonUpdate):
    db_hackathon = get_hackathon_by_id(db, hackathon_id)
    if not db_hackathon:
        return None
    
    status_updated_to_completed = False
    if hackathon.status == "completed" and db_hackathon.status != "completed":
        status_updated_to_completed = True

    for field, value in hackathon.model_dump(exclude_unset=True).items():
        setattr(db_hackathon, field, value)
    db.commit()
    db.refresh(db_hackathon)

    if status_updated_to_completed:
        for team in db_hackathon.teams:
            auto_generate_team_certificates(db, team.id)

    return db_hackathon

def delete_hackathon(db: Session, hackathon_id: int):
    db_hackathon = get_hackathon_by_id(db, hackathon_id)
    if not db_hackathon:
        return False
    db.delete(db_hackathon)
    db.commit()
    return True

# Team Operations
def create_team(db: Session, team: schemas.TeamCreate, leader_id: int):
    db_team = models.Team(
        team_name=team.team_name,
        hackathon_id=team.hackathon_id,
        leader_id=leader_id
    )
    db.add(db_team)
    db.commit()
    db.refresh(db_team)
    
    # Also add the leader as a team member automatically
    db_member = models.TeamMember(team_id=db_team.id, user_id=leader_id)
    db.add(db_member)
    db.commit()
    
    # Refresh to load relationships
    db.refresh(db_team)
    return db_team

def get_team_by_id(db: Session, team_id: int):
    return db.query(models.Team).filter(models.Team.id == team_id).first()

def add_team_member(db: Session, team_id: int, user_id: int):
    # Check if user is already in this team
    existing = db.query(models.TeamMember).filter(
        models.TeamMember.team_id == team_id,
        models.TeamMember.user_id == user_id
    ).first()
    if existing:
        return existing
    db_member = models.TeamMember(team_id=team_id, user_id=user_id)
    db.add(db_member)
    db.commit()
    db.refresh(db_member)
    
    # If the team has already submitted their project, auto-generate a certificate for the new member
    submission = db.query(models.Submission).filter(models.Submission.team_id == team_id).first()
    if submission:
        auto_generate_team_certificates(db, team_id)
        
    return db_member

def get_user_teams(db: Session, user_id: int):
    return db.query(models.Team).join(
        models.TeamMember, models.Team.id == models.TeamMember.team_id
    ).filter(
        models.TeamMember.user_id == user_id
    ).all()

# Submission Operations
def auto_generate_team_certificates(db: Session, team_id: int):
    try:
        team = db.query(models.Team).filter(models.Team.id == team_id).first()
        if team:
            import uuid
            for member in team.members:
                prefix = f"CERT-{team.hackathon_id}-{member.user_id}-"
                existing_cert = db.query(models.Certificate).filter(
                    models.Certificate.user_id == member.user_id,
                    models.Certificate.certificate_number.like(f"{prefix}%")
                ).first()
                if not existing_cert:
                    unique_num = f"CERT-{team.hackathon_id}-{member.user_id}-{uuid.uuid4().hex[:8].upper()}"
                    db_cert = models.Certificate(
                        user_id=member.user_id,
                        certificate_type="participation",
                        certificate_number=unique_num
                    )
                    db.add(db_cert)
            db.commit()
    except Exception as e:
        print(f"Error auto-generating certificates: {e}")

def create_submission(db: Session, submission: schemas.SubmissionCreate, ppt_file_path: str = None):
    # Check if team already has a submission
    db_sub = db.query(models.Submission).filter(models.Submission.team_id == submission.team_id).first()
    if db_sub:
        db_sub.project_title = submission.project_title
        db_sub.description = submission.description
        db_sub.github_url = submission.github_url
        if ppt_file_path:
            db_sub.ppt_file = ppt_file_path
        db.commit()
        db.refresh(db_sub)
        auto_generate_team_certificates(db, submission.team_id)
        return db_sub
    
    db_sub = models.Submission(
        team_id=submission.team_id,
        project_title=submission.project_title,
        description=submission.description,
        github_url=submission.github_url,
        ppt_file=ppt_file_path
    )
    db.add(db_sub)
    db.commit()
    db.refresh(db_sub)
    auto_generate_team_certificates(db, submission.team_id)
    return db_sub

def get_submission_by_team(db: Session, team_id: int):
    return db.query(models.Submission).filter(models.Submission.team_id == team_id).first()

def get_submission_by_id(db: Session, submission_id: int):
    return db.query(models.Submission).filter(models.Submission.id == submission_id).first()

def get_submissions_for_judge(db: Session, judge_id: int):
    # For simplicity, we can let judges see all project submissions in this MVP,
    # or implement assignments. We'll list all submissions.
    return db.query(models.Submission).all()

# Evaluation Operations
def create_evaluation(db: Session, eval_data: schemas.EvaluationCreate, judge_id: int):
    # Check if judge already evaluated this submission
    existing = db.query(models.Evaluation).filter(
        models.Evaluation.submission_id == eval_data.submission_id,
        models.Evaluation.judge_id == judge_id
    ).first()
    if existing:
        existing.innovation_score = eval_data.innovation_score
        existing.technical_score = eval_data.technical_score
        existing.feasibility_score = eval_data.feasibility_score
        existing.presentation_score = eval_data.presentation_score
        existing.comments = eval_data.comments
        db.commit()
        db.refresh(existing)
        
        # Trigger certificate auto-generation on project completion/evaluation
        submission = db.query(models.Submission).filter(models.Submission.id == eval_data.submission_id).first()
        if submission:
            auto_generate_team_certificates(db, submission.team_id)
            
        return existing
        
    db_eval = models.Evaluation(
        submission_id=eval_data.submission_id,
        judge_id=judge_id,
        innovation_score=eval_data.innovation_score,
        technical_score=eval_data.technical_score,
        feasibility_score=eval_data.feasibility_score,
        presentation_score=eval_data.presentation_score,
        comments=eval_data.comments
    )
    db.add(db_eval)
    db.commit()
    db.refresh(db_eval)
    
    # Trigger certificate auto-generation on project completion/evaluation
    submission = db.query(models.Submission).filter(models.Submission.id == eval_data.submission_id).first()
    if submission:
        auto_generate_team_certificates(db, submission.team_id)
        
    return db_eval

def get_evaluations_for_submission(db: Session, submission_id: int):
    return db.query(models.Evaluation).filter(models.Evaluation.submission_id == submission_id).all()

# Certificate Operations
def create_certificate(db: Session, user_id: int, cert_type: str, cert_num: str):
    db_cert = models.Certificate(
        user_id=user_id,
        certificate_type=cert_type,
        certificate_number=cert_num
    )
    db.add(db_cert)
    db.commit()
    db.refresh(db_cert)
    return db_cert

def get_certificates_by_user(db: Session, user_id: int):
    return db.query(models.Certificate).filter(models.Certificate.user_id == user_id).all()

def get_all_certificates(db: Session):
    return db.query(models.Certificate).all()
