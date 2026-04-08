"""
BFS Enerza — SQLAlchemy ORM Models
All 48 tables across 8 domains
"""
from sqlalchemy import (
    Column, String, Integer, Numeric, Boolean, Date, DateTime, Text,
    ForeignKey, Index, UniqueConstraint, CheckConstraint, Enum
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum

# ─── Enums ───────────────────────────────────────────────────────────────────

class StatusEnum(str, enum.Enum):
    ACTIVE = "ACTIVE"; INACTIVE = "INACTIVE"; DRAFT = "DRAFT"

class KYCStatus(str, enum.Enum):
    PENDING = "PENDING"; VERIFIED = "VERIFIED"; REJECTED = "REJECTED"

class UtilityType(str, enum.Enum):
    GAS_PNG = "GAS_PNG"; GAS_CNG = "GAS_CNG"
    ELECTRICITY = "ELECTRICITY"; WATER = "WATER"; ALL = "ALL"

class BillStatus(str, enum.Enum):
    GENERATED = "GENERATED"; SENT = "SENT"; PAID = "PAID"
    PARTIALLY_PAID = "PARTIALLY_PAID"; OVERDUE = "OVERDUE"
    CANCELLED = "CANCELLED"; REVERSED = "REVERSED"

class PaymentStatus(str, enum.Enum):
    INITIATED = "INITIATED"; PENDING = "PENDING"; SUCCESS = "SUCCESS"
    FAILED = "FAILED"; REVERSED = "REVERSED"; REFUNDED = "REFUNDED"

class UserRole(str, enum.Enum):
    SUPER_ADMIN = "SUPER_ADMIN"; ADMIN = "ADMIN"; OPERATIONS = "OPERATIONS"
    BILLING = "BILLING"; FINANCE = "FINANCE"; IT = "IT"; READ_ONLY = "READ_ONLY"

# ─── Auth / Users ─────────────────────────────────────────────────────────────

class SystemUser(Base):
    __tablename__ = "system_users"
    user_id      = Column(String(20), primary_key=True)
    username     = Column(String(50), unique=True, nullable=False)
    email        = Column(String(100), unique=True, nullable=False)
    full_name    = Column(String(100), nullable=False)
    hashed_password = Column(String(200), nullable=False)
    role         = Column(Enum(UserRole), nullable=False, default=UserRole.READ_ONLY)
    department   = Column(String(50))
    is_active    = Column(Boolean, default=True, nullable=False)
    last_login   = Column(DateTime(timezone=True))
    created_on   = Column(DateTime(timezone=True), server_default=func.now())
    changed_on   = Column(DateTime(timezone=True), onupdate=func.now())

class AuditLog(Base):
    __tablename__ = "audit_log"
    log_id       = Column(Integer, primary_key=True, autoincrement=True)
    user_id      = Column(String(20), ForeignKey("system_users.user_id"))
    table_name   = Column(String(50), nullable=False)
    record_id    = Column(String(30), nullable=False)
    action       = Column(String(20), nullable=False)  # CREATE/UPDATE/DELETE/APPROVE
    old_values   = Column(Text)    # JSON
    new_values   = Column(Text)    # JSON
    ip_address   = Column(String(50))
    created_on   = Column(DateTime(timezone=True), server_default=func.now())
    __table_args__ = (Index("ix_audit_table_record", "table_name", "record_id"),)

# ─── Geography & Network ──────────────────────────────────────────────────────

class CGDArea(Base):
    __tablename__ = "cgd_areas"
    area_id      = Column(String(20), primary_key=True)
    area_name    = Column(String(100), nullable=False)
    city         = Column(String(100), nullable=False)
    district     = Column(String(100), nullable=False)
    state        = Column(String(100), nullable=False)
    zone         = Column(String(50))
    utility_type = Column(String(30), nullable=False)
    status       = Column(String(20), nullable=False, default="ACTIVE")
    created_by   = Column(String(20), ForeignKey("system_users.user_id"))
    created_on   = Column(DateTime(timezone=True), server_default=func.now())
    routes       = relationship("Route", back_populates="area")
    cng_stations = relationship("CNGStation", back_populates="area")

class Route(Base):
    __tablename__ = "routes"
    route_id     = Column(String(20), primary_key=True)
    area_id      = Column(String(20), ForeignKey("cgd_areas.area_id"), nullable=False)
    route_name   = Column(String(100), nullable=False)
    cycle_group  = Column(String(20), nullable=False)
    reader_id    = Column(String(50))
    status       = Column(String(20), nullable=False, default="ACTIVE")
    effective_from = Column(Date, nullable=False)
    area         = relationship("CGDArea", back_populates="routes")

class GridZone(Base):
    __tablename__ = "grid_zones"
    zone_id      = Column(String(20), primary_key=True)
    zone_name    = Column(String(100), nullable=False)
    area_id      = Column(String(20), ForeignKey("cgd_areas.area_id"))
    voltage_level = Column(String(20), nullable=False)
    distribution_company = Column(String(100))
    status       = Column(String(20), nullable=False, default="ACTIVE")

class WaterSupplyZone(Base):
    __tablename__ = "water_supply_zones"
    supply_zone_id = Column(String(20), primary_key=True)
    zone_name    = Column(String(100), nullable=False)
    area_id      = Column(String(20), ForeignKey("cgd_areas.area_id"))
    treatment_plant_id = Column(String(50))
    supply_hours_per_day = Column(Integer)
    status       = Column(String(20), nullable=False, default="ACTIVE")

# ─── Customer & Service Connection ───────────────────────────────────────────

class ConsumerSegment(Base):
    __tablename__ = "consumer_segments"
    segment_id   = Column(String(20), primary_key=True)
    segment_name = Column(String(100), nullable=False)
    utility_type = Column(String(20), nullable=False)
    description  = Column(String(500))
    eligibility_rules = Column(Text)  # JSON
    status       = Column(String(20), nullable=False, default="ACTIVE")

class Customer(Base):
    __tablename__ = "customers"
    customer_id  = Column(String(20), primary_key=True)
    full_name    = Column(String(100), nullable=False)
    short_name   = Column(String(50))
    customer_type = Column(String(20), nullable=False)
    kyc_status   = Column(Enum(KYCStatus), nullable=False, default=KYCStatus.PENDING)
    pan_ref      = Column(String(20))
    aadhaar_ref  = Column(String(20))   # masked: XXXX XXXX 1234
    passport_ref = Column(String(20))
    mobile       = Column(String(15), nullable=False)
    email        = Column(String(100))
    status       = Column(String(20), nullable=False, default="DRAFT")
    effective_from = Column(Date, nullable=False)
    effective_to = Column(Date)
    created_by   = Column(String(20), ForeignKey("system_users.user_id"))
    created_on   = Column(DateTime(timezone=True), server_default=func.now())
    changed_by   = Column(String(20), ForeignKey("system_users.user_id"))
    changed_on   = Column(DateTime(timezone=True), onupdate=func.now())
    accounts     = relationship("Account", back_populates="customer")
    app_user     = relationship("AppUser", back_populates="customer", uselist=False)
    __table_args__ = (Index("ix_customer_mobile", "mobile"),)

class Premise(Base):
    __tablename__ = "premises"
    premise_id   = Column(String(20), primary_key=True)
    customer_id  = Column(String(20), ForeignKey("customers.customer_id"))
    address_line1 = Column(String(200), nullable=False)
    address_line2 = Column(String(200))
    city         = Column(String(100), nullable=False)
    state        = Column(String(100), nullable=False)
    pincode      = Column(String(10), nullable=False)
    area_id      = Column(String(20), ForeignKey("cgd_areas.area_id"))
    geo_lat      = Column(Numeric(10, 7))
    geo_lon      = Column(Numeric(10, 7))
    building_type = Column(String(30))
    occupancy_type = Column(String(30))
    status       = Column(String(20), nullable=False, default="ACTIVE")
    created_by   = Column(String(20), ForeignKey("system_users.user_id"))
    created_on   = Column(DateTime(timezone=True), server_default=func.now())

class PressureBand(Base):
    __tablename__ = "pressure_bands"
    band_id      = Column(String(20), primary_key=True)
    band_name    = Column(String(100), nullable=False)
    min_pressure = Column(Numeric(10, 4), nullable=False)
    max_pressure = Column(Numeric(10, 4), nullable=False)
    usage_class  = Column(String(50), nullable=False)
    uom          = Column(String(20), nullable=False)
    status       = Column(String(20), nullable=False, default="ACTIVE")

class Account(Base):
    __tablename__ = "accounts"
    account_id   = Column(String(20), primary_key=True)
    customer_id  = Column(String(20), ForeignKey("customers.customer_id"), nullable=False)
    premise_id   = Column(String(20), ForeignKey("premises.premise_id"), nullable=False)
    cycle_id     = Column(String(20), ForeignKey("bill_cycles.cycle_id"))
    bill_delivery_mode = Column(String(20), nullable=False, default="EMAIL")
    billing_address = Column(String(500))
    status       = Column(String(20), nullable=False, default="ACTIVE")
    effective_from = Column(Date, nullable=False)
    effective_to = Column(Date)
    created_by   = Column(String(20), ForeignKey("system_users.user_id"))
    created_on   = Column(DateTime(timezone=True), server_default=func.now())
    changed_by   = Column(String(20), ForeignKey("system_users.user_id"))
    changed_on   = Column(DateTime(timezone=True), onupdate=func.now())
    customer     = relationship("Customer", back_populates="accounts")
    connections  = relationship("ServiceConnection", back_populates="account")
    bills        = relationship("Bill", back_populates="account")

class ServiceConnection(Base):
    __tablename__ = "service_connections"
    connection_id = Column(String(20), primary_key=True)
    account_id   = Column(String(20), ForeignKey("accounts.account_id"), nullable=False)
    utility_type = Column(String(20), nullable=False)
    segment_id   = Column(String(20), ForeignKey("consumer_segments.segment_id"))
    start_date   = Column(Date, nullable=False)
    end_date     = Column(Date)
    status       = Column(String(20), nullable=False, default="ACTIVE")
    disconnect_date = Column(Date)
    reconnect_date = Column(Date)
    disconnect_reason = Column(String(100))
    created_by   = Column(String(20), ForeignKey("system_users.user_id"))
    created_on   = Column(DateTime(timezone=True), server_default=func.now())
    account      = relationship("Account", back_populates="connections")
    gas_detail   = relationship("GasConnDetail", back_populates="connection", uselist=False)
    elec_detail  = relationship("ElecConnDetail", back_populates="connection", uselist=False)
    water_detail = relationship("WaterConnDetail", back_populates="connection", uselist=False)
    meter_installations = relationship("MeterInstallation", back_populates="connection")
    bills        = relationship("Bill", back_populates="connection")

class GasConnDetail(Base):
    __tablename__ = "gas_conn_details"
    connection_id = Column(String(20), ForeignKey("service_connections.connection_id"), primary_key=True)
    service_type = Column(String(10), nullable=False)
    pressure_band_id = Column(String(20), ForeignKey("pressure_bands.band_id"))
    regulator_serial = Column(String(50))
    regulator_type = Column(String(50))
    inlet_size_mm = Column(Numeric(5, 2))
    connection   = relationship("ServiceConnection", back_populates="gas_detail")

class ElecConnDetail(Base):
    __tablename__ = "elec_conn_details"
    connection_id = Column(String(20), ForeignKey("service_connections.connection_id"), primary_key=True)
    load_kw      = Column(Numeric(10, 3), nullable=False)
    supply_voltage = Column(String(20), nullable=False)
    phase_type   = Column(String(10), nullable=False)
    tariff_category = Column(String(50))
    distribution_company = Column(String(100))
    connection   = relationship("ServiceConnection", back_populates="elec_detail")

class WaterConnDetail(Base):
    __tablename__ = "water_conn_details"
    connection_id = Column(String(20), ForeignKey("service_connections.connection_id"), primary_key=True)
    pipe_size_mm = Column(Numeric(5, 2), nullable=False)
    supply_zone_id = Column(String(20), ForeignKey("water_supply_zones.supply_zone_id"))
    meter_type   = Column(String(30))
    connection_purpose = Column(String(30))
    connection   = relationship("ServiceConnection", back_populates="water_detail")

# ─── Metering ─────────────────────────────────────────────────────────────────

class Meter(Base):
    __tablename__ = "meters"
    meter_id     = Column(String(20), primary_key=True)
    serial_no    = Column(String(50), unique=True, nullable=False)
    meter_type   = Column(String(30), nullable=False)
    make         = Column(String(100))
    model        = Column(String(100))
    size         = Column(String(20))
    uom          = Column(String(20), nullable=False)
    utility_type = Column(String(20), nullable=False)
    calibration_due = Column(Date)
    status       = Column(String(20), nullable=False, default="IN_STOCK")
    created_on   = Column(DateTime(timezone=True), server_default=func.now())

class MeterInstallation(Base):
    __tablename__ = "meter_installations"
    install_id   = Column(String(20), primary_key=True)
    meter_id     = Column(String(20), ForeignKey("meters.meter_id"), nullable=False)
    connection_id = Column(String(20), ForeignKey("service_connections.connection_id"), nullable=False)
    install_date = Column(Date, nullable=False)
    remove_date  = Column(Date)
    seal_no      = Column(String(50))
    reason       = Column(String(100))
    installed_by = Column(String(50))
    connection   = relationship("ServiceConnection", back_populates="meter_installations")

class MeterReading(Base):
    __tablename__ = "meter_readings"
    reading_id   = Column(String(20), primary_key=True)
    meter_id     = Column(String(20), ForeignKey("meters.meter_id"), nullable=False)
    connection_id = Column(String(20), ForeignKey("service_connections.connection_id"), nullable=False)
    route_id     = Column(String(20), ForeignKey("routes.route_id"))
    reading_date = Column(Date, nullable=False)
    reading_value = Column(Numeric(15, 4), nullable=False)
    prev_reading_value = Column(Numeric(15, 4))
    consumption  = Column(Numeric(15, 4), nullable=False)
    reading_type = Column(String(20), nullable=False, default="ACTUAL")
    anomaly_flag = Column(Boolean, default=False)
    status       = Column(String(20), nullable=False, default="PENDING")
    created_on   = Column(DateTime(timezone=True), server_default=func.now())
    __table_args__ = (Index("ix_reading_conn_date", "connection_id", "reading_date"),)

# ─── CNG Operations ───────────────────────────────────────────────────────────

class CNGStation(Base):
    __tablename__ = "cng_stations"
    station_id   = Column(String(20), primary_key=True)
    station_name = Column(String(100), nullable=False)
    area_id      = Column(String(20), ForeignKey("cgd_areas.area_id"))
    address      = Column(String(300))
    city         = Column(String(100), nullable=False)
    state        = Column(String(100), nullable=False)
    compressor_type = Column(String(50))
    dispenser_count = Column(Integer)
    operational_since = Column(Date)
    status       = Column(String(20), nullable=False, default="ACTIVE")
    area         = relationship("CGDArea", back_populates="cng_stations")

class VehicleCategory(Base):
    __tablename__ = "vehicle_categories"
    category_id  = Column(String(20), primary_key=True)
    category_name = Column(String(100), nullable=False)
    vehicle_type = Column(String(50), nullable=False)
    fuel_capacity_kg = Column(Numeric(8, 3))
    commercial_flag = Column(Boolean, nullable=False, default=False)
    status       = Column(String(20), nullable=False, default="ACTIVE")

class CNGSale(Base):
    __tablename__ = "cng_sales"
    sale_id      = Column(String(20), primary_key=True)
    station_id   = Column(String(20), ForeignKey("cng_stations.station_id"), nullable=False)
    category_id  = Column(String(20), ForeignKey("vehicle_categories.category_id"))
    sale_date    = Column(Date, nullable=False)
    quantity_scm = Column(Numeric(12, 4), nullable=False)
    unit_price   = Column(Numeric(10, 4), nullable=False)
    amount       = Column(Numeric(15, 2), nullable=False)
    payment_mode = Column(String(30))
    __table_args__ = (Index("ix_cng_sale_station_date", "station_id", "sale_date"),)

# ─── Tariff & Billing ─────────────────────────────────────────────────────────

class RatePlan(Base):
    __tablename__ = "rate_plans"
    rate_plan_id = Column(String(20), primary_key=True)
    plan_name    = Column(String(100), nullable=False)
    utility_type = Column(String(20), nullable=False)
    segment_id   = Column(String(20), ForeignKey("consumer_segments.segment_id"))
    effective_from = Column(Date, nullable=False)
    effective_to = Column(Date)
    billing_freq = Column(String(20), nullable=False, default="MONTHLY")
    status       = Column(String(20), nullable=False, default="DRAFT")
    created_by   = Column(String(20), ForeignKey("system_users.user_id"))
    created_on   = Column(DateTime(timezone=True), server_default=func.now())
    components   = relationship("ChargeComponent", back_populates="rate_plan")

class ChargeComponent(Base):
    __tablename__ = "charge_components"
    component_id = Column(String(20), primary_key=True)
    rate_plan_id = Column(String(20), ForeignKey("rate_plans.rate_plan_id"), nullable=False)
    component_name = Column(String(100), nullable=False)
    component_type = Column(String(30), nullable=False)  # FIXED/VARIABLE/TAX/SUBSIDY/ADJUSTMENT
    uom          = Column(String(20))
    rate         = Column(Numeric(15, 6), nullable=False)
    posting_class = Column(String(50))
    slab_from    = Column(Numeric(12, 4))
    slab_to      = Column(Numeric(12, 4))
    tax_id       = Column(String(20), ForeignKey("tax_master.tax_id"))
    status       = Column(String(20), nullable=False, default="ACTIVE")
    rate_plan    = relationship("RatePlan", back_populates="components")

class TaxMaster(Base):
    __tablename__ = "tax_master"
    tax_id       = Column(String(20), primary_key=True)
    tax_name     = Column(String(100), nullable=False)
    jurisdiction = Column(String(50), nullable=False)
    tax_rate     = Column(Numeric(8, 4), nullable=False)
    applicability = Column(String(100))
    effective_from = Column(Date, nullable=False)
    effective_to = Column(Date)
    status       = Column(String(20), nullable=False, default="ACTIVE")

class BillCycle(Base):
    __tablename__ = "bill_cycles"
    cycle_id     = Column(String(20), primary_key=True)
    cycle_name   = Column(String(100), nullable=False)
    read_date_rule = Column(String(100), nullable=False)
    bill_date_rule = Column(String(100), nullable=False)
    due_date_rule = Column(String(100), nullable=False)
    grace_days   = Column(Integer, nullable=False, default=20)
    status       = Column(String(20), nullable=False, default="ACTIVE")

class Bill(Base):
    __tablename__ = "bills"
    bill_id      = Column(String(20), primary_key=True)
    account_id   = Column(String(20), ForeignKey("accounts.account_id"), nullable=False)
    connection_id = Column(String(20), ForeignKey("service_connections.connection_id"), nullable=False)
    cycle_id     = Column(String(20), ForeignKey("bill_cycles.cycle_id"))
    rate_plan_id = Column(String(20), ForeignKey("rate_plans.rate_plan_id"))
    billing_period = Column(String(20), nullable=False)   # e.g. "2026-03"
    bill_date    = Column(Date, nullable=False)
    due_date     = Column(Date, nullable=False)
    consumption  = Column(Numeric(15, 4))
    uom          = Column(String(10))
    net_amount   = Column(Numeric(15, 2), nullable=False)
    tax_amount   = Column(Numeric(15, 2), nullable=False)
    subsidy_amount = Column(Numeric(15, 2), default=0)
    arrears_amount = Column(Numeric(15, 2), default=0)  # carried from previous
    late_fee     = Column(Numeric(15, 2), default=0)
    total_amount = Column(Numeric(15, 2), nullable=False)
    paid_amount  = Column(Numeric(15, 2), default=0)
    balance_amount = Column(Numeric(15, 2))
    status       = Column(Enum(BillStatus), nullable=False, default=BillStatus.GENERATED)
    reversed_by  = Column(String(20))  # bill_id of reversal bill
    generated_by = Column(String(20), ForeignKey("system_users.user_id"))
    generated_on = Column(DateTime(timezone=True), server_default=func.now())
    account      = relationship("Account", back_populates="bills")
    connection   = relationship("ServiceConnection", back_populates="bills")
    lines        = relationship("BillLine", back_populates="bill")
    payments     = relationship("PaymentOrder", back_populates="bill")
    __table_args__ = (
        Index("ix_bill_account_period", "account_id", "billing_period"),
        Index("ix_bill_status", "status"),
    )

class BillLine(Base):
    __tablename__ = "bill_lines"
    line_id      = Column(String(20), primary_key=True)
    bill_id      = Column(String(20), ForeignKey("bills.bill_id"), nullable=False)
    component_id = Column(String(20))
    description  = Column(String(200), nullable=False)
    quantity     = Column(Numeric(15, 4))
    rate         = Column(Numeric(15, 6), nullable=False)
    amount       = Column(Numeric(15, 2), nullable=False)
    line_type    = Column(String(30), nullable=False)
    bill         = relationship("Bill", back_populates="lines")

# ─── Payments & Reconciliation ────────────────────────────────────────────────

class PaymentChannel(Base):
    __tablename__ = "payment_channels"
    channel_id   = Column(String(20), primary_key=True)
    channel_name = Column(String(100), nullable=False)
    channel_type = Column(String(30), nullable=False)
    provider     = Column(String(100))
    convenience_fee_flag = Column(Boolean, default=False)
    status       = Column(String(20), nullable=False, default="ACTIVE")

class PaymentGateway(Base):
    __tablename__ = "payment_gateways"
    gateway_id   = Column(String(20), primary_key=True)
    provider     = Column(String(100), nullable=False)
    merchant_id  = Column(String(100), nullable=False)
    callback_url = Column(String(500))
    environment  = Column(String(20), nullable=False, default="SANDBOX")
    settlement_cycle = Column(String(20))
    status       = Column(String(20), nullable=False, default="ACTIVE")

class PaymentOrder(Base):
    __tablename__ = "payment_orders"
    order_id     = Column(String(30), primary_key=True)
    bill_id      = Column(String(20), ForeignKey("bills.bill_id"), nullable=False)
    account_id   = Column(String(20), ForeignKey("accounts.account_id"), nullable=False)
    channel_id   = Column(String(20), ForeignKey("payment_channels.channel_id"))
    gateway_id   = Column(String(20), ForeignKey("payment_gateways.gateway_id"))
    amount       = Column(Numeric(15, 2), nullable=False)
    convenience_fee = Column(Numeric(10, 2), default=0)
    total_charged = Column(Numeric(15, 2), nullable=False)
    status       = Column(Enum(PaymentStatus), nullable=False, default=PaymentStatus.INITIATED)
    initiated_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True))
    gateway_ref  = Column(String(100))
    bill         = relationship("Bill", back_populates="payments")

