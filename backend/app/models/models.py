from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class College(Base):
    __tablename__ = "colleges"

    id = Column(Integer, primary_key=True, index=True)
    college_name = Column(String(255), nullable=False)
    address = Column(Text, nullable=True)
    contact_person = Column(String(255), nullable=True)

    users = relationship("User", back_populates="college")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)  # participant, college, judge, admin
    college_id = Column(Integer, ForeignKey("colleges.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    college = relationship("College", back_populates="users")
    led_teams = relationship("Team", back_populates="leader")
    team_memberships = relationship("TeamMember", back_populates="user")
    evaluations = relationship("Evaluation", back_populates="judge")
    certificates = relationship("Certificate", back_populates="user")


class Hackathon(Base):
    __tablename__ = "hackathons"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=False)
    status = Column(String(50), default="draft")  # draft, active, completed

    teams = relationship("Team", back_populates="hackathon", cascade="all, delete-orphan")


class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    team_name = Column(String(255), nullable=False)
    hackathon_id = Column(Integer, ForeignKey("hackathons.id", ondelete="CASCADE"), nullable=False)
    leader_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    hackathon = relationship("Hackathon", back_populates="teams")
    leader = relationship("User", back_populates="led_teams")
    members = relationship("TeamMember", back_populates="team", cascade="all, delete-orphan")
    submissions = relationship("Submission", back_populates="team", cascade="all, delete-orphan")


class TeamMember(Base):
    __tablename__ = "team_members"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    team = relationship("Team", back_populates="members")
    user = relationship("User", back_populates="team_memberships")


class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    project_title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    github_url = Column(String(255), nullable=True)
    ppt_file = Column(String(255), nullable=True)  # File path
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())

    team = relationship("Team", back_populates="submissions")
    evaluations = relationship("Evaluation", back_populates="submission", cascade="all, delete-orphan")


class Evaluation(Base):
    __tablename__ = "evaluations"

    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("submissions.id", ondelete="CASCADE"), nullable=False)
    judge_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    innovation_score = Column(Integer, nullable=False, default=0)    # out of 25
    technical_score = Column(Integer, nullable=False, default=0)     # out of 25
    feasibility_score = Column(Integer, nullable=False, default=0)   # out of 25
    presentation_score = Column(Integer, nullable=False, default=0)  # out of 25
    comments = Column(Text, nullable=True)

    submission = relationship("Submission", back_populates="evaluations")
    judge = relationship("User", back_populates="evaluations")


class Certificate(Base):
    __tablename__ = "certificates"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    certificate_type = Column(String(50), nullable=False)  # participation, winner
    certificate_number = Column(String(100), unique=True, nullable=False)
    generated_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="certificates")
