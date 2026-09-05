from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

from rules.weighing import evaluate_weighing_test
from rules.eccentricity import evaluate_eccentricity_test
from rules.repeatability import evaluate_repeatability_test
from rules.tare import evaluate_tare_zero_test
from database.database import get_connection, initialize_database
from datetime import datetime
import uuid
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from fastapi.responses import FileResponse
import os
import qrcode



app = FastAPI(
    title="OIML-MetricFlow API",
    description="OIML R-76 Test Report System",
    version="1.0.0"
)
initialize_database()


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TestPoint(BaseModel):
    load: float
    indicated: float


class WeighingTestRequest(BaseModel):
    scale_e: float
    accuracy_class: str
    test_points: List[TestPoint]


class EccentricityTestRequest(BaseModel):
    test_load: float
    scale_e: float
    readings: List[float]


class RepeatabilityTestRequest(BaseModel):
    test_load: float
    scale_e: float
    accuracy_class: str
    readings: List[float]

class InspectionCreateRequest(BaseModel):
    inspector_name: str

    instrument_name: str
    manufacturer: str
    model: str
    serial_number: str

    accuracy_class: str
    capacity: float
    scale_e: float

    weighing_status: str
    eccentricity_status: str
    repeatability_status: str
    tare_zero_status: str

    final_status: str

class TareZeroTestRequest(BaseModel):
    scale_e: float
    zero_errors: List[float] = []
    tare_errors: List[float] = []


@app.get("/")
def root():
    return {
        "message": "OIML-MetricFlow API is running",
        "status": "success"
    }


@app.post("/evaluate/weighing")
def evaluate_weighing(request: WeighingTestRequest):

    test_points = [
        {
            "load": point.load,
            "indicated": point.indicated
        }
        for point in request.test_points
    ]

    result = evaluate_weighing_test(
        scale_e=request.scale_e,
        accuracy_class=request.accuracy_class,
        test_points=test_points
    )

    return result


@app.post("/evaluate/eccentricity")
def evaluate_eccentricity(
    request: EccentricityTestRequest
):

    result = evaluate_eccentricity_test(
        test_load=request.test_load,
        readings=request.readings,
        scale_e=request.scale_e
    )

    return result


@app.post("/evaluate/repeatability")
def evaluate_repeatability(
    request: RepeatabilityTestRequest
):

    result = evaluate_repeatability_test(
        test_load=request.test_load,
        readings=request.readings,
        scale_e=request.scale_e,
        accuracy_class=request.accuracy_class
    )

    return result


@app.post("/evaluate/tare-zero")
def evaluate_tare_zero(
    request: TareZeroTestRequest
):

    result = evaluate_tare_zero_test(
        scale_e=request.scale_e,
        zero_errors=request.zero_errors,
        tare_errors=request.tare_errors
    )

    return result

@app.post("/inspections")
def create_inspection(request: InspectionCreateRequest):

    session_id = f"OIML-{datetime.now().year}-{uuid.uuid4().hex[:8].upper()}"
    created_at = datetime.now().isoformat()

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        INSERT INTO inspections (
            session_id,
            inspector_name,
            instrument_name,
            manufacturer,
            model,
            serial_number,
            accuracy_class,
            capacity,
            scale_e,
            weighing_status,
            eccentricity_status,
            repeatability_status,
            tare_zero_status,
            final_status,
            created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            session_id,
            request.inspector_name,
            request.instrument_name,
            request.manufacturer,
            request.model,
            request.serial_number,
            request.accuracy_class,
            request.capacity,
            request.scale_e,
            request.weighing_status,
            request.eccentricity_status,
            request.repeatability_status,
            request.tare_zero_status,
            request.final_status,
            created_at,
        ),
    )

    connection.commit()
    connection.close()

    return {
        "message": "Inspection saved successfully",
        "session_id": session_id,
        "created_at": created_at,
        "final_status": request.final_status,
    }
