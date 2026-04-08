-- =================================================
-- BFS Enerza — Database Schema DDL
-- Multi-utility platform: Gas · Electricity · Water · CNG
-- Generated for PostgreSQL / MySQL / SQL Server
-- =================================================

CREATE SCHEMA IF NOT EXISTS enerza;

SET search_path TO enerza;


-- ==================================================
-- Domain: Customer & Service
-- ==================================================

CREATE TABLE CUSTOMER (
CREATE TABLE CUSTOMER (
    customer_id                         VARCHAR(20)          NOT NULL,  -- Unique customer identifier (CUST000001)
    full_name                           VARCHAR(100)         NOT NULL,  -- Legal full name
    short_name                          VARCHAR(50)         ,  -- Preferred short / trading name
    customer_type                       VARCHAR(20)          NOT NULL,  -- INDIVIDUAL / CORPORATE / GOVT
    kyc_status                          VARCHAR(20)          NOT NULL,  -- PENDING / VERIFIED / REJECTED
    pan_ref                             VARCHAR(20)         ,  -- PAN card reference
    aadhaar_ref                         VARCHAR(20)         ,  -- Aadhaar masked reference
    passport_ref                        VARCHAR(20)         ,  -- Passport reference
    mobile                              VARCHAR(15)          NOT NULL,  -- Primary mobile number
    email                               VARCHAR(100)        ,  -- Email address
    status                              VARCHAR(20)          NOT NULL,  -- ACTIVE / DRAFT / BLOCKED / INACTIVE
    effective_from                      DATE                 NOT NULL,  -- Customer record effective start
    effective_to                        DATE                ,  -- Customer record effective end (null=open)
    created_by                          VARCHAR(50)          NOT NULL,  -- User who created record
    created_on                          TIMESTAMP            NOT NULL,  -- Creation timestamp
    changed_by                          VARCHAR(50)         ,  -- User who last modified
    changed_on                          TIMESTAMP           ,  -- Last modification timestamp

    CONSTRAINT pk_customer PRIMARY KEY (customer_id)
);

CREATE TABLE PREMISE (
CREATE TABLE PREMISE (
    premise_id                          VARCHAR(20)          NOT NULL,  -- Unique premise identifier
    address_line1                       VARCHAR(200)         NOT NULL,  -- Primary address line
    address_line2                       VARCHAR(200)        ,  -- Secondary address line
    city                                VARCHAR(100)         NOT NULL,  -- City
    state                               VARCHAR(100)         NOT NULL,  -- State
    pincode                             VARCHAR(10)          NOT NULL,  -- PIN / ZIP code
    area_id                             VARCHAR(20)         ,  -- Reference to CGD area
    geo_lat                             DECIMAL(10,7)       ,  -- GPS latitude
    geo_lon                             DECIMAL(10,7)       ,  -- GPS longitude
    building_type                       VARCHAR(30)         ,  -- RESIDENTIAL / COMMERCIAL / INDUSTRIAL
    occupancy_type                      VARCHAR(30)         ,  -- OWNED / RENTED / LEASED
    status                              VARCHAR(20)          NOT NULL,  -- ACTIVE / INACTIVE
    created_by                          VARCHAR(50)          NOT NULL,  -- Creator user ID
    created_on                          TIMESTAMP            NOT NULL,  -- Creation timestamp

    CONSTRAINT pk_premise PRIMARY KEY (premise_id),
    CONSTRAINT fk_premise_area_id FOREIGN KEY (area_id) REFERENCES CGDAREA (area_id)
);

CREATE TABLE ACCOUNT (
CREATE TABLE ACCOUNT (
    account_id                          VARCHAR(20)          NOT NULL,  -- Unique billing account identifier
    customer_id                         VARCHAR(20)         ,  -- Owning customer
    premise_id                          VARCHAR(20)         ,  -- Service premise
    cycle_id                            VARCHAR(20)         ,  -- Billing cycle assignment
    bill_delivery_mode                  VARCHAR(20)          NOT NULL,  -- EMAIL / SMS / PRINT / APP
    billing_address                     VARCHAR(500)        ,  -- Override billing address
    status                              VARCHAR(20)          NOT NULL,  -- ACTIVE / INACTIVE / BLOCKED
    effective_from                      DATE                 NOT NULL,  -- Account effective start
    effective_to                        DATE                ,  -- Account effective end
    created_by                          VARCHAR(50)          NOT NULL,  -- Creator user ID
    created_on                          TIMESTAMP            NOT NULL,  -- Creation timestamp
    changed_by                          VARCHAR(50)         ,  -- Last modifier
    changed_on                          TIMESTAMP           ,  -- Last modification timestamp

    CONSTRAINT pk_account PRIMARY KEY (account_id),
    CONSTRAINT fk_account_customer_id FOREIGN KEY (customer_id) REFERENCES CUSTOMER (customer_id),
    CONSTRAINT fk_account_premise_id FOREIGN KEY (premise_id) REFERENCES PREMISE (premise_id),
    CONSTRAINT fk_account_cycle_id FOREIGN KEY (cycle_id) REFERENCES BILL_CYCLE (cycle_id)
);

CREATE TABLE CONSUMER_SEGMENT (
CREATE TABLE CONSUMER_SEGMENT (
    segment_id                          VARCHAR(20)          NOT NULL,  -- Unique segment identifier
    segment_name                        VARCHAR(100)         NOT NULL,  -- Segment display name
    utility_type                        VARCHAR(20)          NOT NULL,  -- GAS / ELECTRICITY / WATER / ALL
    description                         VARCHAR(500)        ,  -- Segment description
    eligibility_rules                   TEXT                ,  -- JSON eligibility criteria
    status                              VARCHAR(20)          NOT NULL,  -- ACTIVE / INACTIVE

    CONSTRAINT pk_consumer_segment PRIMARY KEY (segment_id)
);

CREATE TABLE SERVICE_CONNECTION (
CREATE TABLE SERVICE_CONNECTION (
    connection_id                       VARCHAR(20)          NOT NULL,  -- Unique connection identifier
    account_id                          VARCHAR(20)         ,  -- Billing account
    utility_type                        VARCHAR(20)          NOT NULL,  -- GAS_PNG / GAS_CNG / ELECTRICITY / WATER
    segment_id                          VARCHAR(20)         ,  -- Consumer segment
    start_date                          DATE                 NOT NULL,  -- Connection activation date
    end_date                            DATE                ,  -- Connection termination date
    status                              VARCHAR(20)          NOT NULL,  -- ACTIVE / SUSPENDED / TERMINATED
    created_by                          VARCHAR(50)          NOT NULL,  -- Creator user ID
    created_on                          TIMESTAMP            NOT NULL,  -- Creation timestamp

    CONSTRAINT pk_service_connection PRIMARY KEY (connection_id),
    CONSTRAINT fk_service_connection_account_id FOREIGN KEY (account_id) REFERENCES ACCOUNT (account_id),
    CONSTRAINT fk_service_connection_segment_id FOREIGN KEY (segment_id) REFERENCES CONSUMER_SEGMENT (segment_id)
);

CREATE TABLE GAS_CONN_DETAIL (
CREATE TABLE GAS_CONN_DETAIL (
    connection_id                       VARCHAR(20)          NOT NULL,  -- One-to-one with gas connections
    service_type                        VARCHAR(10)          NOT NULL,  -- PNG / CNG
    pressure_band_id                    VARCHAR(20)         ,  -- Gas pressure classification
    regulator_serial                    VARCHAR(50)         ,  -- Gas regulator serial number
    regulator_type                      VARCHAR(50)         ,  -- Regulator type / model
    inlet_size_mm                       DECIMAL(5,2)        ,  -- Gas inlet pipe size in mm

    CONSTRAINT pk_gas_conn_detail PRIMARY KEY (connection_id),
    CONSTRAINT fk_gas_conn_detail_connection_id FOREIGN KEY (connection_id) REFERENCES SERVICE_CONNECTION (connection_id),
    CONSTRAINT fk_gas_conn_detail_pressure_band_id FOREIGN KEY (pressure_band_id) REFERENCES PRESSURE_BAND (pressure_band_id)
);

CREATE TABLE ELEC_CONN_DETAIL (
CREATE TABLE ELEC_CONN_DETAIL (
    connection_id                       VARCHAR(20)          NOT NULL,  -- One-to-one with electricity connections
    load_kw                             DECIMAL(10,3)        NOT NULL,  -- Sanctioned load in kW
    supply_voltage                      VARCHAR(20)          NOT NULL,  -- LT / HT / EHT
    phase_type                          VARCHAR(10)          NOT NULL,  -- SINGLE / THREE
    tariff_category                     VARCHAR(50)         ,  -- DISCOM tariff category code
    distribution_company                VARCHAR(100)        ,  -- DISCOM name

    CONSTRAINT pk_elec_conn_detail PRIMARY KEY (connection_id),
    CONSTRAINT fk_elec_conn_detail_connection_id FOREIGN KEY (connection_id) REFERENCES SERVICE_CONNECTION (connection_id)
);

CREATE TABLE WATER_CONN_DETAIL (
CREATE TABLE WATER_CONN_DETAIL (
    connection_id                       VARCHAR(20)          NOT NULL,  -- One-to-one with water connections
    pipe_size_mm                        DECIMAL(5,2)         NOT NULL,  -- Supply pipe diameter in mm
    supply_zone_id                      VARCHAR(20)         ,  -- Water supply zone
    meter_type                          VARCHAR(30)         ,  -- Mechanical / Digital / Smart
    connection_purpose                  VARCHAR(30)         ,  -- DOMESTIC / COMMERCIAL / INDUSTRIAL

    CONSTRAINT pk_water_conn_detail PRIMARY KEY (connection_id),
    CONSTRAINT fk_water_conn_detail_connection_id FOREIGN KEY (connection_id) REFERENCES SERVICE_CONNECTION (connection_id),
    CONSTRAINT fk_water_conn_detail_supply_zone_id FOREIGN KEY (supply_zone_id) REFERENCES WATER_SUPPLY_ZONE (supply_zone_id)
);

CREATE TABLE PRESSURE_BAND (
CREATE TABLE PRESSURE_BAND (
    band_id                             VARCHAR(20)          NOT NULL,  -- Unique pressure band identifier
    band_name                           VARCHAR(100)         NOT NULL,  -- Band display name
    min_pressure                        DECIMAL(10,4)        NOT NULL,  -- Minimum pressure value
    max_pressure                        DECIMAL(10,4)        NOT NULL,  -- Maximum pressure value
    usage_class                         VARCHAR(50)          NOT NULL,  -- Domestic / Commercial / Industrial
    uom                                 VARCHAR(20)          NOT NULL,  -- mbar / bar / psi
    status                              VARCHAR(20)          NOT NULL,  -- ACTIVE / INACTIVE

    CONSTRAINT pk_pressure_band PRIMARY KEY (band_id)
);


-- ==================================================
-- Domain: Geography & Network
-- ==================================================

CREATE TABLE CGDAREA (
CREATE TABLE CGDAREA (
    area_id                             VARCHAR(20)          NOT NULL,  -- Unique CGD area identifier
    area_name                           VARCHAR(100)         NOT NULL,  -- Area display name
    city                                VARCHAR(100)         NOT NULL,  -- City name
    district                            VARCHAR(100)         NOT NULL,  -- District name
    state                               VARCHAR(100)         NOT NULL,  -- State name
    zone                                VARCHAR(50)         ,  -- Operational zone grouping
    utility_type                        VARCHAR(30)          NOT NULL,  -- GAS / ELECTRICITY / WATER / ALL
    status                              VARCHAR(20)          NOT NULL,  -- ACTIVE / INACTIVE
    created_on                          TIMESTAMP            NOT NULL,  -- Creation timestamp

    CONSTRAINT pk_cgdarea PRIMARY KEY (area_id)
);

CREATE TABLE ROUTE (
CREATE TABLE ROUTE (
    route_id                            VARCHAR(20)          NOT NULL,  -- Unique meter reading route identifier
    area_id                             VARCHAR(20)         ,  -- Parent area
    route_name                          VARCHAR(100)         NOT NULL,  -- Route display name
    cycle_group                         VARCHAR(20)          NOT NULL,  -- Billing cycle group code
    reader_id                           VARCHAR(50)         ,  -- Assigned meter reader employee ID
    status                              VARCHAR(20)          NOT NULL,  -- ACTIVE / INACTIVE
    effective_from                      DATE                 NOT NULL,  -- Route effective start date

    CONSTRAINT pk_route PRIMARY KEY (route_id),
    CONSTRAINT fk_route_area_id FOREIGN KEY (area_id) REFERENCES CGDAREA (area_id)
);

CREATE TABLE GRID_ZONE (
CREATE TABLE GRID_ZONE (
    zone_id                             VARCHAR(20)          NOT NULL,  -- Unique electricity grid zone identifier
    zone_name                           VARCHAR(100)         NOT NULL,  -- Grid zone name
    area_id                             VARCHAR(20)         ,  -- Parent area
    voltage_level                       VARCHAR(20)          NOT NULL,  -- LT / HT / EHT
    distribution_company                VARCHAR(100)        ,  -- DISCOM name
    status                              VARCHAR(20)          NOT NULL,  -- ACTIVE / INACTIVE

    CONSTRAINT pk_grid_zone PRIMARY KEY (zone_id),
    CONSTRAINT fk_grid_zone_area_id FOREIGN KEY (area_id) REFERENCES CGDAREA (area_id)
);

CREATE TABLE WATER_SUPPLY_ZONE (
CREATE TABLE WATER_SUPPLY_ZONE (
    supply_zone_id                      VARCHAR(20)          NOT NULL,  -- Unique water supply zone identifier
    zone_name                           VARCHAR(100)         NOT NULL,  -- Zone display name
    area_id                             VARCHAR(20)         ,  -- Parent area
    treatment_plant_id                  VARCHAR(50)         ,  -- Water treatment plant reference
    supply_hours_per_day                INT                 ,  -- Average daily supply hours
    status                              VARCHAR(20)          NOT NULL,  -- ACTIVE / INACTIVE

    CONSTRAINT pk_water_supply_zone PRIMARY KEY (supply_zone_id),
    CONSTRAINT fk_water_supply_zone_area_id FOREIGN KEY (area_id) REFERENCES CGDAREA (area_id)
);


-- ==================================================
-- Domain: Metering
-- ==================================================

CREATE TABLE METER (
CREATE TABLE METER (
    meter_id                            VARCHAR(20)          NOT NULL,  -- Unique meter identifier
    serial_no                           VARCHAR(50)          NOT NULL UNIQUE,  -- Manufacturer serial number
    meter_type                          VARCHAR(30)          NOT NULL,  -- Mechanical / Electronic / Smart / Prepaid
    make                                VARCHAR(100)        ,  -- Manufacturer name
    model                               VARCHAR(100)        ,  -- Model number
    size                                VARCHAR(20)         ,  -- Meter size code
    uom                                 VARCHAR(20)          NOT NULL,  -- SCM / kWh / KL
    utility_type                        VARCHAR(20)          NOT NULL,  -- GAS / ELECTRICITY / WATER
    calibration_due                     DATE                ,  -- Next calibration due date
    status                              VARCHAR(20)          NOT NULL,  -- IN_STOCK / INSTALLED / REMOVED / DEFECTIVE
    created_on                          TIMESTAMP            NOT NULL,  -- Record creation timestamp

    CONSTRAINT pk_meter PRIMARY KEY (meter_id)
);

CREATE TABLE METER_INSTALLATION (
CREATE TABLE METER_INSTALLATION (
    install_id                          VARCHAR(20)          NOT NULL,  -- Unique installation record ID
    meter_id                            VARCHAR(20)         ,  -- Meter reference
    connection_id                       VARCHAR(20)         ,  -- Connection reference
    install_date                        DATE                 NOT NULL,  -- Installation date
    remove_date                         DATE                ,  -- Removal date (null if still installed)
    seal_no                             VARCHAR(50)         ,  -- Meter seal number at installation
    reason                              VARCHAR(100)        ,  -- NEW / REPLACEMENT / DEFECTIVE / RELOCATION
    installed_by                        VARCHAR(50)         ,  -- Technician employee ID

    CONSTRAINT pk_meter_installation PRIMARY KEY (install_id),
    CONSTRAINT fk_meter_installation_meter_id FOREIGN KEY (meter_id) REFERENCES METER (meter_id),
    CONSTRAINT fk_meter_installation_connection_id FOREIGN KEY (connection_id) REFERENCES SERVICE_CONNECTION (connection_id)
);

CREATE TABLE METER_READING (
CREATE TABLE METER_READING (
    reading_id                          VARCHAR(20)          NOT NULL,  -- Unique meter reading record ID
    meter_id                            VARCHAR(20)         ,  -- Meter reference
    connection_id                       VARCHAR(20)         ,  -- Connection reference
    route_id                            VARCHAR(20)         ,  -- Reading route reference
    reading_date                        DATE                 NOT NULL,  -- Date reading was taken
    reading_value                       DECIMAL(15,4)        NOT NULL,  -- Meter counter reading value
    prev_reading_value                  DECIMAL(15,4)       ,  -- Previous period reading value
    consumption                         DECIMAL(15,4)        NOT NULL,  -- Calculated consumption for period
    reading_type                        VARCHAR(20)          NOT NULL,  -- ACTUAL / ESTIMATED / SELF
    anomaly_flag                        BOOLEAN             ,  -- True if consumption anomaly detected
    status                              VARCHAR(20)          NOT NULL,  -- PENDING / BILLED / REVISED

    CONSTRAINT pk_meter_reading PRIMARY KEY (reading_id),
    CONSTRAINT fk_meter_reading_meter_id FOREIGN KEY (meter_id) REFERENCES METER (meter_id),
    CONSTRAINT fk_meter_reading_connection_id FOREIGN KEY (connection_id) REFERENCES SERVICE_CONNECTION (connection_id),
    CONSTRAINT fk_meter_reading_route_id FOREIGN KEY (route_id) REFERENCES ROUTE (route_id)
);


-- ==================================================
-- Domain: CNG Operations
-- ==================================================

CREATE TABLE CNG_STATION (
CREATE TABLE CNG_STATION (
    station_id                          VARCHAR(20)          NOT NULL,  -- Unique CNG station identifier
    station_name                        VARCHAR(100)         NOT NULL,  -- Station display name
    area_id                             VARCHAR(20)         ,  -- Parent area
    address                             VARCHAR(300)         NOT NULL,  -- Station address
    city                                VARCHAR(100)         NOT NULL,  -- City
    state                               VARCHAR(100)         NOT NULL,  -- State
    compressor_type                     VARCHAR(50)         ,  -- Standard / Fast-fill / Mother
    dispenser_count                     INT                 ,  -- Number of dispensing units
    operational_since                   DATE                ,  -- Station operational start date
    status                              VARCHAR(20)          NOT NULL,  -- ACTIVE / INACTIVE / MAINTENANCE

    CONSTRAINT pk_cng_station PRIMARY KEY (station_id),
    CONSTRAINT fk_cng_station_area_id FOREIGN KEY (area_id) REFERENCES CGDAREA (area_id)
);

CREATE TABLE VEHICLE_CATEGORY (
CREATE TABLE VEHICLE_CATEGORY (
    category_id                         VARCHAR(20)          NOT NULL,  -- Unique vehicle category identifier
    category_name                       VARCHAR(100)         NOT NULL,  -- Category display name
    vehicle_type                        VARCHAR(50)          NOT NULL,  -- CAR / BUS / AUTO / TRUCK / TWO_WHEELER
    fuel_capacity_kg                    DECIMAL(8,3)        ,  -- Typical CNG tank capacity in kg
    commercial_flag                     BOOLEAN              NOT NULL,  -- True if commercial vehicle
    status                              VARCHAR(20)          NOT NULL,  -- ACTIVE / INACTIVE

    CONSTRAINT pk_vehicle_category PRIMARY KEY (category_id)
);

CREATE TABLE CNG_SALE (
CREATE TABLE CNG_SALE (
    sale_id                             VARCHAR(20)          NOT NULL,  -- Unique CNG sale transaction ID
    station_id                          VARCHAR(20)         ,  -- Station reference
    category_id                         VARCHAR(20)         ,  -- Vehicle category
    sale_date                           DATE                 NOT NULL,  -- Sale date
    quantity_scm                        DECIMAL(12,4)        NOT NULL,  -- CNG quantity dispensed in SCM
    unit_price                          DECIMAL(10,4)        NOT NULL,  -- Price per SCM at time of sale
    amount                              DECIMAL(15,2)        NOT NULL,  -- Total sale amount in INR
    payment_mode                        VARCHAR(30)         ,  -- CASH / CARD / UPI / FASTAG

    CONSTRAINT pk_cng_sale PRIMARY KEY (sale_id),
    CONSTRAINT fk_cng_sale_station_id FOREIGN KEY (station_id) REFERENCES CNG_STATION (station_id),
    CONSTRAINT fk_cng_sale_category_id FOREIGN KEY (category_id) REFERENCES VEHICLE_CATEGORY (category_id)
);


-- ==================================================
-- Domain: Tariff & Billing
-- ==================================================

CREATE TABLE RATE_PLAN (
CREATE TABLE RATE_PLAN (
    rate_plan_id                        VARCHAR(20)          NOT NULL,  -- Unique rate plan identifier
    plan_name                           VARCHAR(100)         NOT NULL,  -- Rate plan display name
    utility_type                        VARCHAR(20)          NOT NULL,  -- GAS_PNG / GAS_CNG / ELECTRICITY / WATER
    segment_id                          VARCHAR(20)         ,  -- Applicable consumer segment
    effective_from                      DATE                 NOT NULL,  -- Rate plan effective start date
    effective_to                        DATE                ,  -- Rate plan effective end date
    billing_freq                        VARCHAR(20)          NOT NULL,  -- MONTHLY / BIMONTHLY / QUARTERLY
    status                              VARCHAR(20)          NOT NULL,  -- ACTIVE / INACTIVE / DRAFT
    created_by                          VARCHAR(50)          NOT NULL,  -- Creator user ID
    created_on                          TIMESTAMP            NOT NULL,  -- Creation timestamp

    CONSTRAINT pk_rate_plan PRIMARY KEY (rate_plan_id),
    CONSTRAINT fk_rate_plan_segment_id FOREIGN KEY (segment_id) REFERENCES CONSUMER_SEGMENT (segment_id)
);

CREATE TABLE CHARGE_COMPONENT (
CREATE TABLE CHARGE_COMPONENT (
    component_id                        VARCHAR(20)          NOT NULL,  -- Unique charge component identifier
    rate_plan_id                        VARCHAR(20)         ,  -- Parent rate plan
    component_name                      VARCHAR(100)         NOT NULL,  -- Component display name
    component_type                      VARCHAR(30)          NOT NULL,  -- FIXED / VARIABLE / TAX / ADJUSTMENT / SUBSIDY
    uom                                 VARCHAR(20)         ,  -- Unit of measure for variable charges
    rate                                DECIMAL(15,6)        NOT NULL,  -- Rate value
    posting_class                       VARCHAR(50)         ,  -- GL posting class for accounting
    slab_from                           DECIMAL(12,4)       ,  -- Slab lower bound for slab tariff
    slab_to                             DECIMAL(12,4)       ,  -- Slab upper bound (null = no upper limit)
    tax_id                              VARCHAR(20)         ,  -- Applicable tax rule
    status                              VARCHAR(20)          NOT NULL,  -- ACTIVE / INACTIVE

    CONSTRAINT pk_charge_component PRIMARY KEY (component_id),
    CONSTRAINT fk_charge_component_rate_plan_id FOREIGN KEY (rate_plan_id) REFERENCES RATE_PLAN (rate_plan_id),
    CONSTRAINT fk_charge_component_tax_id FOREIGN KEY (tax_id) REFERENCES TAX_MASTER (tax_id)
);

CREATE TABLE TAX_MASTER (
CREATE TABLE TAX_MASTER (
    tax_id                              VARCHAR(20)          NOT NULL,  -- Unique tax rule identifier
    tax_name                            VARCHAR(100)         NOT NULL,  -- Tax display name e.g. GST 18%
    jurisdiction                        VARCHAR(50)          NOT NULL,  -- CENTRAL / STATE / MUNICIPAL
    tax_rate                            DECIMAL(8,4)         NOT NULL,  -- Tax rate as percentage
    applicability                       VARCHAR(100)        ,  -- Applicable utility types / segments
    effective_from                      DATE                 NOT NULL,  -- Tax rule effective start date
    effective_to                        DATE                ,  -- Tax rule effective end date
    status                              VARCHAR(20)          NOT NULL,  -- ACTIVE / INACTIVE

    CONSTRAINT pk_tax_master PRIMARY KEY (tax_id)
);

CREATE TABLE BILL_CYCLE (
CREATE TABLE BILL_CYCLE (
    cycle_id                            VARCHAR(20)          NOT NULL,  -- Unique bill cycle identifier
    cycle_name                          VARCHAR(100)         NOT NULL,  -- Cycle display name
    read_date_rule                      VARCHAR(100)         NOT NULL,  -- Rule to derive meter reading date
    bill_date_rule                      VARCHAR(100)         NOT NULL,  -- Rule to derive bill generation date
    due_date_rule                       VARCHAR(100)         NOT NULL,  -- Rule to derive payment due date
    grace_days                          INT                  NOT NULL,  -- Grace days after due date before late fee
    status                              VARCHAR(20)          NOT NULL,  -- ACTIVE / INACTIVE

    CONSTRAINT pk_bill_cycle PRIMARY KEY (cycle_id)
);

CREATE TABLE BILL (
CREATE TABLE BILL (
    bill_id                             VARCHAR(20)          NOT NULL,  -- Unique bill identifier
    account_id                          VARCHAR(20)         ,  -- Billing account
    connection_id                       VARCHAR(20)         ,  -- Service connection
    cycle_id                            VARCHAR(20)         ,  -- Billing cycle
    bill_date                           DATE                 NOT NULL,  -- Bill generation date
    due_date                            DATE                 NOT NULL,  -- Payment due date
    net_amount                          DECIMAL(15,2)        NOT NULL,  -- Amount before tax
    tax_amount                          DECIMAL(15,2)        NOT NULL,  -- Total tax amount
    total_amount                        DECIMAL(15,2)        NOT NULL,  -- Total bill amount payable
    paid_amount                         DECIMAL(15,2)       ,  -- Amount paid so far
    balance_amount                      DECIMAL(15,2)       ,  -- Outstanding balance
    status                              VARCHAR(20)          NOT NULL,  -- GENERATED / SENT / PAID / PARTIALLY_PAID / OVERDUE / CANCELLED

    CONSTRAINT pk_bill PRIMARY KEY (bill_id),
    CONSTRAINT fk_bill_account_id FOREIGN KEY (account_id) REFERENCES ACCOUNT (account_id),
    CONSTRAINT fk_bill_connection_id FOREIGN KEY (connection_id) REFERENCES SERVICE_CONNECTION (connection_id),
    CONSTRAINT fk_bill_cycle_id FOREIGN KEY (cycle_id) REFERENCES BILL_CYCLE (cycle_id)
);

CREATE TABLE BILL_LINE (
CREATE TABLE BILL_LINE (
    line_id                             VARCHAR(20)          NOT NULL,  -- Unique bill line identifier
    bill_id                             VARCHAR(20)         ,  -- Parent bill
    component_id                        VARCHAR(20)         ,  -- Charge component
    description                         VARCHAR(200)         NOT NULL,  -- Line item description
    quantity                            DECIMAL(15,4)       ,  -- Consumption quantity (for variable charges)
    rate                                DECIMAL(15,6)        NOT NULL,  -- Rate applied
    amount                              DECIMAL(15,2)        NOT NULL,  -- Line amount
    line_type                           VARCHAR(30)          NOT NULL,  -- CHARGE / TAX / SUBSIDY / ADJUSTMENT

    CONSTRAINT pk_bill_line PRIMARY KEY (line_id),
    CONSTRAINT fk_bill_line_bill_id FOREIGN KEY (bill_id) REFERENCES BILL (bill_id),
    CONSTRAINT fk_bill_line_component_id FOREIGN KEY (component_id) REFERENCES CHARGE_COMPONENT (component_id)
);


-- ==================================================
-- Domain: Payments & Reconciliation
-- ==================================================

CREATE TABLE PAYMENT_CHANNEL (
CREATE TABLE PAYMENT_CHANNEL (
    channel_id                          VARCHAR(20)          NOT NULL,  -- Unique payment channel identifier
    channel_name                        VARCHAR(100)         NOT NULL,  -- Channel display name
    channel_type                        VARCHAR(30)          NOT NULL,  -- UPI / CARD / NET_BANKING / WALLET / BBPS / CASH / POS
    provider                            VARCHAR(100)        ,  -- Payment provider / aggregator name
    convenience_fee_flag                BOOLEAN             ,  -- True if convenience fee applicable
    status                              VARCHAR(20)          NOT NULL,  -- ACTIVE / INACTIVE

    CONSTRAINT pk_payment_channel PRIMARY KEY (channel_id)
);

CREATE TABLE PAYMENT_GATEWAY (
CREATE TABLE PAYMENT_GATEWAY (
    gateway_id                          VARCHAR(20)          NOT NULL,  -- Unique payment gateway identifier
    provider                            VARCHAR(100)         NOT NULL,  -- Gateway provider name
    merchant_id                         VARCHAR(100)         NOT NULL,  -- Merchant ID with provider
    callback_url                        VARCHAR(500)        ,  -- Webhook callback URL reference
    environment                         VARCHAR(20)          NOT NULL,  -- PRODUCTION / SANDBOX
    settlement_cycle                    VARCHAR(20)         ,  -- T+0 / T+1 / T+2
    status                              VARCHAR(20)          NOT NULL,  -- ACTIVE / INACTIVE

    CONSTRAINT pk_payment_gateway PRIMARY KEY (gateway_id)
);

CREATE TABLE PAYMENT_ORDER (
CREATE TABLE PAYMENT_ORDER (
    order_id                            VARCHAR(30)          NOT NULL,  -- Unique payment order identifier
    bill_id                             VARCHAR(20)         ,  -- Bill being paid
    account_id                          VARCHAR(20)         ,  -- Account reference
    channel_id                          VARCHAR(20)         ,  -- Payment channel
    gateway_id                          VARCHAR(20)         ,  -- Processing gateway
    amount                              DECIMAL(15,2)        NOT NULL,  -- Bill amount component
    convenience_fee                     DECIMAL(10,2)       ,  -- Convenience fee charged
    total_charged                       DECIMAL(15,2)        NOT NULL,  -- Total amount charged to customer
    status                              VARCHAR(20)          NOT NULL,  -- INITIATED / PENDING / SUCCESS / FAILED / REVERSED
    initiated_at                        TIMESTAMP            NOT NULL,  -- Order initiation timestamp
    completed_at                        TIMESTAMP           ,  -- Order completion timestamp

    CONSTRAINT pk_payment_order PRIMARY KEY (order_id),
    CONSTRAINT fk_payment_order_bill_id FOREIGN KEY (bill_id) REFERENCES BILL (bill_id),
    CONSTRAINT fk_payment_order_account_id FOREIGN KEY (account_id) REFERENCES ACCOUNT (account_id),
    CONSTRAINT fk_payment_order_channel_id FOREIGN KEY (channel_id) REFERENCES PAYMENT_CHANNEL (channel_id),
    CONSTRAINT fk_payment_order_gateway_id FOREIGN KEY (gateway_id) REFERENCES PAYMENT_GATEWAY (gateway_id)
);

CREATE TABLE GATEWAY_TXN (
CREATE TABLE GATEWAY_TXN (
    txn_id                              VARCHAR(30)          NOT NULL,  -- Unique gateway transaction identifier
    order_id                            VARCHAR(30)         ,  -- Parent payment order
    settlement_id                       VARCHAR(30)         ,  -- Settlement batch reference
    gateway_ref                         VARCHAR(100)        ,  -- Gateway transaction reference number
    gateway_status                      VARCHAR(30)          NOT NULL,  -- Gateway-returned status code
    response_code                       VARCHAR(20)         ,  -- Gateway response code
    response_at                         TIMESTAMP           ,  -- Gateway response timestamp
    settled_at                          TIMESTAMP           ,  -- Settlement timestamp

    CONSTRAINT pk_gateway_txn PRIMARY KEY (txn_id),
    CONSTRAINT fk_gateway_txn_order_id FOREIGN KEY (order_id) REFERENCES PAYMENT_ORDER (order_id),
    CONSTRAINT fk_gateway_txn_settlement_id FOREIGN KEY (settlement_id) REFERENCES SETTLEMENT (settlement_id)
);

CREATE TABLE SETTLEMENT (
CREATE TABLE SETTLEMENT (
    settlement_id                       VARCHAR(30)          NOT NULL,  -- Unique settlement batch identifier
    gateway_id                          VARCHAR(20)         ,  -- Gateway reference
    settlement_date                     DATE                 NOT NULL,  -- Settlement date
    gross_amount                        DECIMAL(15,2)        NOT NULL,  -- Gross settlement amount
    fee_deducted                        DECIMAL(10,2)       ,  -- Gateway fee deducted
    net_amount                          DECIMAL(15,2)        NOT NULL,  -- Net amount received
    matched_count                       INT                  NOT NULL,  -- Number of matched transactions
    exception_count                     INT                  NOT NULL,  -- Number of exception transactions
    status                              VARCHAR(20)          NOT NULL,  -- PENDING / RECONCILED / EXCEPTION

    CONSTRAINT pk_settlement PRIMARY KEY (settlement_id),
    CONSTRAINT fk_settlement_gateway_id FOREIGN KEY (gateway_id) REFERENCES PAYMENT_GATEWAY (gateway_id)
);

CREATE TABLE REFUND (
CREATE TABLE REFUND (
    refund_id                           VARCHAR(30)          NOT NULL,  -- Unique refund identifier
    order_id                            VARCHAR(30)         ,  -- Original payment order
    reason_code                         VARCHAR(50)          NOT NULL,  -- DUPLICATE / EXCESS / FAILED_SERVICE / REVERSAL
    amount                              DECIMAL(15,2)        NOT NULL,  -- Refund amount
    status                              VARCHAR(20)          NOT NULL,  -- INITIATED / PROCESSED / FAILED
    initiated_by                        VARCHAR(50)         ,  -- User who initiated refund
    initiated_at                        TIMESTAMP            NOT NULL,  -- Refund initiation timestamp
    completed_at                        TIMESTAMP           ,  -- Refund completion timestamp

    CONSTRAINT pk_refund PRIMARY KEY (refund_id),
    CONSTRAINT fk_refund_order_id FOREIGN KEY (order_id) REFERENCES PAYMENT_ORDER (order_id)
);

CREATE TABLE SUSPENSE_RECORD (
CREATE TABLE SUSPENSE_RECORD (
    suspense_id                         VARCHAR(30)          NOT NULL,  -- Unique suspense record identifier
    txn_id                              VARCHAR(30)         ,  -- Unmatched transaction reference
    reason                              VARCHAR(100)         NOT NULL,  -- UNKNOWN_ACCOUNT / DUPLICATE / AMOUNT_MISMATCH / INVALID_REF
    amount                              DECIMAL(15,2)        NOT NULL,  -- Suspense amount
    resolution_status                   VARCHAR(30)          NOT NULL,  -- OPEN / RESOLVED / WRITTEN_OFF
    resolved_by                         VARCHAR(50)         ,  -- User who resolved
    resolved_at                         TIMESTAMP           ,  -- Resolution timestamp

    CONSTRAINT pk_suspense_record PRIMARY KEY (suspense_id),
    CONSTRAINT fk_suspense_record_txn_id FOREIGN KEY (txn_id) REFERENCES GATEWAY_TXN (txn_id)
);


-- ==================================================
-- Domain: Mobile App
-- ==================================================

CREATE TABLE APP_USER (
CREATE TABLE APP_USER (
    app_user_id                         VARCHAR(20)          NOT NULL,  -- Unique app user identifier
    customer_id                         VARCHAR(20)         ,  -- Linked customer (nullable until verified)
    mobile                              VARCHAR(15)          NOT NULL UNIQUE,  -- Mobile number (login key)
    email                               VARCHAR(100)        ,  -- Email address
    otp_verified                        BOOLEAN              NOT NULL,  -- Mobile OTP verified flag
    mpin_set                            BOOLEAN              NOT NULL,  -- MPIN configured flag
    status                              VARCHAR(20)          NOT NULL,  -- ACTIVE / LOCKED / SUSPENDED
    registered_at                       TIMESTAMP            NOT NULL,  -- App registration timestamp
    last_login_at                       TIMESTAMP           ,  -- Last successful login timestamp

    CONSTRAINT pk_app_user PRIMARY KEY (app_user_id),
    CONSTRAINT fk_app_user_customer_id FOREIGN KEY (customer_id) REFERENCES CUSTOMER (customer_id)
);

CREATE TABLE APP_DEVICE (
CREATE TABLE APP_DEVICE (
    device_id                           VARCHAR(30)          NOT NULL,  -- Unique device identifier
    app_user_id                         VARCHAR(20)         ,  -- App user reference
    os_type                             VARCHAR(10)          NOT NULL,  -- ANDROID / IOS
    os_version                          VARCHAR(30)         ,  -- OS version string
    app_version                         VARCHAR(30)          NOT NULL,  -- App version installed
    push_token                          VARCHAR(500)        ,  -- FCM / APNs push notification token
    device_fingerprint                  VARCHAR(200)        ,  -- Device fingerprint hash
    active                              BOOLEAN              NOT NULL,  -- True if this is an active trusted device
    registered_at                       TIMESTAMP            NOT NULL,  -- Device registration timestamp

    CONSTRAINT pk_app_device PRIMARY KEY (device_id),
    CONSTRAINT fk_app_device_app_user_id FOREIGN KEY (app_user_id) REFERENCES APP_USER (app_user_id)
);

CREATE TABLE APP_ACCOUNT_LINK (
CREATE TABLE APP_ACCOUNT_LINK (
    link_id                             VARCHAR(30)          NOT NULL,  -- Unique account link identifier
    app_user_id                         VARCHAR(20)         ,  -- App user reference
    account_id                          VARCHAR(20)         ,  -- Linked billing account
    ownership_type                      VARCHAR(20)          NOT NULL,  -- OWNER / FAMILY / TENANT
    linked_at                           TIMESTAMP            NOT NULL,  -- Link creation timestamp
    status                              VARCHAR(20)          NOT NULL,  -- ACTIVE / REVOKED

    CONSTRAINT pk_app_account_link PRIMARY KEY (link_id),
    CONSTRAINT fk_app_account_link_app_user_id FOREIGN KEY (app_user_id) REFERENCES APP_USER (app_user_id),
    CONSTRAINT fk_app_account_link_account_id FOREIGN KEY (account_id) REFERENCES ACCOUNT (account_id)
);

CREATE TABLE APP_SESSION (
CREATE TABLE APP_SESSION (
    session_id                          VARCHAR(30)          NOT NULL,  -- Unique session identifier
    app_user_id                         VARCHAR(20)         ,  -- App user reference
    device_id                           VARCHAR(30)         ,  -- Device reference
    started_at                          TIMESTAMP            NOT NULL,  -- Session start timestamp
    ended_at                            TIMESTAMP           ,  -- Session end timestamp
    session_status                      VARCHAR(20)          NOT NULL,  -- ACTIVE / EXPIRED / LOGGED_OUT
    ip_address                          VARCHAR(50)         ,  -- Client IP address

    CONSTRAINT pk_app_session PRIMARY KEY (session_id),
    CONSTRAINT fk_app_session_app_user_id FOREIGN KEY (app_user_id) REFERENCES APP_USER (app_user_id),
    CONSTRAINT fk_app_session_device_id FOREIGN KEY (device_id) REFERENCES APP_DEVICE (device_id)
);

CREATE TABLE APP_NOTIFICATION (
CREATE TABLE APP_NOTIFICATION (
    notif_id                            VARCHAR(30)          NOT NULL,  -- Unique notification identifier
    app_user_id                         VARCHAR(20)         ,  -- Recipient app user
    template_id                         VARCHAR(20)         ,  -- Notification template used
    bill_id                             VARCHAR(20)         ,  -- Related bill (if applicable)
    message                             TEXT                 NOT NULL,  -- Rendered notification message
    channel                             VARCHAR(20)          NOT NULL,  -- PUSH / SMS / EMAIL
    sent_at                             TIMESTAMP            NOT NULL,  -- Send timestamp
    read_flag                           BOOLEAN              NOT NULL,  -- True if notification read
    read_at                             TIMESTAMP           ,  -- Read timestamp

    CONSTRAINT pk_app_notification PRIMARY KEY (notif_id),
    CONSTRAINT fk_app_notification_app_user_id FOREIGN KEY (app_user_id) REFERENCES APP_USER (app_user_id),
    CONSTRAINT fk_app_notification_template_id FOREIGN KEY (template_id) REFERENCES NOTIF_TEMPLATE (template_id),
    CONSTRAINT fk_app_notification_bill_id FOREIGN KEY (bill_id) REFERENCES BILL (bill_id)
);

CREATE TABLE NOTIF_TEMPLATE (
CREATE TABLE NOTIF_TEMPLATE (
    template_id                         VARCHAR(20)          NOT NULL,  -- Unique template identifier
    channel                             VARCHAR(20)          NOT NULL,  -- PUSH / SMS / EMAIL
    event_type                          VARCHAR(50)          NOT NULL,  -- BILL_GENERATED / DUE_REMINDER / PAYMENT_RECEIVED / OUTAGE
    language                            VARCHAR(10)          NOT NULL,  -- en / hi / gu / mr etc.
    subject                             VARCHAR(200)        ,  -- Email subject line (for email channel)
    body_template                       TEXT                 NOT NULL,  -- Template with {{variable}} placeholders
    active                              BOOLEAN              NOT NULL,  -- Template active flag
    created_on                          TIMESTAMP            NOT NULL,  -- Creation timestamp

    CONSTRAINT pk_notif_template PRIMARY KEY (template_id)
);

CREATE TABLE APP_SERVICE_REQUEST (
CREATE TABLE APP_SERVICE_REQUEST (
    request_id                          VARCHAR(30)          NOT NULL,  -- Unique service request identifier
    app_user_id                         VARCHAR(20)         ,  -- Requesting app user
    account_id                          VARCHAR(20)         ,  -- Related account
    type_id                             VARCHAR(20)         ,  -- Request type
    description                         TEXT                ,  -- Customer-provided description
    attachments_ref                     VARCHAR(500)        ,  -- JSON array of file references
    status                              VARCHAR(20)          NOT NULL,  -- OPEN / IN_PROGRESS / RESOLVED / CLOSED
    assigned_to                         VARCHAR(50)         ,  -- Assigned agent / queue ID
    created_at                          TIMESTAMP            NOT NULL,  -- Request creation timestamp
    resolved_at                         TIMESTAMP           ,  -- Resolution timestamp

    CONSTRAINT pk_app_service_request PRIMARY KEY (request_id),
    CONSTRAINT fk_app_service_request_app_user_id FOREIGN KEY (app_user_id) REFERENCES APP_USER (app_user_id),
    CONSTRAINT fk_app_service_request_account_id FOREIGN KEY (account_id) REFERENCES ACCOUNT (account_id),
    CONSTRAINT fk_app_service_request_type_id FOREIGN KEY (type_id) REFERENCES SERVICE_REQUEST_TYPE (type_id)
);

CREATE TABLE SERVICE_REQUEST_TYPE (
CREATE TABLE SERVICE_REQUEST_TYPE (
    type_id                             VARCHAR(20)          NOT NULL,  -- Unique request type identifier
    category                            VARCHAR(100)         NOT NULL,  -- Main category e.g. Billing / Connection / Complaint
    subcategory                         VARCHAR(100)         NOT NULL,  -- Sub-category e.g. Bill dispute / Gas leak
    sla_hours                           INT                  NOT NULL,  -- SLA resolution target in hours
    priority                            VARCHAR(20)          NOT NULL,  -- LOW / MEDIUM / HIGH / CRITICAL
    department                          VARCHAR(100)        ,  -- Handling department
    escalation_matrix                   TEXT                ,  -- JSON escalation rules
    status                              VARCHAR(20)          NOT NULL,  -- ACTIVE / INACTIVE

    CONSTRAINT pk_service_request_type PRIMARY KEY (type_id)
);


-- ==================================================
-- Domain: API & Partners
-- ==================================================

CREATE TABLE API_PARTNER (
CREATE TABLE API_PARTNER (
    partner_id                          VARCHAR(20)          NOT NULL,  -- Unique API partner identifier
    partner_name                        VARCHAR(100)         NOT NULL,  -- Partner display name
    partner_type                        VARCHAR(30)          NOT NULL,  -- PAYMENT_AGG / GOVT_PORTAL / BANK / THIRD_PARTY
    legal_name                          VARCHAR(200)        ,  -- Legal entity name
    contact_email                       VARCHAR(100)         NOT NULL,  -- Primary contact email
    contact_mobile                      VARCHAR(15)         ,  -- Contact mobile
    settlement_mode                     VARCHAR(30)         ,  -- NEFT / RTGS / UPI
    onboarded_on                        DATE                 NOT NULL,  -- Partner onboarding date
    status                              VARCHAR(20)          NOT NULL,  -- ACTIVE / SUSPENDED / TERMINATED

    CONSTRAINT pk_api_partner PRIMARY KEY (partner_id)
);

CREATE TABLE API_CREDENTIAL (
CREATE TABLE API_CREDENTIAL (
    credential_id                       VARCHAR(30)          NOT NULL,  -- Unique credential identifier
    partner_id                          VARCHAR(20)         ,  -- Partner reference
    client_id                           VARCHAR(100)         NOT NULL UNIQUE,  -- OAuth2 / API client ID
    secret_ref                          VARCHAR(200)         NOT NULL,  -- Secret store reference (not stored in plain text)
    token_expiry                        TIMESTAMP           ,  -- Token expiry timestamp
    ip_whitelist                        TEXT                ,  -- JSON array of allowed IP ranges
    cert_ref                            VARCHAR(200)        ,  -- mTLS certificate reference
    last_rotated                        TIMESTAMP           ,  -- Last credential rotation timestamp

    CONSTRAINT pk_api_credential PRIMARY KEY (credential_id),
    CONSTRAINT fk_api_credential_partner_id FOREIGN KEY (partner_id) REFERENCES API_PARTNER (partner_id)
);

CREATE TABLE API_ENDPOINT_CATALOG (
CREATE TABLE API_ENDPOINT_CATALOG (
    endpoint_id                         VARCHAR(20)          NOT NULL,  -- Unique endpoint identifier
    endpoint_code                       VARCHAR(50)          NOT NULL UNIQUE,  -- Endpoint code e.g. FETCH_BILL
    endpoint_path                       VARCHAR(300)         NOT NULL,  -- API path e.g. /v1/bills/{bill_id}
    operation_type                      VARCHAR(50)          NOT NULL,  -- FETCH_BILL / POST_PAYMENT / CHECK_STATUS / WEBHOOK
    request_method                      VARCHAR(10)          NOT NULL,  -- GET / POST / PUT
    auth_type                           VARCHAR(30)          NOT NULL,  -- API_KEY / OAUTH2 / MTLS
    sync_flag                           BOOLEAN              NOT NULL,  -- True if synchronous response
    version                             VARCHAR(10)          NOT NULL,  -- API version e.g. v1
    status                              VARCHAR(20)          NOT NULL,  -- ACTIVE / DEPRECATED

    CONSTRAINT pk_api_endpoint_catalog PRIMARY KEY (endpoint_id)
);

CREATE TABLE API_ENDPOINT_MAPPING (
CREATE TABLE API_ENDPOINT_MAPPING (
    mapping_id                          VARCHAR(30)          NOT NULL,  -- Unique mapping identifier
    partner_id                          VARCHAR(20)         ,  -- Partner reference
    endpoint_id                         VARCHAR(20)         ,  -- Endpoint reference
    enabled                             BOOLEAN              NOT NULL,  -- True if partner has access to this endpoint
    effective_from                      DATE                 NOT NULL,  -- Mapping effective start date

    CONSTRAINT pk_api_endpoint_mapping PRIMARY KEY (mapping_id),
    CONSTRAINT fk_api_endpoint_mapping_partner_id FOREIGN KEY (partner_id) REFERENCES API_PARTNER (partner_id),
    CONSTRAINT fk_api_endpoint_mapping_endpoint_id FOREIGN KEY (endpoint_id) REFERENCES API_ENDPOINT_CATALOG (endpoint_id)
);

CREATE TABLE API_TRANSACTION (
CREATE TABLE API_TRANSACTION (
    api_txn_id                          VARCHAR(30)          NOT NULL,  -- Unique API transaction identifier
    partner_id                          VARCHAR(20)         ,  -- Calling partner
    endpoint_id                         VARCHAR(20)         ,  -- Called endpoint
    correlation_id                      VARCHAR(100)        ,  -- Partner-provided correlation ID
    request_time                        TIMESTAMP            NOT NULL,  -- Request received timestamp
    response_ms                         INT                 ,  -- Response time in milliseconds
    status_code                         VARCHAR(10)          NOT NULL,  -- HTTP status code returned
    error_code                          VARCHAR(30)         ,  -- Error code if failed
    payload_ref                         VARCHAR(200)        ,  -- Reference to stored payload log
    bill_id                             VARCHAR(20)         ,  -- Related bill (for bill fetch / payment APIs)

    CONSTRAINT pk_api_transaction PRIMARY KEY (api_txn_id),
    CONSTRAINT fk_api_transaction_partner_id FOREIGN KEY (partner_id) REFERENCES API_PARTNER (partner_id),
    CONSTRAINT fk_api_transaction_endpoint_id FOREIGN KEY (endpoint_id) REFERENCES API_ENDPOINT_CATALOG (endpoint_id),
    CONSTRAINT fk_api_transaction_error_code FOREIGN KEY (error_code) REFERENCES API_ERROR_CODE (error_code),
    CONSTRAINT fk_api_transaction_bill_id FOREIGN KEY (bill_id) REFERENCES BILL (bill_id)
);

CREATE TABLE WEBHOOK_SUBSCRIPTION (
CREATE TABLE WEBHOOK_SUBSCRIPTION (
    webhook_id                          VARCHAR(30)          NOT NULL,  -- Unique webhook subscription identifier
    partner_id                          VARCHAR(20)         ,  -- Subscribing partner
    event_type                          VARCHAR(50)          NOT NULL,  -- PAYMENT_SUCCESS / PAYMENT_FAILED / BILL_GENERATED / REFUND_PROCESSED
    target_url                          VARCHAR(500)         NOT NULL,  -- Partner webhook endpoint URL
    signature_method                    VARCHAR(30)          NOT NULL,  -- HMAC_SHA256 / RSA
    secret_ref                          VARCHAR(200)        ,  -- Signing secret reference
    retry_count                         INT                  NOT NULL,  -- Max retry attempts on failure
    active                              BOOLEAN              NOT NULL,  -- Subscription active flag

    CONSTRAINT pk_webhook_subscription PRIMARY KEY (webhook_id),
    CONSTRAINT fk_webhook_subscription_partner_id FOREIGN KEY (partner_id) REFERENCES API_PARTNER (partner_id)
);

CREATE TABLE API_RATE_LIMIT (
CREATE TABLE API_RATE_LIMIT (
    limit_id                            VARCHAR(30)          NOT NULL,  -- Unique rate limit rule identifier
    partner_id                          VARCHAR(20)         ,  -- Partner reference
    requests_per_min                    INT                  NOT NULL,  -- Max requests per minute
    burst_limit                         INT                  NOT NULL,  -- Burst allowance above sustained rate
    timeout_ms                          INT                  NOT NULL,  -- Request timeout in milliseconds
    retry_policy                        VARCHAR(50)         ,  -- FIXED / EXPONENTIAL / NONE
    status                              VARCHAR(20)          NOT NULL,  -- ACTIVE / INACTIVE

    CONSTRAINT pk_api_rate_limit PRIMARY KEY (limit_id),
    CONSTRAINT fk_api_rate_limit_partner_id FOREIGN KEY (partner_id) REFERENCES API_PARTNER (partner_id)
);

CREATE TABLE API_ERROR_CODE (
CREATE TABLE API_ERROR_CODE (
    error_code                          VARCHAR(30)          NOT NULL,  -- Unique error code
    http_status                         INT                  NOT NULL,  -- HTTP status code associated
    message                             VARCHAR(300)         NOT NULL,  -- Human-readable error message
    retryable                           BOOLEAN              NOT NULL,  -- True if client should retry
    category                            VARCHAR(50)          NOT NULL,  -- AUTH / VALIDATION / BUSINESS / SYSTEM
    resolution_hint                     VARCHAR(500)        ,  -- Guidance for partner to resolve

    CONSTRAINT pk_api_error_code PRIMARY KEY (error_code)
);


-- End of BFS Enerza DDL