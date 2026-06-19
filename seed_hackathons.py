import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.core.database import SessionLocal
from app.models import models
from datetime import datetime, timedelta

def seed():
    db = SessionLocal()
    try:
        count = db.query(models.Hackathon).count()
        print(f"Current hackathon count: {count}")
        if count == 0:
            now = datetime.now()
            hack1 = models.Hackathon(
                title="Generative AI Hackathon 2026",
                description="Build innovative generative AI applications using state-of-the-art LLMs.",
                start_date=now - timedelta(days=2),
                end_date=now + timedelta(days=5),
                status="active"
            )
            hack2 = models.Hackathon(
                title="Green Tech AI Challenge",
                description="Apply AI models to solve sustainability, renewable energy, and climate issues.",
                start_date=now + timedelta(days=10),
                end_date=now + timedelta(days=15),
                status="draft"
            )
            db.add(hack1)
            db.add(hack2)
            db.commit()
            print("Successfully seeded hackathons!")
        else:
            print("Hackathons already exist, skipping.")
    except Exception as e:
        print(f"Error seeding hackathons: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