class GatewayTxn(Base):
    __tablename__ = "gateway_txns"
    txn_id       = Column(String(30), primary_key=True)
    order_id     = Column(String(30), ForeignKey("payment_orders.order_id"), nullable=False)
    settlement_id = Column(String(30), ForeignKey("settlements.settlement_id"))
    gateway_ref  = Column(String(100))
    gateway_status = Column(String(30), nullable=False)
    response_code = Column(String(20))
    response_at  = Column(DateTime(timezone=True))
    settled_at   = Column(DateTime(timezone=True))

class Settlement(Base):
    __tablename__ = "settlements"
    settlement_id = Column(String(30), primary_key=True)
    gateway_id   = Column(String(20), ForeignKey("payment_gateways.gateway_id"))
    settlement_date = Column(Date, nullable=False)
    gross_amount = Column(Numeric(15, 2), nullable=False)
    fee_deducted = Column(Numeric(10, 2))
    net_amount   = Column(Numeric(15, 2), nullable=False)
    matched_count = Column(Integer, nullable=False, default=0)
    exception_count = Column(Integer, nullable=False, default=0)
    status       = Column(String(20), nullable=False, default="PENDING")

class Refund(Base):
    __tablename__ = "refunds"
    refund_id    = Column(String(30), primary_key=True)
    order_id     = Column(String(30), ForeignKey("payment_orders.order_id"), nullable=False)
    reason_code  = Column(String(50), nullable=False)
    amount       = Column(Numeric(15, 2), nullable=False)
    status       = Column(String(20), nullable=False, default="INITIATED")
    initiated_by = Column(String(50))
    initiated_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True))

