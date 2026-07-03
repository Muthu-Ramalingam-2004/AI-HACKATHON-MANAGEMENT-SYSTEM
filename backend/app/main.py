import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.routers import auth, colleges, hackathons, teams, submissions, evaluations, certificates, dashboard
from app.models import models
from app.core.security import get_password_hash
from sqlalchemy import text


# Create Database tables on startup if they don't exist
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for AI Hackathon Management System",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)


  @app.get("/health")
    def health():
        return {"ststus": "ok"}

# CORS configuration to allow connections from React frontend
allowed_origins_raw = os.getenv("ALLOWED_ORIGINS", "")
allowed_origins = [origin.strip() for origin in allowed_origins_raw.split(",") if origin.strip()]

if not allowed_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Mount upload directory to serve files (e.g., PPT files) staticly
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include Routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(colleges.router, prefix=f"{settings.API_V1_STR}/colleges", tags=["Colleges"])
app.include_router(hackathons.router, prefix=f"{settings.API_V1_STR}/hackathons", tags=["Hackathons"])
app.include_router(teams.router, prefix=f"{settings.API_V1_STR}/teams", tags=["Teams"])
app.include_router(submissions.router, prefix=f"{settings.API_V1_STR}/submissions", tags=["Submissions"])
app.include_router(evaluations.router, prefix=f"{settings.API_V1_STR}/evaluations", tags=["Evaluations"])
app.include_router(certificates.router, prefix=f"{settings.API_V1_STR}/certificates", tags=["Certificates"])
app.include_router(dashboard.router, prefix=f"{settings.API_V1_STR}/dashboard", tags=["Dashboard"])

# Seed default data (Super Admin & initial college) if the DB is empty
@app.on_event("startup")
def seed_data():
    db = SessionLocal()
    try:
        # Check if colleges exist, if not seed one
        if db.query(models.College).count() == 0:
            default_college = models.College(
                college_name="Global Institute of Technology",
                address="123 Tech Park, Silicon Valley",
                contact_person="Dr. Alan Turing"
            )
            db.add(default_college)
            db.commit()
            db.refresh(default_college)
            print("Default College Seeded.")
            
            # Seed secondary college
            college2 = models.College(
                college_name="National Science Academy",
                address="456 Research Blvd, Boston",
                contact_person="Dr. Marie Curie"
            )
            db.add(college2)
            db.commit()
            print("Second College Seeded.")

        # Check if admin user exists, if not seed one
        admin_email = "admin@hackathon.com"
        db_admin = db.query(models.User).filter(models.User.email == admin_email).first()
        if not db_admin:
            admin_user = models.User(
                name="System Administrator",
                email=admin_email,
                password=get_password_hash("admin123"),
                role="admin",
                college_id=None
            )
            db.add(admin_user)
            db.commit()
            print("Default Admin User Seeded (admin@hackathon.com / admin123).")
            
        # Seed a Judge user if none exist
        judge_email = "judge@hackathon.com"
        db_judge = db.query(models.User).filter(models.User.email == judge_email).first()
        if not db_judge:
            judge_user = models.User(
                name="Expert Judge",
                email=judge_email,
                password=get_password_hash("judge123"),
                role="judge",
                college_id=None
            )
            db.add(judge_user)
            db.commit()
            print("Default Judge User Seeded (judge@hackathon.com / judge123).")
            
        # Seed a College user if none exist
        college_email = "college@hackathon.com"
        db_college_user = db.query(models.User).filter(models.User.email == college_email).first()
        if not db_college_user:
            college_user = models.User(
                name="College Coordinator",
                email=college_email,
                password=get_password_hash("college123"),
                role="college",
                college_id=1
            )
            db.add(college_user)
            db.commit()
            print("Default College Coordinator User Seeded (college@hackathon.com / college123).")
            
        # Seed a Participant user if none exist
        student_email = "student@hackathon.com"
        db_student = db.query(models.User).filter(models.User.email == student_email).first()
        if not db_student:
            student_user = models.User(
                name="Jane Doe",
                email=student_email,
                password=get_password_hash("student123"),
                role="participant",
                college_id=1
            )
            db.add(student_user)
            db.commit()
            print("Default Participant User Seeded (student@hackathon.com / student123).")
            
        # Seed Hackathons if none exist
        if db.query(models.Hackathon).count() == 0:
            from datetime import datetime, timedelta
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
            print("Default Hackathons Seeded (Generative AI Hackathon 2026 - active, Green Tech AI Challenge - draft).")
            
    except Exception as e:
        print(f"Error during seeding: {e}")
    finally:
        db.close()

@app.get("/")
def read_root():
    return {
        "message": "Welcome to the AI Hackathon Management System API",
        "docs_url": "/docs",
        "version": "1.0.0"
    }

@app.get(f"{settings.API_V1_STR}/health", tags=["Health"])
def health_check():
    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
    finally:
        db.close()
    
    return {
        "status": "healthy",
        "database": db_status,
        "api_version": "1.0.0"
    }

