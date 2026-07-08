from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

# Token Schemas
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    role: str
    name: str

class TokenData(BaseModel):
    user_id: Optional[int] = None
    role: Optional[str] = None

class RefreshTokenRequest(BaseModel):
    refresh_token: str

# College Schemas
class CollegeBase(BaseModel):
    college_name: str
    address: Optional[str] = None
    contact_person: Optional[str] = None

class CollegeCreate(CollegeBase):
    pass

class CollegeResponse(CollegeBase):
    id: int

    class Config:
        from_attributes = True

# User Schemas
class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str  # participant, college, judge, admin
    college_id: Optional[int] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime
    college: Optional[CollegeResponse] = None

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    college_id: Optional[int] = None

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str



# Hackathon Schemas
class HackathonBase(BaseModel):
    title: str
    description: Optional[str] = None
    start_date: datetime
    end_date: datetime
    status: Optional[str] = "draft"  # draft, active, completed

class HackathonCreate(HackathonBase):
    pass

class HackathonUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    status: Optional[str] = None

class HackathonResponse(HackathonBase):
    id: int

    class Config:
        from_attributes = True

# Team Member Schema
class TeamMemberCreate(BaseModel):
    email: EmailStr

class TeamMemberResponse(BaseModel):
    id: int
    user_id: int
    user: UserResponse

    class Config:
        from_attributes = True

# Team Schemas
class TeamBase(BaseModel):
    team_name: str
    hackathon_id: int

class TeamCreate(TeamBase):
    pass

class TeamResponse(TeamBase):
    id: int
    leader_id: int
    leader: UserResponse
    members: List[TeamMemberResponse] = []
    hackathon: HackathonResponse

    class Config:
        from_attributes = True

# Submission Schemas
class SubmissionBase(BaseModel):
    project_title: str
    description: Optional[str] = None
    github_url: Optional[str] = None

class SubmissionCreate(SubmissionBase):
    team_id: int

class SubmissionResponse(SubmissionBase):
    id: int
    team_id: int
    ppt_file: Optional[str] = None
    submitted_at: datetime
    team: Optional[TeamResponse] = None

    class Config:
        from_attributes = True

# Evaluation Schemas
class EvaluationBase(BaseModel):
    innovation_score: int = Field(..., ge=0, le=25)
    technical_score: int = Field(..., ge=0, le=25)
    feasibility_score: int = Field(..., ge=0, le=25)
    presentation_score: int = Field(..., ge=0, le=25)
    comments: Optional[str] = None

class EvaluationCreate(EvaluationBase):
    submission_id: int

class EvaluationResponse(EvaluationBase):
    id: int
    submission_id: int
    judge_id: int
    judge: UserResponse

    class Config:
        from_attributes = True

# Certificate Schemas
class CertificateBase(BaseModel):
    certificate_type: str  # participation, winner
    certificate_number: str

class CertificateResponse(CertificateBase):
    id: int
    user_id: int
    generated_at: datetime
    user: UserResponse
    hackathon_title: Optional[str] = None

    class Config:
        from_attributes = True

# Leaderboard Schema
class LeaderboardEntry(BaseModel):
    rank: int
    team_id: int
    team_name: str
    hackathon_title: str
    innovation_score: float
    technical_score: float
    feasibility_score: float
    presentation_score: float
    total_score: float
    submitted_at: datetime