class SuspenseRecord(Base):
    __tablename__ = "suspense_records"
    suspense_id  = Column(String(30), primary_key=True)
    txn_id       = Column(String(30), ForeignKey("gateway_txns.txn_id"))
    reason       = Column(String(100), nullable=False)
    amount       = Column(Numeric(15, 2), nullable=False)
    resolution_status = Column(String(30), nullable=False, default="OPEN")
    resolved_by  = Column(String(50))
    resolved_at  = Column(DateTime(timezone=True))
    created_at   = Column(DateTime(timezone=True), server_default=func.now())

# ─── Mobile App ───────────────────────────────────────────────────────────────

class AppUser(Base):
    __tablename__ = "app_users"
    app_user_id  = Column(String(20), primary_key=True)
    customer_id  = Column(String(20), ForeignKey("customers.customer_id"))
    mobile       = Column(String(15), unique=True, nullable=False)
    email        = Column(String(100))
    otp_verified = Column(Boolean, nullable=False, default=False)
    mpin_hash    = Column(String(200))
    mpin_set     = Column(Boolean, nullable=False, default=False)
    status       = Column(String(20), nullable=False, default="ACTIVE")
    registered_at = Column(DateTime(timezone=True), server_default=func.now())
    last_login_at = Column(DateTime(timezone=True))
    customer     = relationship("Customer", back_populates="app_user")
    devices      = relationship("AppDevice", back_populates="app_user")
    account_links = relationship("AppAccountLink", back_populates="app_user")
    sessions     = relationship("AppSession", back_populates="app_user")
    notifications = relationship("AppNotification", back_populates="app_user")
    service_requests = relationship("AppServiceRequest", back_populates="app_user")

