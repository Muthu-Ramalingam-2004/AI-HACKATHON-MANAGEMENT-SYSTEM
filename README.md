# AI Hackathon Management System (HackAI)

HackAI is a complete, production-ready MVP for managing AI hackathons, built with **FastAPI** (Python backend), **React.js** (Vite + Tailwind CSS frontend), and a database architecture supporting both **PostgreSQL** and **SQLite** fallback.

## 🚀 Key Features

*   **Role-Based Access Control (RBAC):** Configured dashboards for 4 user roles:
    1.  **Participant:** Browse active hackathons, form teams, add members by email, submit project URLs/PPT slide decks, and view/download certificates.
    2.  **College Representative:** Monitor student registrations, track participation, and review institutional team registrations.
    3.  **Judge:** Review assigned submissions, score projects on a 4-dimensional matrix (Innovation, Technical Skills, Feasibility, Presentation - 25 points each), and submit comments.
    4.  **Super Admin:** CRUD configurations for Hackathons (draft, publish, complete), monitor Colleges and Users rosters, calculate and sort leaderboard standings, and generate PDFs for certificates.
*   **Tamper-Proof Certificates:** Generated on-the-fly via Python's `reportlab` library and returned as a secure streaming download from the server.
*   **Token Authentication:** JWT Access (60 mins) and Refresh (7 days) token authorization cycle with automatic Axios token-refresh interceptors.

---

## 📂 Project Structure

```
d:\AI HACKATHON MANAGEMENT SYSTEM
├── backend/
│   ├── app/
│   │   ├── core/           # Security, config, database engines
│   │   ├── models/         # SQLAlchemy DB models
│   │   ├── schemas/        # Pydantic validation schemas
│   │   ├── crud/           # Database query helper functions
│   │   ├── routers/        # API routers for auth, hackathons, etc.
│   │   └── main.py         # FastAPI bootloader & DB seeding
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/     # Protected route gates, layouts, sidebars
│   │   ├── context/        # Auth global state wrapper
│   │   ├── pages/          # Dashboards (Admin, College, Judge, Participant)
│   │   ├── utils/          # Axios custom client instance
│   │   ├── main.jsx
│   │   └── App.jsx
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── index.html
├── docker-compose.yml
└── .env
```

---

## 📊 Database Schema (ER Diagram)

```mermaid
erDiagram
    COLLEGES {
        int id PK
        string college_name
        text address
        string contact_person
    }
    USERS {
        int id PK
        string name
        string email UK
        string password
        string role
        int college_id FK
        datetime created_at
    }
    HACKATHONS {
        int id PK
        string title
        text description
        datetime start_date
        datetime end_date
        string status
    }
    TEAMS {
        int id PK
        string team_name
        int hackathon_id FK
        int leader_id FK
    }
    TEAM_MEMBERS {
        int id PK
        int team_id FK
        int user_id FK
    }
    SUBMISSIONS {
        int id PK
        int team_id FK
        string project_title
        text description
        string github_url
        string ppt_file
        datetime submitted_at
    }
    EVALUATIONS {
        int id PK
        int submission_id FK
        int judge_id FK
        int innovation_score
        int technical_score
        int feasibility_score
        int presentation_score
        text comments
    }
    CERTIFICATES {
        int id PK
        int user_id FK
        string certificate_type
        string certificate_number UK
        datetime generated_at
    }

    COLLEGES ||--o{ USERS : "contains"
    USERS ||--o{ TEAMS : "leads"
    TEAMS ||--o{ TEAM_MEMBERS : "joined"
    USERS ||--o{ TEAM_MEMBERS : "added"
    HACKATHONS ||--o{ TEAMS : "registers"
    TEAMS ||--o1 SUBMISSIONS : "uploads"
    SUBMISSIONS ||--o{ EVALUATIONS : "receives"
    USERS ||--o{ EVALUATIONS : "scores"
    USERS ||--o{ CERTIFICATES : "receives"
```

---

## 🛠️ API Endpoints List

