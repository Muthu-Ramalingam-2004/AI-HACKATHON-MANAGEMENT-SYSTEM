import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.core.database import SessionLocal
from app.models import models
from app.crud import crud
from app.schemas import schemas
from datetime import datetime, timedelta

def run_test():
    db = SessionLocal()
    try:
        # Check active hackathons
        hackathons = db.query(models.Hackathon).filter(models.Hackathon.status == "active").all()
        print(f"Active hackathons in DB: {len(hackathons)}")
        
        # If no active hackathons, seed one
        if not hackathons:
            print("No active hackathons found. Seeding one...")
            now = datetime.now()
            hack = models.Hackathon(
                title="Generative AI Hackathon 2026",
                description="Build innovative generative AI applications using state-of-the-art LLMs.",
                start_date=now - timedelta(days=2),
                end_date=now + timedelta(days=5),
                status="active"
            )
            db.add(hack)
            db.commit()
            db.refresh(hack)
            print(f"Seeded Hackathon ID: {hack.id}")
            hack_id = hack.id
        else:
            hack_id = hackathons[0].id
            print(f"Using existing active Hackathon ID: {hack_id}")
            
        # Get participant user
        user = db.query(models.User).filter(models.User.email == "student@hackathon.com").first()
        if not user:
            print("student@hackathon.com not found!")
            return
        print(f"Using user: {user.name} (ID: {user.id})")
        
        # Check if user has teams
        teams = crud.get_user_teams(db, user_id=user.id)
        print(f"User teams count: {len(teams)}")
        
        # Try creating a team
        team_create = schemas.TeamCreate(
            team_name="Neural Knights",
            hackathon_id=hack_id
        )
        print("Creating team...")
        new_team = crud.create_team(db, team=team_create, leader_id=user.id)
        print(f"Created Team ID: {new_team.id}, Name: {new_team.team_name}, Leader ID: {new_team.leader_id}")
        print(f"Team members in returned object: {len(new_team.members)}")
        for m in new_team.members:
            print(f"  Member ID: {m.id}, User ID: {m.user_id}, User Name: {m.user.name}")
            
        # Retrieve teams again
        teams = crud.get_user_teams(db, user_id=user.id)
        print(f"User teams count after creation: {len(teams)}")
        for t in teams:
            print(f"  Team ID: {t.id}, Name: {t.team_name}, Leader: {t.leader.name}, Members: {[m.user.name for m in t.members]}")
            
    except Exception as e:
        print(f"Error occurred: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    run_test()