@app.get("/inspections")
def get_inspections():

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT
            session_id,
            inspector_name,
            instrument_name,
            manufacturer,
            model,
            serial_number,
            accuracy_class,
            capacity,
            scale_e,
            weighing_status,
            eccentricity_status,
            repeatability_status,
            tare_zero_status,
            final_status,
            created_at
        FROM inspections
        ORDER BY id DESC
        """
    )

    rows = cursor.fetchall()

    connection.close()

    return {
        "count": len(rows),
        "inspections": [dict(row) for row in rows]
    }
@app.get("/inspections/{session_id}/report")
def generate_inspection_report(session_id: str):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT
            session_id,
            inspector_name,
            instrument_name,
            manufacturer,
            model,
            serial_number,
            accuracy_class,
            capacity,
            scale_e,
            weighing_status,
            eccentricity_status,
            repeatability_status,
            tare_zero_status,
            final_status,
            created_at
        FROM inspections
        WHERE session_id = ?
        """,
        (session_id,)
    )

    inspection = cursor.fetchone()
    conn.close()

    if inspection is None:
        return {"error": "Inspection not found"}

    reports_dir = os.path.join(os.path.dirname(__file__), "reports")
    os.makedirs(reports_dir, exist_ok=True)

    file_path = os.path.join(
        reports_dir,
        f"{session_id}.pdf"
    )
        # =========================
    # QR CODE
    # =========================
    qr_data = (
        f"http://127.0.0.1:8000/inspections/{session_id}/report"
    )

    qr = qrcode.QRCode(
        version=1,
        box_size=8,
        border=2
    )

    qr.add_data(qr_data)
    qr.make(fit=True)

    qr_image = qr.make_image()

    qr_path = os.path.join(
        reports_dir,
        f"{session_id}_qr.png"
    )

    qr_image.save(qr_path)

    pdf = canvas.Canvas(file_path, pagesize=A4)
    width, height = A4

    # =========================
    # PAGE SETUP
    # =========================
    left = 50
    right = width - 50
    y = height - 50

    # =========================
    # HEADER
    # =========================
    pdf.setFont("Helvetica-Bold", 20)
    pdf.drawString(left, y, "OIML-MetricFlow")

    y -= 26

    pdf.setFont("Helvetica-Bold", 13)
    pdf.drawString(left, y, "Inspection Test Report")

    y -= 18

    pdf.setFont("Helvetica", 9)
    pdf.drawString(
        left,
        y,
        f"Session ID: {inspection[0]}"
    )

    pdf.drawRightString(
        right,
        y,
        f"Date & Time: {inspection[14]}"
    )

    pdf.drawImage(
        qr_path,
        right - 85,
        y - 85,
        width=70,
        height=70,
        preserveAspectRatio=True,
        mask="auto"
    )

    y -= 95

    pdf.line(left, y, right, y)

    y -= 28

    # =========================
    # INSTRUMENT INFORMATION
    # =========================
    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(left, y, "Instrument Information")

    y -= 22

    info = [
        ("Inspector Name", inspection[1]),
        ("Instrument Name", inspection[2]),
        ("Manufacturer", inspection[3]),
        ("Model", inspection[4]),
        ("Serial Number", inspection[5]),
        ("Accuracy Class", inspection[6]),
        ("Capacity (Max)", inspection[7]),
        ("Scale Interval (e)", inspection[8]),
    ]

    row_height = 24
    col1 = left
    col2 = 290

    for label, value in info:
        pdf.setFont("Helvetica-Bold", 9)
        pdf.drawString(col1, y, str(label))

        pdf.setFont("Helvetica", 9)
        pdf.drawString(
            col2,
            y,
            str(value) if value is not None else "-"
        )

        y -= row_height

    y -= 8

    pdf.line(left, y, right, y)

    y -= 28

    # =========================
    # TEST RESULTS
    # =========================
    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(left, y, "Test Results")

    y -= 22

    table_left = left
    table_right = right
    table_top = y
    row_h = 28

    # Header
    pdf.setFont("Helvetica-Bold", 9)
    pdf.drawString(table_left + 8, y, "Test")
    pdf.drawString(table_left + 350, y, "Status")

    y -= 8
    pdf.line(table_left, y, table_right, y)
    y -= 18

    results = [
        ("Weighing Test", inspection[9]),
        ("Eccentricity Test", inspection[10]),
        ("Repeatability Test", inspection[11]),
        ("Tare / Zero Test", inspection[12]),
    ]

    pdf.setFont("Helvetica", 9)

    for label, status in results:
        pdf.drawString(table_left + 8, y, label)
        pdf.drawString(
            table_left + 350,
            y,
            str(status) if status is not None else "-"
        )

        y -= row_h

        pdf.line(
            table_left,
            y + 8,
            table_right,
            y + 8
        )

    y -= 18

    # =========================
    # FINAL STATUS
    # =========================
    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(left, y, "Final Verification Result")

    y -= 25

    final_status = str(inspection[13])

    pdf.setFont("Helvetica-Bold", 14)
    pdf.drawString(
        left + 10,
        y,
        f"FINAL STATUS: {final_status}"
    )

    y -= 45

    # =========================
    # FOOTER
    # =========================
    pdf.line(left, 45, right, 45)

    pdf.setFont("Helvetica", 8)
    pdf.drawString(
        left,
        30,
        "Generated by OIML-MetricFlow"
    )

    pdf.drawRightString(
        right,
        30,
        f"Session: {inspection[0]}"
    )

    # Save PDF
    pdf.save()

    return FileResponse(
        file_path,
        media_type="application/pdf",
        filename=f"{session_id}.pdf"
    )