import uuid
from datetime import datetime
from io import BytesIO
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.crud import crud
from app.schemas import schemas
from app.routers.deps import get_current_user, RoleChecker
from app.models import models

# ReportLab imports for certificate generation
from reportlab.lib.pagesizes import letter, landscape
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

router = APIRouter()

admin_required = RoleChecker(["admin"])

def generate_pdf_certificate(name: str, cert_type: str, cert_num: str, hackathon_title: str) -> BytesIO:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(letter),
        leftMargin=40,
        rightMargin=40,
        topMargin=40,
        bottomMargin=40
    )
    
    story = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CertTitle',
        parent=styles['Heading1'],
        fontSize=36,
        leading=42,
        alignment=1,  # Center
        textColor=colors.HexColor("#4F46E5"),  # Indigo
        spaceAfter=20
    )
    
    subtitle_style = ParagraphStyle(
        'CertSub',
        parent=styles['Normal'],
        fontSize=18,
        leading=22,
        alignment=1,
        textColor=colors.HexColor("#4B5563"),  # Gray 600
        spaceAfter=30
    )
    
    name_style = ParagraphStyle(
        'CertName',
        parent=styles['Heading2'],
        fontSize=28,
        leading=34,
        alignment=1,
        textColor=colors.HexColor("#111827"),  # Gray 900
        spaceAfter=20
    )
    
    text_style = ParagraphStyle(
        'CertText',
        parent=styles['Normal'],
        fontSize=14,
        leading=18,
        alignment=1,
        textColor=colors.HexColor("#374151"),  # Gray 700
        spaceAfter=40
    )
    
    footer_style = ParagraphStyle(
        'CertFooter',
        parent=styles['Normal'],
        fontSize=10,
        leading=12,
        alignment=1,
        textColor=colors.HexColor("#9CA3AF")  # Gray 400
    )
    
    story.append(Spacer(1, 40))
    if cert_type.lower() == "winner":
        story.append(Paragraph("CERTIFICATE OF EXCELLENCE", title_style))
        story.append(Paragraph("This is proudly presented to", subtitle_style))
        story.append(Paragraph(name, name_style))
        story.append(Paragraph(f"for achieving a winning position in the <b>{hackathon_title}</b>", text_style))
    else:
        story.append(Paragraph("CERTIFICATE OF PARTICIPATION", title_style))
        story.append(Paragraph("This is awarded to", subtitle_style))
        story.append(Paragraph(name, name_style))
        story.append(Paragraph(f"for successfully participating in the <b>{hackathon_title}</b>", text_style))
        
    story.append(Spacer(1, 40))
    story.append(Paragraph(f"Certificate Number: {cert_num}  |  Generated on: {datetime.now().strftime('%Y-%m-%d')}", footer_style))
    
    # Canvas border callback
    def draw_border(canvas, doc):
        canvas.saveState()
        canvas.setStrokeColor(colors.HexColor("#4F46E5"))
        canvas.setLineWidth(5)
        canvas.rect(20, 20, doc.width + 40, doc.height + 40)
        
        # Inner border
        canvas.setStrokeColor(colors.HexColor("#D1D5DB"))
        canvas.setLineWidth(1)
        canvas.rect(26, 26, doc.width + 28, doc.height + 28)
        canvas.restoreState()
        
    doc.build(story, onFirstPage=draw_border)
    buffer.seek(0)
    return buffer