class AppDevice(Base):
    __tablename__ = "app_devices"
    device_id    = Column(String(30), primary_key=True)
    app_user_id  = Column(String(20), ForeignKey("app_users.app_user_id"), nullable=False)
    os_type      = Column(String(10), nullable=False)
    os_version   = Column(String(30))
    app_version  = Column(String(30), nullable=False)
    push_token   = Column(String(500))
    device_fingerprint = Column(String(200))
    active       = Column(Boolean, nullable=False, default=True)
    registered_at = Column(DateTime(timezone=True), server_default=func.now())
    app_user     = relationship("AppUser", back_populates="devices")

class AppAccountLink(Base):
    __tablename__ = "app_account_links"
    link_id      = Column(String(30), primary_key=True)
    app_user_id  = Column(String(20), ForeignKey("app_users.app_user_id"), nullable=False)
    account_id   = Column(String(20), ForeignKey("accounts.account_id"), nullable=False)
    ownership_type = Column(String(20), nullable=False, default="OWNER")
    linked_at    = Column(DateTime(timezone=True), server_default=func.now())
    status       = Column(String(20), nullable=False, default="ACTIVE")
    app_user     = relationship("AppUser", back_populates="account_links")

class AppSession(Base):
    __tablename__ = "app_sessions"
    session_id   = Column(String(30), primary_key=True)
    app_user_id  = Column(String(20), ForeignKey("app_users.app_user_id"), nullable=False)
    device_id    = Column(String(30), ForeignKey("app_devices.device_id"))
    started_at   = Column(DateTime(timezone=True), server_default=func.now())
    ended_at     = Column(DateTime(timezone=True))
    session_status = Column(String(20), nullable=False, default="ACTIVE")
    ip_address   = Column(String(50))
    app_user     = relationship("AppUser", back_populates="sessions")