| Category | Endpoint | Method | Role Restriction | Description |
| :--- | :--- | :---: | :--- | :--- |
| **Auth** | `/api/v1/auth/register` | `POST` | Public | Register participant or coordinator account |
| | `/api/v1/auth/login` | `POST` | Public | Log in, issues Access and Refresh tokens |
| | `/api/v1/auth/refresh` | `POST` | Public | Refreshes and reissues access tokens |
| | `/api/v1/auth/me` | `GET` | Authenticated | Retrieve current user profile details |
| | `/api/v1/auth/me` | `PUT` | Authenticated | Update user profile details |
| **Colleges**| `/api/v1/colleges/` | `POST` | Public | Registers a new college |
| | `/api/v1/colleges/` | `GET` | Public | Fetch listing of all colleges |
| | `/api/v1/colleges/{id}/students` | `GET` | Coordinator, Admin | Retrieve students from a specific college |
| **Hackathons**| `/api/v1/hackathons/` | `POST` | Admin | Create a new hackathon configuration |
| | `/api/v1/hackathons/` | `GET` | Public | Fetch active/draft hackathon catalog |
| | `/api/v1/hackathons/{id}` | `PUT` | Admin | Edit specific hackathon settings |
| | `/api/v1/hackathons/{id}/publish`| `POST` | Admin | Publish a hackathon to accept registrations |
| **Teams** | `/api/v1/teams/` | `POST` | Participant | Create a team and register for hackathon |
| | `/api/v1/teams/{id}/members` | `POST` | Team Leader | Invite and register teammate by email |
| | `/api/v1/teams/me` | `GET` | Participant | Fetch user's registered teams |
| **Submissions**| `/api/v1/submissions/`| `POST` | Team Leader | Upload slide deck and submit project URLs |
| | `/api/v1/submissions/team/{id}`| `GET` | Team, Judge, Admin| Retrieve a team's uploaded submission |
| **Evaluations**| `/api/v1/evaluations/`| `POST` | Judge | Submit scorecard for project |
| | `/api/v1/evaluations/submission/{id}`| `GET` | Judge, Admin | Fetch evaluations for a submission |
| **Certificates**| `/api/v1/certificates/generate`| `POST` | Admin | Issue digital certificate |
| | `/api/v1/certificates/{id}/download`| `GET` | Owner, Admin | Stream secure certificate PDF |
| **Dashboard**| `/api/v1/dashboard/leaderboard`| `GET` | Authenticated | Compute real-time rankings |
| | `/api/v1/dashboard/admin` | `GET` | Admin | Aggregate stats for Super Admin |
| | `/api/v1/dashboard/college` | `GET` | Coordinator | Track college-specific rosters |
| | `/api/v1/dashboard/judge` | `GET` | Judge | Aggregate submissions for grading |

---

## 🔑 Seeded Demo Credentials

On initial boot, the backend automatically seeds mock accounts into the database:

*   **Super Admin Dashboard:** `admin@hackathon.com` / `admin123`
*   **Judge Dashboard:** `judge@hackathon.com` / `judge123`
*   **College Representative Dashboard:** `college@hackathon.com` / `college123`
*   **Participant Dashboard:** `student@hackathon.com` / `student123`

---

## ⚙️ How to Run Locally

### 1. Backend Server Setup
From the root directory:
```bash
# Verify virtual environment exists and activate
.\venv\Scripts\activate

# Navigate to backend directory and start Uvicorn
cd backend
$env:USE_SQLITE="true"
uvicorn app.main:app --host 0.0.0.0 --port 8000
```
The FastAPI swagger documentation will be accessible at: [http://localhost:8000/docs](http://localhost:8000/docs).

### 2. Frontend Server Setup
From the root directory, open a new shell:
```bash
# Navigate to frontend and run Vite
cd frontend
npm run dev
```
The React single-page application is available at: [http://localhost:5173/](http://localhost:5173/).

---

## 🐳 Running with Docker

To build and run all services in a production-ready containerized environment:

```bash
# Build and run containers
docker-compose up --build
```

This starts:
1.  **Database:** PostgreSQL on `localhost:5432` with a persistent Docker volume.
2.  **Backend:** FastAPI API server on `localhost:8000`.
3.  **Frontend:** Nginx serving React optimized build assets on `localhost:5173`.
