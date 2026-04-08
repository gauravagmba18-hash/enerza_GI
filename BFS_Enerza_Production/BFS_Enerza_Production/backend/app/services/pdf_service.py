"""
BFS Enerza — PDF Bill Generator
Generates professional utility bills as PDFs using ReportLab.
"""
from io import BytesIO
from datetime import date
from typing import Optional
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import (
    HexColor, black, white, Color
)
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph,
    Spacer, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT

# Brand colours
NAVY  = HexColor("#1E3A5F")
BLUE  = HexColor("#0070F2")
LIGHT = HexColor("#EAF2FF")
GRAY  = HexColor("#6B7685")
GREEN = HexColor("#107E3E")
RED   = HexColor("#BB0000")
BG    = HexColor("#F5F6F7")

W, H = A4

def styles():
    s = getSampleStyleSheet()
    s.add(ParagraphStyle("brand",   fontName="Helvetica-Bold",   fontSize=22, textColor=NAVY))
    s.add(ParagraphStyle("h2",      fontName="Helvetica-Bold",   fontSize=12, textColor=NAVY))
    s.add(ParagraphStyle("h3",      fontName="Helvetica-Bold",   fontSize=10, textColor=NAVY))
    s.add(ParagraphStyle("body",    fontName="Helvetica",        fontSize=9,  textColor=black, leading=13))
    s.add(ParagraphStyle("small",   fontName="Helvetica",        fontSize=8,  textColor=GRAY))
    s.add(ParagraphStyle("right",   fontName="Helvetica",        fontSize=9,  textColor=black, alignment=TA_RIGHT))
    s.add(ParagraphStyle("bold_r",  fontName="Helvetica-Bold",   fontSize=9,  textColor=NAVY,  alignment=TA_RIGHT))
    s.add(ParagraphStyle("mono",    fontName="Courier",          fontSize=8.5,textColor=black))
    s.add(ParagraphStyle("status_ok",  fontName="Helvetica-Bold",fontSize=9, textColor=GREEN))
    s.add(ParagraphStyle("status_due", fontName="Helvetica-Bold",fontSize=9, textColor=RED))
    return s

ST = styles()