class NotifTemplate(Base):
    __tablename__ = "notif_templates"
    template_id  = Column(String(20), primary_key=True)
    channel      = Column(String(20), nullable=False)
    event_type   = Column(String(50), nullable=False)
    language     = Column(String(10), nullable=False, default="en")
    subject      = Column(String(200))
    body_template = Column(Text, nullable=False)
    active       = Column(Boolean, nullable=False, default=True)
    created_on   = Column(DateTime(timezone=True), server_default=func.now())

class AppNotification(Base):
    __tablename__ = "app_notifications"
    notif_id     = Column(String(30), primary_key=True)
    app_user_id  = Column(String(20), ForeignKey("app_users.app_user_id"), nullable=False)
    template_id  = Column(String(20), ForeignKey("notif_templates.template_id"))
    bill_id      = Column(String(20), ForeignKey("bills.bill_id"))
    message      = Column(Text, nullable=False)
    channel      = Column(String(20), nullable=False)
    sent_at      = Column(DateTime(timezone=True), server_default=func.now())
    read_flag    = Column(Boolean, nullable=False, default=False)
    read_at      = Column(DateTime(timezone=True))
    app_user     = relationship("AppUser", back_populates="notifications")

class ServiceRequestType(Base):
    __tablename__ = "service_request_types"
    type_id      = Column(String(20), primary_key=True)
    category     = Column(String(100), nullable=False)
    subcategory  = Column(String(100), nullable=False)
    sla_hours    = Column(Integer, nullable=False)
    priority     = Column(String(20), nullable=False)
    department   = Column(String(100))
    escalation_matrix = Column(Text)  # JSON
    status       = Column(String(20), nullable=False, default="ACTIVE")