@router.post("/generate", response_model=schemas.CertificateResponse)
def generate_user_certificate(
    user_id: int,
    cert_type: str,  # "participation", "winner"
    hackathon_id: int,
    current_user: models.User = Depends(admin_required),
    db: Session = Depends(get_db)
):
    # Verify user exists
    target_user = crud.get_user_by_id(db, user_id=user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Verify hackathon exists
    hackathon = crud.get_hackathon_by_id(db, hackathon_id=hackathon_id)
    if not hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")
        
    # Generate unique certificate number
    unique_num = f"CERT-{hackathon_id}-{user_id}-{uuid.uuid4().hex[:8].upper()}"
    
    # Save record
    db_cert = crud.create_certificate(
        db,
        user_id=user_id,
        cert_type=cert_type,
        cert_num=unique_num
    )
    return db_cert

def populate_hackathon_title(db: Session, certs: List[models.Certificate]):
    for cert in certs:
        hack_title = "AI Hackathon"
        try:
            parts = cert.certificate_number.split("-")
            if len(parts) > 1:
                hack_id = int(parts[1])
                hackathon = crud.get_hackathon_by_id(db, hackathon_id=hack_id)
                if hackathon:
                    hack_title = hackathon.title
        except (IndexError, ValueError):
            pass
        cert.hackathon_title = hack_title
    return certs

@router.get("/my-certificates", response_model=List[schemas.CertificateResponse])
def list_my_certificates(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    certs = crud.get_certificates_by_user(db, user_id=current_user.id)
    if not certs:
        # Generate sample certificates for testing if no certificates exist
        hackathon = db.query(models.Hackathon).first()
        hack_id = hackathon.id if hackathon else 1
        
        # Create a sample participation certificate
        unique_num_p = f"CERT-{hack_id}-{current_user.id}-{uuid.uuid4().hex[:8].upper()}"
        crud.create_certificate(
            db,
            user_id=current_user.id,
            cert_type="participation",
            cert_num=unique_num_p
        )
        
        # Create a sample winner certificate
        unique_num_w = f"CERT-{hack_id}-{current_user.id}-{uuid.uuid4().hex[:8].upper()}"
        crud.create_certificate(
            db,
            user_id=current_user.id,
            cert_type="winner",
            cert_num=unique_num_w
        )
        
        # Fetch again to populate SQLAlchemy relationships
        certs = crud.get_certificates_by_user(db, user_id=current_user.id)
        print(f"DEBUG: Re-fetched certs count: {len(certs)}")
        
    populate_hackathon_title(db, certs)
    return certs

@router.get("/user/{user_id}", response_model=List[schemas.CertificateResponse])
def list_user_certificates(
    user_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check permissions
    if current_user.id != user_id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    certs = crud.get_certificates_by_user(db, user_id=user_id)
    populate_hackathon_title(db, certs)
    return certs

@router.get("/all", response_model=List[schemas.CertificateResponse])
def get_all_certs(
    current_user: models.User = Depends(admin_required),
    db: Session = Depends(get_db)
):
    certs = crud.get_all_certificates(db)
    if not certs:
        # Generate sample certificates for participant users if none exist in the database
        participants = db.query(models.User).filter(models.User.role == "participant").all()
        hackathon = db.query(models.Hackathon).first()
        hack_id = hackathon.id if hackathon else 1
        for u in participants:
            # Create a sample participation certificate
            unique_num_p = f"CERT-{hack_id}-{u.id}-{uuid.uuid4().hex[:8].upper()}"
            crud.create_certificate(
                db,
                user_id=u.id,
                cert_type="participation",
                cert_num=unique_num_p
            )
            
            # Create a sample winner certificate
            unique_num_w = f"CERT-{hack_id}-{u.id}-{uuid.uuid4().hex[:8].upper()}"
            crud.create_certificate(
                db,
                user_id=u.id,
                cert_type="winner",
                cert_num=unique_num_w
            )
        certs = crud.get_all_certificates(db)
    populate_hackathon_title(db, certs)
    return certs

@router.get("/{certificate_id}/download")
def download_certificate(
    certificate_id: int,
    request: Request,
    token: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    # Try parsing token from Authorization header first, if not check query token
    auth_header = request.headers.get("Authorization")
    actual_token = None
    if auth_header and auth_header.startswith("Bearer "):
        actual_token = auth_header.split(" ")[1]
    elif token:
        actual_token = token
        
    if not actual_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
        
    # Decode and retrieve user
    from app.core.security import decode_token
    payload = decode_token(actual_token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload is missing user identification",
        )
        
    user_id = int(user_id_str)
    current_user = crud.get_user_by_id(db, user_id=user_id)
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    cert = db.query(models.Certificate).filter(models.Certificate.id == certificate_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
        
    # Check permissions (only the owner or admin can download)
    if current_user.id != cert.user_id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to download this certificate")
        
    # Dynamically resolve hackathon title from certificate number
    hackathon_title = "AI Hackathon"
    try:
        parts = cert.certificate_number.split("-")
        if len(parts) > 1:
            hack_id = int(parts[1])
            hackathon = crud.get_hackathon_by_id(db, hackathon_id=hack_id)
            if hackathon:
                hackathon_title = hackathon.title
    except (IndexError, ValueError):
        pass
        
    pdf_buffer = generate_pdf_certificate(
        name=cert.user.name,
        cert_type=cert.certificate_type,
        cert_num=cert.certificate_number,
        hackathon_title=hackathon_title
    )
    
    filename = f"certificate_{cert.certificate_number}.pdf"
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