def generate_bill_pdf(bill_data: dict, customer_data: dict) -> bytes:
    """
    Generate a PDF bill.
    bill_data: dict from billing engine (bill_id, lines, totals, dates, etc.)
    customer_data: dict with name, address, mobile, account_id
    Returns bytes of the PDF.
    """
    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=18*mm, rightMargin=18*mm,
        topMargin=15*mm, bottomMargin=18*mm,
    )

    utility_colors = {
        "GAS_PNG":     HexColor("#1D9E75"),
        "ELECTRICITY": HexColor("#BA7517"),
        "WATER":       HexColor("#185FA5"),
        "GAS_CNG":     HexColor("#993C1D"),
    }
    utility_labels = {
        "GAS_PNG": "Piped Natural Gas", "ELECTRICITY": "Electricity",
        "WATER": "Water Supply",         "GAS_CNG": "CNG",
    }
    utility    = bill_data.get("utility", "GAS_PNG")
    util_color = utility_colors.get(utility, BLUE)
    util_label = utility_labels.get(utility, utility)
    status     = bill_data.get("status", "GENERATED")
    is_paid    = status == "PAID"

    story = []

    # ── HEADER BAR ────────────────────────────────────────────────────────────
    header_data = [[
        Paragraph("<b>BFS Enerza</b>", ST["brand"]),
        Paragraph(
            f"<font color='#{util_color.hexval()[2:]}'>■</font> "
            f"<b>{util_label} Bill</b>",
            ST["h2"]
        ),
        Paragraph(
            f"<b>{'PAID' if is_paid else 'UNPAID'}</b>",
            ST["status_ok"] if is_paid else ST["status_due"]
        ),
    ]]
    ht = Table(header_data, colWidths=[60*mm, 90*mm, 24*mm])
    ht.setStyle(TableStyle([
        ("BACKGROUND",  (0,0),(-1,-1), LIGHT),
        ("ROWBACKGROUNDS",(0,0),(-1,-1),[LIGHT]),
        ("TOPPADDING",  (0,0),(-1,-1), 8),
        ("BOTTOMPADDING",(0,0),(-1,-1), 8),
        ("LEFTPADDING", (0,0),(0,-1),  10),
        ("RIGHTPADDING",(-1,0),(-1,-1),10),
        ("ROUNDEDCORNERS",(0,0),(-1,-1),4),
    ]))
    story.append(ht)
    story.append(Spacer(1, 5*mm))

    # ── BILL META + CUSTOMER  ────────────────────────────────────────────────
    period      = bill_data.get("billing_period", "")
    bill_date   = bill_data.get("bill_date", "")
    due_date    = bill_data.get("due_date", "")
    bill_id     = bill_data.get("bill_id", "")
    account_id  = customer_data.get("account_id", "")

    meta_data = [
        [
            Paragraph("<b>Bill Information</b>", ST["h3"]),
            Paragraph("<b>Consumer Details</b>", ST["h3"]),
        ],
        [
            Table([
                [Paragraph("Bill Number",     ST["small"]), Paragraph(bill_id,     ST["mono"])],
                [Paragraph("Account ID",      ST["small"]), Paragraph(account_id,  ST["mono"])],
                [Paragraph("Billing Period",  ST["small"]), Paragraph(period,      ST["body"])],
                [Paragraph("Bill Date",       ST["small"]), Paragraph(bill_date,   ST["body"])],
                [Paragraph("Due Date",        ST["small"]), Paragraph(
                    f"<font color='#BB0000'><b>{due_date}</b></font>" if not is_paid else due_date,
                    ST["body"])],
            ], colWidths=[30*mm, 55*mm]),
            Table([
                [Paragraph("Name",     ST["small"]), Paragraph(customer_data.get("name","—"),    ST["body"])],
                [Paragraph("Address",  ST["small"]), Paragraph(customer_data.get("address","—"), ST["body"])],
                [Paragraph("Mobile",   ST["small"]), Paragraph(customer_data.get("mobile","—"),  ST["body"])],
                [Paragraph("Email",    ST["small"]), Paragraph(customer_data.get("email","—"),   ST["body"])],
            ], colWidths=[20*mm, 65*mm]),
        ]
    ]
    meta_t = Table(meta_data, colWidths=[87*mm, 87*mm])
    meta_t.setStyle(TableStyle([
        ("BACKGROUND", (0,0),(-1,0), NAVY),
        ("TEXTCOLOR",  (0,0),(-1,0), white),
        ("TOPPADDING", (0,0),(-1,-1), 4),
        ("BOTTOMPADDING",(0,0),(-1,-1), 4),
        ("LEFTPADDING",  (0,0),(-1,-1), 5),
        ("BOX",          (0,0),(-1,-1), 0.5, GRAY),
        ("INNERGRID",    (0,0),(-1,-1), 0.3, GRAY),
    ]))
    story.append(meta_t)
    story.append(Spacer(1, 5*mm))

    # ── METER READING ──────────────────────────────────────────────────────────
    uom  = bill_data.get("uom", "SCM")
    cons = bill_data.get("consumption", 0)
    prev = bill_data.get("previous_reading", "—")
    curr = bill_data.get("current_reading", "—")

    reading_data = [
        ["Previous Reading", "Current Reading", "Consumption", "Unit"],
        [str(prev), str(curr), f"{cons:.3f}", uom],
    ]
    rt = Table(reading_data, colWidths=[43*mm]*4)
    rt.setStyle(TableStyle([
        ("BACKGROUND",    (0,0),(-1,0), util_color),
        ("TEXTCOLOR",     (0,0),(-1,0), white),
        ("FONTNAME",      (0,0),(-1,0), "Helvetica-Bold"),
        ("FONTSIZE",      (0,0),(-1,-1), 9),
        ("ALIGN",         (0,0),(-1,-1), "CENTER"),
        ("TOPPADDING",    (0,0),(-1,-1), 5),
        ("BOTTOMPADDING", (0,0),(-1,-1), 5),
        ("BOX",           (0,0),(-1,-1), 0.5, GRAY),
        ("FONTNAME",      (0,1),(-1,1), "Courier"),
    ]))
    story.append(Paragraph("Meter Reading Details", ST["h3"]))
    story.append(Spacer(1, 2*mm))
    story.append(rt)
    story.append(Spacer(1, 4*mm))

    # ── BILL LINES ────────────────────────────────────────────────────────────
    lines = bill_data.get("lines", [])
    line_rows = [["Description", "Quantity", "Rate", "Amount (₹)"]]
    for ln in lines:
        qty_str = f"{ln['qty']:.3f} {uom}" if ln.get("qty") is not None else "—"
        rate_str = f"{ln['rate']:.2f}%" if ln.get("line_type") == "TAX" else f"₹{ln['rate']:.4f}"
        line_rows.append([
            ln.get("name","—"), qty_str, rate_str,
            f"₹{ln.get('amount',0):,.2f}",
        ])

    # Totals
    line_rows.append(["", "", "Net Amount", f"₹{bill_data.get('net_amount',0):,.2f}"])
    line_rows.append(["", "", "Tax Amount", f"₹{bill_data.get('tax_amount',0):,.2f}"])
    if bill_data.get("arrears_amount", 0) > 0:
        line_rows.append(["", "", "Previous Arrears",
                           f"₹{bill_data['arrears_amount']:,.2f}"])
    if bill_data.get("late_fee", 0) > 0:
        line_rows.append(["", "", "Late Payment Fee",
                           f"₹{bill_data['late_fee']:,.2f}"])
    if bill_data.get("subsidy_amount", 0) > 0:
        line_rows.append(["", "", "Subsidy",
                           f"-₹{bill_data['subsidy_amount']:,.2f}"])
    line_rows.append(["", "", "TOTAL DUE", f"₹{bill_data.get('total_amount',0):,.2f}"])

    col_ws = [90*mm, 28*mm, 30*mm, 26*mm]
    lt = Table(line_rows, colWidths=col_ws, repeatRows=1)
    n_body = len(lines)
    lt.setStyle(TableStyle([
        # Header
        ("BACKGROUND",    (0,0),(-1,0), NAVY),
        ("TEXTCOLOR",     (0,0),(-1,0), white),
        ("FONTNAME",      (0,0),(-1,0), "Helvetica-Bold"),
        ("FONTSIZE",      (0,0),(-1,-1), 9),
        ("TOPPADDING",    (0,0),(-1,-1), 4),
        ("BOTTOMPADDING", (0,0),(-1,-1), 4),
        ("LEFTPADDING",   (0,0),(0,-1),  5),
        # Body rows alternating
        ("ROWBACKGROUNDS",(0,1),(- 1,n_body), [white, BG]),
        # Align amounts right
        ("ALIGN",         (3,0),(-1,-1), "RIGHT"),
        ("ALIGN",         (2,n_body+1),(-1,-1), "RIGHT"),
        # Separator before totals
        ("LINEABOVE",     (0,n_body+1),(-1,n_body+1), 1, NAVY),
        # Total row bold
        ("FONTNAME",      (2,-1),(-1,-1), "Helvetica-Bold"),
        ("FONTSIZE",      (2,-1),(-1,-1), 11),
        ("TEXTCOLOR",     (2,-1),(-1,-1), NAVY),
        ("BACKGROUND",    (0,-1),(-1,-1), LIGHT),
        ("BOX",           (0,0),(-1,-1), 0.5, GRAY),
        ("LINEBELOW",     (0,0),(-1,0),  0.5, GRAY),
    ]))
    story.append(Paragraph("Bill Breakdown", ST["h3"]))
    story.append(Spacer(1, 2*mm))
    story.append(lt)
    story.append(Spacer(1, 5*mm))

    # ── PAYMENT INSTRUCTIONS ──────────────────────────────────────────────────
    if not is_paid:
        pay_data = [[
            Paragraph(
                f"<b>Pay ₹{bill_data.get('total_amount',0):,.2f} by {due_date}</b><br/>"
                "<font size='8'>Pay via BFS Enerza App · UPI · BBPS · Bank Transfer<br/>"
                "BBPS Biller ID: BFSENZ001 · UPI VPA: enerza@upi</font>",
                ST["body"]
            ),
            Paragraph(
                "<font size='8'><b>BFS Enerza Pvt Ltd</b><br/>"
                "HDFC Bank A/C: 12345678901234<br/>"
                "IFSC: HDFC0001234<br/>"
                "NACH Ref: BFSEN00001</font>",
                ST["small"]
            )
        ]]
        pay_t = Table(pay_data, colWidths=[100*mm, 74*mm])
        pay_t.setStyle(TableStyle([
            ("BACKGROUND",   (0,0),(-1,-1), LIGHT),
            ("TOPPADDING",   (0,0),(-1,-1), 7),
            ("BOTTOMPADDING",(0,0),(-1,-1), 7),
            ("LEFTPADDING",  (0,0),(-1,-1), 8),
            ("BOX",          (0,0),(-1,-1), 0.5, util_color),
        ]))
        story.append(pay_t)

    # ── FOOTER ────────────────────────────────────────────────────────────────
    story.append(Spacer(1, 4*mm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=GRAY))
    story.append(Spacer(1, 2*mm))
    story.append(Paragraph(
        "BFS Enerza Pvt Ltd · CIN: U40100GJ2020PTC114567 · "
        "PNGRB Reg: CGD/GJ/2020/001 · "
        "Helpline: 1800-123-4567 · "
        "www.bfsenerza.in · care@bfsenerza.in",
        ST["small"]
    ))
    story.append(Paragraph(
        "This is a computer-generated bill. No signature required. "
        "For disputes, contact helpline within 30 days of bill date.",
        ST["small"]
    ))

    doc.build(story)
    return buf.getvalue()