class AppServiceRequest(Base):
    __tablename__ = "app_service_requests"
    request_id   = Column(String(30), primary_key=True)
    app_user_id  = Column(String(20), ForeignKey("app_users.app_user_id"), nullable=False)
    account_id   = Column(String(20), ForeignKey("accounts.account_id"))
    type_id      = Column(String(20), ForeignKey("service_request_types.type_id"))
    description  = Column(Text)
    attachments_ref = Column(String(500))  # JSON array of S3 keys
    status       = Column(String(20), nullable=False, default="OPEN")
    assigned_to  = Column(String(50))
    created_at   = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at  = Column(DateTime(timezone=True))
    app_user     = relationship("AppUser", back_populates="service_requests")

# ─── API & Partners ───────────────────────────────────────────────────────────

class APIPartner(Base):
    __tablename__ = "api_partners"
    partner_id   = Column(String(20), primary_key=True)
    partner_name = Column(String(100), nullable=False)
    partner_type = Column(String(30), nullable=False)
    legal_name   = Column(String(200))
    contact_email = Column(String(100), nullable=False)
    contact_mobile = Column(String(15))
    settlement_mode = Column(String(30))
    onboarded_on = Column(Date, nullable=False)
    status       = Column(String(20), nullable=False, default="ACTIVE")
    credentials  = relationship("APICredential", back_populates="partner")
    transactions = relationship("APITransaction", back_populates="partner")

