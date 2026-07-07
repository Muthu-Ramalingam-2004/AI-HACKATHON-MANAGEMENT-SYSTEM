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
from reportlab.graphics.shapes import Drawing
from reportlab.graphics.barcode.qr import QrCodeWidget

router = APIRouter()

admin_required = RoleChecker(["admin"])

def generate_pdf_certificate(name: str, cert_type: str, cert_num: str, hackathon_title: str) -> BytesIO:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(letter),
        leftMargin=50,
        rightMargin=50,
        topMargin=50,
        bottomMargin=50
    )
    
    story = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CertTitle',
        parent=styles['Heading1'],
        fontName='Times-Bold',
        fontSize=36,
        leading=42,
        alignment=1,  # Center
        textColor=colors.HexColor("#1E3A8A"),  # Deep Navy Blue
        spaceAfter=15
    )
    
    subtitle_style = ParagraphStyle(
        'CertSub',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=15,
        leading=18,
        alignment=1,
        textColor=colors.HexColor("#D4AF37"),  # Gold Accent
        spaceAfter=25
    )
    
    name_style = ParagraphStyle(
        'CertName',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=32,
        leading=38,
        alignment=1,
        textColor=colors.HexColor("#111827"),  # Dark charcoal
        spaceAfter=15
    )
    
    text_style = ParagraphStyle(
        'CertText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=13,
        leading=18,
        alignment=1,
        textColor=colors.HexColor("#4B5563"),  # Gray 600
        spaceAfter=30
    )
    
    footer_style = ParagraphStyle(
        'CertFooter',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=9,
        leading=11,
        alignment=1,
        textColor=colors.HexColor("#6B7280")  # Gray 500
    )
    
    story.append(Spacer(1, 70))
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
        
    story.append(Spacer(1, 30))
    story.append(Paragraph(f"Certificate Number: {cert_num}  |  Issued: {datetime.now().strftime('%Y-%m-%d')}", footer_style))
    
    # Canvas border & design callback
    def draw_premium_decorations(canvas, doc):
        canvas.saveState()
        
        # 1. Page Background (soft cream)
        canvas.setFillColor(colors.HexColor("#FCFBF8"))
        canvas.rect(0, 0, 792, 612, fill=True, stroke=False)
        
        # 2. Main Corner Ribbons / Geometrical Accents
        # Top Left
        p1 = canvas.beginPath()
        p1.moveTo(0, 612)
        p1.lineTo(120, 612)
        p1.lineTo(0, 492)
        p1.close()
        canvas.setFillColor(colors.HexColor("#1E3A8A")) # Navy
        canvas.drawPath(p1, fill=True, stroke=False)
        
        p1_stripe = canvas.beginPath()
        p1_stripe.moveTo(0, 482)
        p1_stripe.lineTo(130, 612)
        p1_stripe.lineTo(142, 612)
        p1_stripe.lineTo(0, 470)
        p1_stripe.close()
        canvas.setFillColor(colors.HexColor("#D4AF37")) # Gold
        canvas.drawPath(p1_stripe, fill=True, stroke=False)

        # Top Right
        p2 = canvas.beginPath()
        p2.moveTo(792, 612)
        p2.lineTo(672, 612)
        p2.lineTo(792, 492)
        p2.close()
        canvas.setFillColor(colors.HexColor("#1E3A8A"))
        canvas.drawPath(p2, fill=True, stroke=False)
        
        p2_stripe = canvas.beginPath()
        p2_stripe.moveTo(792, 482)
        p2_stripe.lineTo(662, 612)
        p2_stripe.lineTo(650, 612)
        p2_stripe.lineTo(792, 470)
        p2_stripe.close()
        canvas.setFillColor(colors.HexColor("#D4AF37"))
        canvas.drawPath(p2_stripe, fill=True, stroke=False)

        # Bottom Left
        p3 = canvas.beginPath()
        p3.moveTo(0, 0)
        p3.lineTo(120, 0)
        p3.lineTo(0, 120)
        p3.close()
        canvas.setFillColor(colors.HexColor("#1E3A8A"))
        canvas.drawPath(p3, fill=True, stroke=False)
        
        p3_stripe = canvas.beginPath()
        p3_stripe.moveTo(0, 130)
        p3_stripe.lineTo(130, 0)
        p3_stripe.lineTo(142, 0)
        p3_stripe.lineTo(0, 142)
        p3_stripe.close()
        canvas.setFillColor(colors.HexColor("#D4AF37"))
        canvas.drawPath(p3_stripe, fill=True, stroke=False)

        # Bottom Right
        p4 = canvas.beginPath()
        p4.moveTo(792, 0)
        p4.lineTo(672, 0)
        p4.lineTo(792, 120)
        p4.close()
        canvas.setFillColor(colors.HexColor("#1E3A8A"))
        canvas.drawPath(p4, fill=True, stroke=False)
        
        p4_stripe = canvas.beginPath()
        p4_stripe.moveTo(792, 130)
        p4_stripe.lineTo(662, 0)
        p4_stripe.lineTo(650, 0)
        p4_stripe.lineTo(792, 142)
        p4_stripe.close()
        canvas.setFillColor(colors.HexColor("#D4AF37"))
        canvas.drawPath(p4_stripe, fill=True, stroke=False)
        
        # 3. Outer Borders
        canvas.setStrokeColor(colors.HexColor("#D4AF37")) # Gold Outer
        canvas.setLineWidth(3)
        canvas.rect(25, 25, 742, 562, fill=False, stroke=True)
        
        canvas.setStrokeColor(colors.HexColor("#1E3A8A")) # Navy Inner
        canvas.setLineWidth(1)
        canvas.rect(31, 31, 730, 550, fill=False, stroke=True)

        # 4. Premium Quality Seal (Bottom Left)
        # Ribbon 1
        r1 = canvas.beginPath()
        r1.moveTo(155, 60)
        r1.lineTo(165, 120)
        r1.lineTo(145, 120)
        r1.close()
        canvas.setFillColor(colors.HexColor("#D4AF37"))
        canvas.drawPath(r1, fill=True, stroke=False)
        # Ribbon 2
        r2 = canvas.beginPath()
        r2.moveTo(175, 60)
        r2.lineTo(165, 120)
        r2.lineTo(185, 120)
        r2.close()
        canvas.drawPath(r2, fill=True, stroke=False)
        
        # Outer Gold Circle
        canvas.setFillColor(colors.HexColor("#D4AF37"))
        canvas.circle(165, 120, 32, fill=True, stroke=False)
        # Inner Navy Circle
        canvas.setFillColor(colors.HexColor("#1E3A8A"))
        canvas.circle(165, 120, 26, fill=True, stroke=False)
        
        # Draw small star symbol inside the seal
        canvas.setFillColor(colors.HexColor("#D4AF37"))
        canvas.setFont('Times-Bold', 18)
        canvas.drawCentredString(165, 114, "★")

        # 5. Signatures (Bottom Right)
        # CEO Line & Text
        canvas.setStrokeColor(colors.HexColor("#9CA3AF"))
        canvas.setLineWidth(1)
        canvas.line(460, 95, 580, 95)
        canvas.setFont('Helvetica', 8)
        canvas.setFillColor(colors.HexColor("#4B5563"))
        canvas.drawCentredString(520, 83, "Jane Doe")
        canvas.drawCentredString(520, 71, "CEO, HackAI Global")
        
        # Draw CEO mock signature curve
        sig1 = canvas.beginPath()
        sig1.moveTo(470, 100)
        sig1.curveTo(490, 125, 530, 85, 550, 115)
        sig1.curveTo(560, 125, 570, 100, 585, 105)
        canvas.setStrokeColor(colors.HexColor("#1E3A8A"))
        canvas.setLineWidth(1.5)
        canvas.drawPath(sig1, fill=False, stroke=True)

        # Host Dean Line & Text
        canvas.setStrokeColor(colors.HexColor("#9CA3AF"))
        canvas.setLineWidth(1)
        canvas.line(610, 95, 730, 95)
        canvas.setFont('Helvetica', 8)
        canvas.setFillColor(colors.HexColor("#4B5563"))
        canvas.drawCentredString(670, 83, "Dr. John Smith")
        canvas.drawCentredString(670, 71, "Dean, Evaluator Board")
        
        # Draw Dean mock signature curve
        sig2 = canvas.beginPath()
        sig2.moveTo(620, 105)
        sig2.curveTo(640, 85, 680, 125, 700, 100)
        sig2.curveTo(710, 90, 720, 115, 728, 110)
        canvas.setStrokeColor(colors.HexColor("#D4AF37"))
        canvas.setLineWidth(1.5)
        canvas.drawPath(sig2, fill=False, stroke=True)
        
        # 6. QR Code (Top Right)
        qr_code = QrCodeWidget(cert_num)
        qr_code.barWidth = 60
        qr_code.barHeight = 60
        qr_code.x = 0
        qr_code.y = 0
        
        d = Drawing(60, 60)
        d.add(qr_code)
        d.drawOn(canvas, 675, 485)
        
        # Label above QR Code
        canvas.setFont('Courier', 7)
        canvas.setFillColor(colors.HexColor("#6B7280"))
        canvas.drawCentredString(705, 550, "SECURE VERIFICATION")
        
        canvas.restoreState()

    doc.build(story, onFirstPage=draw_premium_decorations)
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
