"""PDF certificate generation using ReportLab."""
import io
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER


def generate_certificate(participant_name: str, event_name: str, event_date: str, position: str = "") -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=landscape(A4), topMargin=2 * cm, bottomMargin=2 * cm)
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "Title",
        parent=styles["Title"],
        fontSize=28,
        textColor=colors.HexColor("#1a3c6e"),
        alignment=TA_CENTER,
        spaceAfter=20,
    )
    body_style = ParagraphStyle(
        "Body",
        parent=styles["Normal"],
        fontSize=14,
        alignment=TA_CENTER,
        spaceAfter=12,
    )

    story = [
        Spacer(1, 1 * cm),
        Paragraph("Youth Research & Innovation Foundation", title_style),
        Paragraph("Certificate of Achievement", title_style),
        Spacer(1, 0.5 * cm),
        Paragraph("This is to certify that", body_style),
        Paragraph(f"<b>{participant_name}</b>", ParagraphStyle("name", parent=body_style, fontSize=22)),
        Paragraph(f"has successfully participated in <b>{event_name}</b>", body_style),
        Paragraph(f"held on {event_date}", body_style),
    ]
    if position:
        story.append(Paragraph(f"Position: <b>{position}</b>", body_style))

    doc.build(story)
    return buffer.getvalue()