class APICredential(Base):
    __tablename__ = "api_credentials"
    credential_id = Column(String(30), primary_key=True)
    partner_id   = Column(String(20), ForeignKey("api_partners.partner_id"), nullable=False)
    client_id    = Column(String(100), unique=True, nullable=False)
    secret_ref   = Column(String(200), nullable=False)  # vault path, never plain text
    token_expiry = Column(DateTime(timezone=True))
    ip_whitelist = Column(Text)  # JSON array
    cert_ref     = Column(String(200))
    last_rotated = Column(DateTime(timezone=True))
    partner      = relationship("APIPartner", back_populates="credentials")

class APIEndpointCatalog(Base):
    __tablename__ = "api_endpoint_catalog"
    endpoint_id  = Column(String(20), primary_key=True)
    endpoint_code = Column(String(50), unique=True, nullable=False)
    endpoint_path = Column(String(300), nullable=False)
    operation_type = Column(String(50), nullable=False)
    request_method = Column(String(10), nullable=False)
    auth_type    = Column(String(30), nullable=False)
    sync_flag    = Column(Boolean, nullable=False, default=True)
    version      = Column(String(10), nullable=False)
    status       = Column(String(20), nullable=False, default="ACTIVE")

class APIEndpointMapping(Base):
    __tablename__ = "api_endpoint_mappings"
    mapping_id   = Column(String(30), primary_key=True)
    partner_id   = Column(String(20), ForeignKey("api_partners.partner_id"), nullable=False)
    endpoint_id  = Column(String(20), ForeignKey("api_endpoint_catalog.endpoint_id"), nullable=False)
    enabled      = Column(Boolean, nullable=False, default=True)
    effective_from = Column(Date, nullable=False)

class APITransaction(Base):
    __tablename__ = "api_transactions"
    api_txn_id   = Column(String(30), primary_key=True)
    partner_id   = Column(String(20), ForeignKey("api_partners.partner_id"), nullable=False)
    endpoint_id  = Column(String(20), ForeignKey("api_endpoint_catalog.endpoint_id"))
    correlation_id = Column(String(100))
    request_time = Column(DateTime(timezone=True), server_default=func.now())
    response_ms  = Column(Integer)
    status_code  = Column(String(10), nullable=False)
    error_code   = Column(String(30))
    payload_ref  = Column(String(200))
    bill_id      = Column(String(20), ForeignKey("bills.bill_id"))
    partner      = relationship("APIPartner", back_populates="transactions")
    __table_args__ = (Index("ix_api_txn_partner_time", "partner_id", "request_time"),)

class WebhookSubscription(Base):
    __tablename__ = "webhook_subscriptions"
    webhook_id   = Column(String(30), primary_key=True)
    partner_id   = Column(String(20), ForeignKey("api_partners.partner_id"), nullable=False)
    event_type   = Column(String(50), nullable=False)
    target_url   = Column(String(500), nullable=False)
    signature_method = Column(String(30), nullable=False)
    secret_ref   = Column(String(200))
    retry_count  = Column(Integer, nullable=False, default=3)
    active       = Column(Boolean, nullable=False, default=True)

class APIRateLimit(Base):
    __tablename__ = "api_rate_limits"
    limit_id     = Column(String(30), primary_key=True)
    partner_id   = Column(String(20), ForeignKey("api_partners.partner_id"), nullable=False)
    requests_per_min = Column(Integer, nullable=False)
    burst_limit  = Column(Integer, nullable=False)
    timeout_ms   = Column(Integer, nullable=False)
    retry_policy = Column(String(50))
    status       = Column(String(20), nullable=False, default="ACTIVE")

class APIErrorCode(Base):
    __tablename__ = "api_error_codes"
    error_code   = Column(String(30), primary_key=True)
    http_status  = Column(Integer, nullable=False)
    message      = Column(String(300), nullable=False)
    retryable    = Column(Boolean, nullable=False, default=False)
    category     = Column(String(50), nullable=False)
    resolution_hint = Column(String(500))
