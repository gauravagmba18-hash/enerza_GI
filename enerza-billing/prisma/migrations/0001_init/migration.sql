-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "customer" (
    "customer_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "customer_type" TEXT NOT NULL,
    "kyc_status" TEXT NOT NULL,
    "pan_ref" TEXT,
    "aadhaar_ref" TEXT,
    "mobile" TEXT NOT NULL,
    "email" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "segment_id" TEXT NOT NULL,

    CONSTRAINT "customer_pkey" PRIMARY KEY ("customer_id")
);

-- CreateTable
CREATE TABLE "consumer_segment" (
    "segment_id" TEXT NOT NULL,
    "segment_name" TEXT NOT NULL,
    "utility_type" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consumer_segment_pkey" PRIMARY KEY ("segment_id")
);

-- CreateTable
CREATE TABLE "premise" (
    "premise_id" TEXT NOT NULL,
    "address_line1" TEXT NOT NULL,
    "address_line2" TEXT,
    "geo_lat" DOUBLE PRECISION,
    "geo_lon" DOUBLE PRECISION,
    "building_type" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "area_id" TEXT NOT NULL,

    CONSTRAINT "premise_pkey" PRIMARY KEY ("premise_id")
);

-- CreateTable
CREATE TABLE "account" (
    "account_id" TEXT NOT NULL,
    "bp_type" TEXT,
    "bill_delivery_mode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "effective_from" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "customer_id" TEXT NOT NULL,
    "premise_id" TEXT NOT NULL,
    "cycle_id" TEXT NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("account_id")
);

-- CreateTable
CREATE TABLE "service_connection" (
    "connection_id" TEXT NOT NULL,
    "pod_id" TEXT,
    "utility_type" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "account_id" TEXT NOT NULL,
    "segment_id" TEXT NOT NULL,

    CONSTRAINT "service_connection_pkey" PRIMARY KEY ("connection_id")
);

-- CreateTable
CREATE TABLE "gas_conn_detail" (
    "connection_id" TEXT NOT NULL,
    "service_type" TEXT NOT NULL,
    "regulator_serial" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "pressure_band_id" TEXT NOT NULL,

    CONSTRAINT "gas_conn_detail_pkey" PRIMARY KEY ("connection_id")
);

-- CreateTable
CREATE TABLE "elec_conn_detail" (
    "connection_id" TEXT NOT NULL,
    "load_kw" DOUBLE PRECISION,
    "supply_voltage" TEXT,
    "phase_type" TEXT,
    "tariff_category" TEXT,
    "contract_demand_kva" DOUBLE PRECISION,
    "is_net_metered" BOOLEAN NOT NULL DEFAULT false,
    "solar_capacity_kw" DOUBLE PRECISION,
    "dt_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "elec_conn_detail_pkey" PRIMARY KEY ("connection_id")
);

-- CreateTable
CREATE TABLE "water_conn_detail" (
    "connection_id" TEXT NOT NULL,
    "pipe_size_mm" DOUBLE PRECISION,
    "supply_zone_id" TEXT,
    "meter_type" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "water_conn_detail_pkey" PRIMARY KEY ("connection_id")
);

-- CreateTable
CREATE TABLE "supply_zone" (
    "supply_zone_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "utility_type" TEXT NOT NULL DEFAULT 'WATER',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supply_zone_pkey" PRIMARY KEY ("supply_zone_id")
);

-- CreateTable
CREATE TABLE "bulk_meter_read" (
    "read_id" TEXT NOT NULL,
    "supply_zone_id" TEXT NOT NULL,
    "read_date" TIMESTAMP(3) NOT NULL,
    "value_scm" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'FINAL',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bulk_meter_read_pkey" PRIMARY KEY ("read_id")
);

-- CreateTable
CREATE TABLE "pressure_band" (
    "band_id" TEXT NOT NULL,
    "band_name" TEXT NOT NULL,
    "min_pressure" DOUBLE PRECISION NOT NULL,
    "max_pressure" DOUBLE PRECISION NOT NULL,
    "usage_class" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pressure_band_pkey" PRIMARY KEY ("band_id")
);

-- CreateTable
CREATE TABLE "rate_plan" (
    "rate_plan_id" TEXT NOT NULL,
    "plan_name" TEXT NOT NULL,
    "utility_type" TEXT NOT NULL,
    "effective_from" TIMESTAMP(3) NOT NULL,
    "effective_to" TIMESTAMP(3),
    "billing_freq" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "segment_id" TEXT NOT NULL,

    CONSTRAINT "rate_plan_pkey" PRIMARY KEY ("rate_plan_id")
);

-- CreateTable
CREATE TABLE "charge_component" (
    "component_id" TEXT NOT NULL,
    "component_name" TEXT NOT NULL,
    "component_type" TEXT NOT NULL,
    "uom" TEXT,
    "rate" DOUBLE PRECISION NOT NULL,
    "posting_class" TEXT,
    "slab_from" INTEGER,
    "slab_to" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "rate_plan_id" TEXT NOT NULL,

    CONSTRAINT "charge_component_pkey" PRIMARY KEY ("component_id")
);

-- CreateTable
CREATE TABLE "tax_master" (
    "tax_id" TEXT NOT NULL,
    "tax_name" TEXT NOT NULL,
    "jurisdiction" TEXT NOT NULL,
    "tax_rate" DOUBLE PRECISION NOT NULL,
    "applicability" TEXT NOT NULL,
    "effective_from" TIMESTAMP(3) NOT NULL,
    "effective_to" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_master_pkey" PRIMARY KEY ("tax_id")
);

-- CreateTable
CREATE TABLE "bill_cycle" (
    "cycle_id" TEXT NOT NULL,
    "cycle_name" TEXT NOT NULL,
    "read_date_rule" TEXT NOT NULL,
    "bill_date_rule" TEXT NOT NULL,
    "due_date_rule" TEXT NOT NULL,
    "grace_days" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bill_cycle_pkey" PRIMARY KEY ("cycle_id")
);

-- CreateTable
CREATE TABLE "bill" (
    "bill_id" TEXT NOT NULL,
    "bill_date" TIMESTAMP(3) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "net_amount" DOUBLE PRECISION NOT NULL,
    "tax_amount" DOUBLE PRECISION NOT NULL,
    "total_amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "account_id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "cycle_id" TEXT NOT NULL,

    CONSTRAINT "bill_pkey" PRIMARY KEY ("bill_id")
);

-- CreateTable
CREATE TABLE "bill_line" (
    "line_id" TEXT NOT NULL,
    "description" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "line_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "bill_id" TEXT NOT NULL,
    "component_id" TEXT NOT NULL,

    CONSTRAINT "bill_line_pkey" PRIMARY KEY ("line_id")
);

-- CreateTable
CREATE TABLE "payment_channel" (
    "channel_id" TEXT NOT NULL,
    "channel_name" TEXT NOT NULL,
    "channel_type" TEXT NOT NULL,
    "provider" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_channel_pkey" PRIMARY KEY ("channel_id")
);

-- CreateTable
CREATE TABLE "payment_gateway" (
    "gateway_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "merchant_id" TEXT NOT NULL,
    "callback_url" TEXT NOT NULL,
    "environment" TEXT NOT NULL DEFAULT 'SANDBOX',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_gateway_pkey" PRIMARY KEY ("gateway_id")
);

-- CreateTable
CREATE TABLE "payment_order" (
    "order_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "convenience_fee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'INITIATED',
    "initiated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "bill_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "gateway_id" TEXT NOT NULL,

    CONSTRAINT "payment_order_pkey" PRIMARY KEY ("order_id")
);

-- CreateTable
CREATE TABLE "gateway_txn" (
    "txn_id" TEXT NOT NULL,
    "gateway_ref" TEXT,
    "gateway_status" TEXT NOT NULL,
    "response_at" TIMESTAMP(3),
    "settled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "order_id" TEXT NOT NULL,
    "settlement_id" TEXT,

    CONSTRAINT "gateway_txn_pkey" PRIMARY KEY ("txn_id")
);

-- CreateTable
CREATE TABLE "settlement" (
    "settlement_id" TEXT NOT NULL,
    "settlement_date" TIMESTAMP(3) NOT NULL,
    "gross_amount" DOUBLE PRECISION NOT NULL,
    "net_amount" DOUBLE PRECISION NOT NULL,
    "matched_count" INTEGER NOT NULL DEFAULT 0,
    "exception_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "gateway_id" TEXT NOT NULL,

    CONSTRAINT "settlement_pkey" PRIMARY KEY ("settlement_id")
);

-- CreateTable
CREATE TABLE "refund" (
    "refund_id" TEXT NOT NULL,
    "reason_code" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'INITIATED',
    "initiated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "order_id" TEXT NOT NULL,

    CONSTRAINT "refund_pkey" PRIMARY KEY ("refund_id")
);

-- CreateTable
CREATE TABLE "suspense_record" (
    "suspense_id" TEXT NOT NULL,
    "reason" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "resolution_status" TEXT NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "txn_id" TEXT NOT NULL,

    CONSTRAINT "suspense_record_pkey" PRIMARY KEY ("suspense_id")
);

-- CreateTable
CREATE TABLE "cgd_area" (
    "area_id" TEXT NOT NULL,
    "area_name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zone" TEXT,
    "utility_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cgd_area_pkey" PRIMARY KEY ("area_id")
);

-- CreateTable
CREATE TABLE "route" (
    "route_id" TEXT NOT NULL,
    "route_name" TEXT NOT NULL,
    "cycle_group" TEXT,
    "reader_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "area_id" TEXT NOT NULL,

    CONSTRAINT "route_pkey" PRIMARY KEY ("route_id")
);

-- CreateTable
CREATE TABLE "meter" (
    "meter_id" TEXT NOT NULL,
    "serial_no" TEXT NOT NULL,
    "meter_type" TEXT NOT NULL,
    "make" TEXT,
    "model" TEXT,
    "uom" TEXT,
    "utility_type" TEXT NOT NULL,
    "calibration_due" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meter_pkey" PRIMARY KEY ("meter_id")
);

-- CreateTable
CREATE TABLE "meter_installation" (
    "install_id" TEXT NOT NULL,
    "install_date" TIMESTAMP(3) NOT NULL,
    "remove_date" TIMESTAMP(3),
    "seal_no" TEXT,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "meter_id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,

    CONSTRAINT "meter_installation_pkey" PRIMARY KEY ("install_id")
);

-- CreateTable
CREATE TABLE "meter_reading" (
    "reading_id" TEXT NOT NULL,
    "reading_date" TIMESTAMP(3) NOT NULL,
    "reading_value" DOUBLE PRECISION NOT NULL,
    "consumption" DOUBLE PRECISION NOT NULL,
    "kvah" DOUBLE PRECISION,
    "max_demand" DOUBLE PRECISION,
    "reading_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "meter_id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "route_id" TEXT NOT NULL,

    CONSTRAINT "meter_reading_pkey" PRIMARY KEY ("reading_id")
);

-- CreateTable
CREATE TABLE "cng_station" (
    "station_id" TEXT NOT NULL,
    "station_name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "compressor_type" TEXT,
    "dispenser_count" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "area_id" TEXT NOT NULL,

    CONSTRAINT "cng_station_pkey" PRIMARY KEY ("station_id")
);

-- CreateTable
CREATE TABLE "vehicle_category" (
    "category_id" TEXT NOT NULL,
    "category_name" TEXT NOT NULL,
    "vehicle_type" TEXT NOT NULL,
    "commercial_flag" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_category_pkey" PRIMARY KEY ("category_id")
);

-- CreateTable
CREATE TABLE "cng_sale" (
    "sale_id" TEXT NOT NULL,
    "sale_date" TIMESTAMP(3) NOT NULL,
    "quantity_scm" DOUBLE PRECISION NOT NULL,
    "unit_price" DOUBLE PRECISION NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "station_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,

    CONSTRAINT "cng_sale_pkey" PRIMARY KEY ("sale_id")
);

-- CreateTable
CREATE TABLE "app_user" (
    "app_user_id" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "email" TEXT,
    "otp_verified" TEXT NOT NULL DEFAULT 'N',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "registered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "customer_id" TEXT NOT NULL,

    CONSTRAINT "app_user_pkey" PRIMARY KEY ("app_user_id")
);

-- CreateTable
CREATE TABLE "app_device" (
    "device_id" TEXT NOT NULL,
    "os_type" TEXT,
    "app_version" TEXT,
    "push_token" TEXT,
    "device_fingerprint" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "app_user_id" TEXT NOT NULL,

    CONSTRAINT "app_device_pkey" PRIMARY KEY ("device_id")
);

-- CreateTable
CREATE TABLE "app_account_link" (
    "link_id" TEXT NOT NULL,
    "ownership_type" TEXT,
    "linked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "app_user_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,

    CONSTRAINT "app_account_link_pkey" PRIMARY KEY ("link_id")
);

-- CreateTable
CREATE TABLE "app_session" (
    "session_id" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "session_status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "app_user_id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,

    CONSTRAINT "app_session_pkey" PRIMARY KEY ("session_id")
);

-- CreateTable
CREATE TABLE "app_notification" (
    "notif_id" TEXT NOT NULL,
    "message" TEXT,
    "channel" TEXT,
    "sent_at" TIMESTAMP(3),
    "read_flag" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "app_user_id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,

    CONSTRAINT "app_notification_pkey" PRIMARY KEY ("notif_id")
);

-- CreateTable
CREATE TABLE "notif_template" (
    "template_id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "body_template" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notif_template_pkey" PRIMARY KEY ("template_id")
);

-- CreateTable
CREATE TABLE "app_service_request" (
    "request_id" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "app_user_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "type_id" TEXT NOT NULL,
    "boq_amount" DOUBLE PRECISION,
    "demand_note_status" TEXT DEFAULT 'NOT_GENERATED',
    "verification_steps" TEXT,

    CONSTRAINT "app_service_request_pkey" PRIMARY KEY ("request_id")
);

-- CreateTable
CREATE TABLE "service_request_type" (
    "type_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "sla_hours" INTEGER NOT NULL DEFAULT 24,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "department" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_request_type_pkey" PRIMARY KEY ("type_id")
);

-- CreateTable
CREATE TABLE "api_partner" (
    "partner_id" TEXT NOT NULL,
    "partner_name" TEXT NOT NULL,
    "partner_type" TEXT NOT NULL,
    "contact_email" TEXT,
    "contact_mobile" TEXT,
    "settlement_mode" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_partner_pkey" PRIMARY KEY ("partner_id")
);

-- CreateTable
CREATE TABLE "api_credential" (
    "credential_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "secret_ref" TEXT,
    "token_expiry" TIMESTAMP(3),
    "ip_whitelist" TEXT,
    "cert_ref" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "partner_id" TEXT NOT NULL,

    CONSTRAINT "api_credential_pkey" PRIMARY KEY ("credential_id")
);

-- CreateTable
CREATE TABLE "api_endpoint_catalog" (
    "endpoint_id" TEXT NOT NULL,
    "endpoint_code" TEXT NOT NULL,
    "operation_type" TEXT NOT NULL,
    "request_method" TEXT NOT NULL,
    "auth_type" TEXT NOT NULL,
    "sync_flag" BOOLEAN NOT NULL DEFAULT true,
    "version" TEXT NOT NULL DEFAULT 'v1',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_endpoint_catalog_pkey" PRIMARY KEY ("endpoint_id")
);

-- CreateTable
CREATE TABLE "api_endpoint_mapping" (
    "mapping_id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "effective_from" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "partner_id" TEXT NOT NULL,
    "endpoint_id" TEXT NOT NULL,

    CONSTRAINT "api_endpoint_mapping_pkey" PRIMARY KEY ("mapping_id")
);

-- CreateTable
CREATE TABLE "api_transaction" (
    "api_txn_id" TEXT NOT NULL,
    "request_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "response_ms" INTEGER,
    "status_code" TEXT,
    "payload_ref" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "partner_id" TEXT NOT NULL,
    "endpoint_id" TEXT NOT NULL,
    "error_code" TEXT,

    CONSTRAINT "api_transaction_pkey" PRIMARY KEY ("api_txn_id")
);

-- CreateTable
CREATE TABLE "webhook_subscription" (
    "webhook_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "target_url" TEXT NOT NULL,
    "signature_method" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 3,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "partner_id" TEXT NOT NULL,

    CONSTRAINT "webhook_subscription_pkey" PRIMARY KEY ("webhook_id")
);

-- CreateTable
CREATE TABLE "api_rate_limit" (
    "limit_id" TEXT NOT NULL,
    "requests_per_min" INTEGER NOT NULL,
    "burst_limit" INTEGER NOT NULL,
    "timeout_ms" INTEGER NOT NULL DEFAULT 5000,
    "retry_policy" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "partner_id" TEXT NOT NULL,

    CONSTRAINT "api_rate_limit_pkey" PRIMARY KEY ("limit_id")
);

-- CreateTable
CREATE TABLE "api_error_code" (
    "error_code" TEXT NOT NULL,
    "http_status" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "retryable" BOOLEAN NOT NULL DEFAULT false,
    "category" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_error_code_pkey" PRIMARY KEY ("error_code")
);

-- CreateTable
CREATE TABLE "utility_config" (
    "config_id" TEXT NOT NULL DEFAULT 'SYSTEM_DEFAULT',
    "utility_name" TEXT NOT NULL,
    "prorationMode" TEXT NOT NULL DEFAULT 'IMMEDIATE',
    "minBillingMode" TEXT NOT NULL DEFAULT 'FIXED',
    "minBillingValue" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "default_sla_hours" INTEGER NOT NULL DEFAULT 24,
    "maintenance_email" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "utility_config_pkey" PRIMARY KEY ("config_id")
);

-- CreateTable
CREATE TABLE "service_ticket" (
    "ticket_id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "category" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "closed_at" TIMESTAMP(3),
    "account_id" TEXT NOT NULL,
    "outage_id" TEXT,

    CONSTRAINT "service_ticket_pkey" PRIMARY KEY ("ticket_id")
);

-- CreateTable
CREATE TABLE "work_order" (
    "work_order_id" TEXT NOT NULL,
    "ticket_id" TEXT,
    "technician_id" TEXT,
    "asset_id" TEXT,
    "type" TEXT NOT NULL DEFAULT 'SERVICE_RESTORATION',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "scheduled_date" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "inspection_notes" TEXT,
    "resolution_notes" TEXT,
    "gps_lat" DOUBLE PRECISION,
    "gps_lon" DOUBLE PRECISION,
    "checklist" TEXT,
    "materials" TEXT,
    "photos" TEXT,
    "signature" TEXT,
    "unattended_reason" TEXT,

    CONSTRAINT "work_order_pkey" PRIMARY KEY ("work_order_id")
);

-- CreateTable
CREATE TABLE "technician" (
    "technician_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "pincode_scope" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "technician_pkey" PRIMARY KEY ("technician_id")
);

-- CreateTable
CREATE TABLE "inventory_item" (
    "item_id" TEXT NOT NULL,
    "item_code" TEXT,
    "item_name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "uom" TEXT,
    "min_level" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "unit_cost" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_item_pkey" PRIMARY KEY ("item_id")
);

-- CreateTable
CREATE TABLE "work_order_spare" (
    "usage_id" TEXT NOT NULL,
    "work_order_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_order_spare_pkey" PRIMARY KEY ("usage_id")
);

-- CreateTable
CREATE TABLE "sub_station" (
    "sub_station_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "voltage_level" TEXT NOT NULL,
    "area_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sub_station_pkey" PRIMARY KEY ("sub_station_id")
);

-- CreateTable
CREATE TABLE "feeder" (
    "feeder_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sub_station_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feeder_pkey" PRIMARY KEY ("feeder_id")
);

-- CreateTable
CREATE TABLE "distribution_transformer" (
    "dt_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "feeder_id" TEXT NOT NULL,
    "capacity_kva" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "distribution_transformer_pkey" PRIMARY KEY ("dt_id")
);

-- CreateTable
CREATE TABLE "tod_slot" (
    "slot_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "rateModifier" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tod_slot_pkey" PRIMARY KEY ("slot_id")
);

-- CreateTable
CREATE TABLE "meter_interval_read" (
    "interval_id" TEXT NOT NULL,
    "meter_id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "kwh_import" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "kwh_export" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "kvah" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "kvarh" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meter_interval_read_pkey" PRIMARY KEY ("interval_id")
);

-- CreateTable
CREATE TABLE "net_metering_credit" (
    "credit_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "bill_id" TEXT,
    "credit_kwh" DOUBLE PRECISION NOT NULL,
    "carry_forward" BOOLEAN NOT NULL DEFAULT true,
    "expiry_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "net_metering_credit_pkey" PRIMARY KEY ("credit_id")
);

-- CreateTable
CREATE TABLE "dunning_level" (
    "level_id" TEXT NOT NULL,
    "levelName" TEXT NOT NULL,
    "days_overdue" INTEGER NOT NULL,
    "penalty_fee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "action_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dunning_level_pkey" PRIMARY KEY ("level_id")
);

-- CreateTable
CREATE TABLE "dunning_notice" (
    "notice_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "bill_id" TEXT NOT NULL,
    "level_id" TEXT NOT NULL,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'ISSUED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dunning_notice_pkey" PRIMARY KEY ("notice_id")
);

-- CreateTable
CREATE TABLE "security_deposit" (
    "deposit_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "payment_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "refund_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "security_deposit_pkey" PRIMARY KEY ("deposit_id")
);

-- CreateTable
CREATE TABLE "budget_billing_plan" (
    "plan_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "monthly_amount" DOUBLE PRECISION NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "reconciliation_month" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budget_billing_plan_pkey" PRIMARY KEY ("plan_id")
);

-- CreateTable
CREATE TABLE "asset" (
    "asset_id" TEXT NOT NULL,
    "asset_code" TEXT,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "health_status" TEXT NOT NULL DEFAULT 'GOOD',
    "last_maint_date" TIMESTAMP(3),
    "next_maint_date" TIMESTAMP(3),
    "ytd_failures" INTEGER NOT NULL DEFAULT 0,
    "feeder_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_pkey" PRIMARY KEY ("asset_id")
);

-- CreateTable
CREATE TABLE "inventory_location" (
    "location_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'WAREHOUSE',
    "technician_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_location_pkey" PRIMARY KEY ("location_id")
);

-- CreateTable
CREATE TABLE "inventory_stock" (
    "item_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "inventory_stock_pkey" PRIMARY KEY ("item_id","location_id")
);

-- CreateTable
CREATE TABLE "inventory_transfer" (
    "transfer_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "from_location_id" TEXT NOT NULL,
    "to_location_id" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_transfer_pkey" PRIMARY KEY ("transfer_id")
);

-- CreateTable
CREATE TABLE "maintenance_activity" (
    "activity_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'PREVENTIVE',
    "description" TEXT,
    "performed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "health_update" TEXT,

    CONSTRAINT "maintenance_activity_pkey" PRIMARY KEY ("activity_id")
);

-- CreateTable
CREATE TABLE "outage_event" (
    "outage_id" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "feeder_id" TEXT,
    "type" TEXT NOT NULL DEFAULT 'FORCED',
    "start_at" TIMESTAMP(3) NOT NULL,
    "est_restore" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outage_event_pkey" PRIMARY KEY ("outage_id")
);

-- CreateTable
CREATE TABLE "service_request" (
    "request_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "account_id" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "current_step" INTEGER NOT NULL DEFAULT 1,
    "description" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "assigned_to" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_request_pkey" PRIMARY KEY ("request_id")
);

-- CreateTable
CREATE TABLE "request_document" (
    "doc_id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "doc_type" TEXT NOT NULL,
    "doc_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "verified_at" TIMESTAMP(3),

    CONSTRAINT "request_document_pkey" PRIMARY KEY ("doc_id")
);

-- CreateTable
CREATE TABLE "workflow_log" (
    "log_id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "step_name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "performed_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_log_pkey" PRIMARY KEY ("log_id")
);

-- CreateTable
CREATE TABLE "boq_header" (
    "boq_id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "total_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PROPOSED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "boq_header_pkey" PRIMARY KEY ("boq_id")
);

-- CreateTable
CREATE TABLE "boq_item" (
    "item_id" TEXT NOT NULL,
    "boq_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit_rate" DOUBLE PRECISION NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "boq_item_pkey" PRIMARY KEY ("item_id")
);

-- CreateTable
CREATE TABLE "demand_note" (
    "note_id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UNPAID',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "demand_note_pkey" PRIMARY KEY ("note_id")
);

-- CreateTable
CREATE TABLE "complaint_category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "complaint_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "complaint_sub_category" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sla_hours" INTEGER NOT NULL DEFAULT 24,

    CONSTRAINT "complaint_sub_category_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "customer_status_idx" ON "customer"("status");

-- CreateIndex
CREATE INDEX "customer_segment_id_idx" ON "customer"("segment_id");

-- CreateIndex
CREATE INDEX "account_status_idx" ON "account"("status");

-- CreateIndex
CREATE INDEX "account_customer_id_idx" ON "account"("customer_id");

-- CreateIndex
CREATE INDEX "account_premise_id_idx" ON "account"("premise_id");

-- CreateIndex
CREATE INDEX "service_connection_status_idx" ON "service_connection"("status");

-- CreateIndex
CREATE INDEX "service_connection_account_id_idx" ON "service_connection"("account_id");

-- CreateIndex
CREATE INDEX "service_connection_utility_type_idx" ON "service_connection"("utility_type");

-- CreateIndex
CREATE INDEX "bulk_meter_read_supply_zone_id_read_date_idx" ON "bulk_meter_read"("supply_zone_id", "read_date");

-- CreateIndex
CREATE INDEX "bill_status_idx" ON "bill"("status");

-- CreateIndex
CREATE INDEX "bill_account_id_idx" ON "bill"("account_id");

-- CreateIndex
CREATE INDEX "payment_order_status_idx" ON "payment_order"("status");

-- CreateIndex
CREATE INDEX "payment_order_account_id_idx" ON "payment_order"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "refund_order_id_key" ON "refund"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "suspense_record_txn_id_key" ON "suspense_record"("txn_id");

-- CreateIndex
CREATE UNIQUE INDEX "meter_serial_no_key" ON "meter"("serial_no");

-- CreateIndex
CREATE INDEX "meter_status_idx" ON "meter"("status");

-- CreateIndex
CREATE UNIQUE INDEX "app_user_customer_id_key" ON "app_user"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "api_endpoint_catalog_endpoint_code_key" ON "api_endpoint_catalog"("endpoint_code");

-- CreateIndex
CREATE UNIQUE INDEX "api_rate_limit_partner_id_key" ON "api_rate_limit"("partner_id");

-- CreateIndex
CREATE UNIQUE INDEX "technician_mobile_key" ON "technician"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_item_item_code_key" ON "inventory_item"("item_code");

-- CreateIndex
CREATE INDEX "meter_interval_read_meter_id_timestamp_idx" ON "meter_interval_read"("meter_id", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "asset_asset_code_key" ON "asset"("asset_code");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_location_technician_id_key" ON "inventory_location"("technician_id");

-- CreateIndex
CREATE UNIQUE INDEX "boq_header_request_id_key" ON "boq_header"("request_id");

-- CreateIndex
CREATE UNIQUE INDEX "demand_note_request_id_key" ON "demand_note"("request_id");

-- CreateIndex
CREATE UNIQUE INDEX "complaint_category_name_key" ON "complaint_category"("name");

-- AddForeignKey
ALTER TABLE "customer" ADD CONSTRAINT "customer_segment_id_fkey" FOREIGN KEY ("segment_id") REFERENCES "consumer_segment"("segment_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "premise" ADD CONSTRAINT "premise_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "cgd_area"("area_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("customer_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_premise_id_fkey" FOREIGN KEY ("premise_id") REFERENCES "premise"("premise_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "bill_cycle"("cycle_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_connection" ADD CONSTRAINT "service_connection_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_connection" ADD CONSTRAINT "service_connection_segment_id_fkey" FOREIGN KEY ("segment_id") REFERENCES "consumer_segment"("segment_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gas_conn_detail" ADD CONSTRAINT "gas_conn_detail_pressure_band_id_fkey" FOREIGN KEY ("pressure_band_id") REFERENCES "pressure_band"("band_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gas_conn_detail" ADD CONSTRAINT "gas_conn_detail_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "service_connection"("connection_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "elec_conn_detail" ADD CONSTRAINT "elec_conn_detail_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "service_connection"("connection_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "elec_conn_detail" ADD CONSTRAINT "elec_conn_detail_dt_id_fkey" FOREIGN KEY ("dt_id") REFERENCES "distribution_transformer"("dt_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "water_conn_detail" ADD CONSTRAINT "water_conn_detail_supply_zone_id_fkey" FOREIGN KEY ("supply_zone_id") REFERENCES "supply_zone"("supply_zone_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "water_conn_detail" ADD CONSTRAINT "water_conn_detail_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "service_connection"("connection_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bulk_meter_read" ADD CONSTRAINT "bulk_meter_read_supply_zone_id_fkey" FOREIGN KEY ("supply_zone_id") REFERENCES "supply_zone"("supply_zone_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rate_plan" ADD CONSTRAINT "rate_plan_segment_id_fkey" FOREIGN KEY ("segment_id") REFERENCES "consumer_segment"("segment_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charge_component" ADD CONSTRAINT "charge_component_rate_plan_id_fkey" FOREIGN KEY ("rate_plan_id") REFERENCES "rate_plan"("rate_plan_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill" ADD CONSTRAINT "bill_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill" ADD CONSTRAINT "bill_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "service_connection"("connection_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill" ADD CONSTRAINT "bill_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "bill_cycle"("cycle_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_line" ADD CONSTRAINT "bill_line_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "bill"("bill_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_line" ADD CONSTRAINT "bill_line_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "charge_component"("component_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_order" ADD CONSTRAINT "payment_order_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "bill"("bill_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_order" ADD CONSTRAINT "payment_order_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_order" ADD CONSTRAINT "payment_order_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "payment_channel"("channel_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_order" ADD CONSTRAINT "payment_order_gateway_id_fkey" FOREIGN KEY ("gateway_id") REFERENCES "payment_gateway"("gateway_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gateway_txn" ADD CONSTRAINT "gateway_txn_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "payment_order"("order_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gateway_txn" ADD CONSTRAINT "gateway_txn_settlement_id_fkey" FOREIGN KEY ("settlement_id") REFERENCES "settlement"("settlement_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlement" ADD CONSTRAINT "settlement_gateway_id_fkey" FOREIGN KEY ("gateway_id") REFERENCES "payment_gateway"("gateway_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund" ADD CONSTRAINT "refund_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "payment_order"("order_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suspense_record" ADD CONSTRAINT "suspense_record_txn_id_fkey" FOREIGN KEY ("txn_id") REFERENCES "gateway_txn"("txn_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route" ADD CONSTRAINT "route_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "cgd_area"("area_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meter_installation" ADD CONSTRAINT "meter_installation_meter_id_fkey" FOREIGN KEY ("meter_id") REFERENCES "meter"("meter_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meter_installation" ADD CONSTRAINT "meter_installation_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "service_connection"("connection_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meter_reading" ADD CONSTRAINT "meter_reading_meter_id_fkey" FOREIGN KEY ("meter_id") REFERENCES "meter"("meter_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meter_reading" ADD CONSTRAINT "meter_reading_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "service_connection"("connection_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meter_reading" ADD CONSTRAINT "meter_reading_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "route"("route_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cng_station" ADD CONSTRAINT "cng_station_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "cgd_area"("area_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cng_sale" ADD CONSTRAINT "cng_sale_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "cng_station"("station_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cng_sale" ADD CONSTRAINT "cng_sale_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "vehicle_category"("category_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_user" ADD CONSTRAINT "app_user_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("customer_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_device" ADD CONSTRAINT "app_device_app_user_id_fkey" FOREIGN KEY ("app_user_id") REFERENCES "app_user"("app_user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_account_link" ADD CONSTRAINT "app_account_link_app_user_id_fkey" FOREIGN KEY ("app_user_id") REFERENCES "app_user"("app_user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_account_link" ADD CONSTRAINT "app_account_link_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_session" ADD CONSTRAINT "app_session_app_user_id_fkey" FOREIGN KEY ("app_user_id") REFERENCES "app_user"("app_user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_session" ADD CONSTRAINT "app_session_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "app_device"("device_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_notification" ADD CONSTRAINT "app_notification_app_user_id_fkey" FOREIGN KEY ("app_user_id") REFERENCES "app_user"("app_user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_notification" ADD CONSTRAINT "app_notification_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "notif_template"("template_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_service_request" ADD CONSTRAINT "app_service_request_app_user_id_fkey" FOREIGN KEY ("app_user_id") REFERENCES "app_user"("app_user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_service_request" ADD CONSTRAINT "app_service_request_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_service_request" ADD CONSTRAINT "app_service_request_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "service_request_type"("type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_credential" ADD CONSTRAINT "api_credential_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "api_partner"("partner_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_endpoint_mapping" ADD CONSTRAINT "api_endpoint_mapping_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "api_partner"("partner_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_endpoint_mapping" ADD CONSTRAINT "api_endpoint_mapping_endpoint_id_fkey" FOREIGN KEY ("endpoint_id") REFERENCES "api_endpoint_catalog"("endpoint_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_transaction" ADD CONSTRAINT "api_transaction_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "api_partner"("partner_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_transaction" ADD CONSTRAINT "api_transaction_endpoint_id_fkey" FOREIGN KEY ("endpoint_id") REFERENCES "api_endpoint_catalog"("endpoint_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_transaction" ADD CONSTRAINT "api_transaction_error_code_fkey" FOREIGN KEY ("error_code") REFERENCES "api_error_code"("error_code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_subscription" ADD CONSTRAINT "webhook_subscription_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "api_partner"("partner_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_rate_limit" ADD CONSTRAINT "api_rate_limit_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "api_partner"("partner_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_ticket" ADD CONSTRAINT "service_ticket_outage_id_fkey" FOREIGN KEY ("outage_id") REFERENCES "outage_event"("outage_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_ticket" ADD CONSTRAINT "service_ticket_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order" ADD CONSTRAINT "work_order_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "asset"("asset_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order" ADD CONSTRAINT "work_order_technician_id_fkey" FOREIGN KEY ("technician_id") REFERENCES "technician"("technician_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order" ADD CONSTRAINT "work_order_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "service_ticket"("ticket_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_spare" ADD CONSTRAINT "work_order_spare_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "inventory_item"("item_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_spare" ADD CONSTRAINT "work_order_spare_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_order"("work_order_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feeder" ADD CONSTRAINT "feeder_sub_station_id_fkey" FOREIGN KEY ("sub_station_id") REFERENCES "sub_station"("sub_station_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribution_transformer" ADD CONSTRAINT "distribution_transformer_feeder_id_fkey" FOREIGN KEY ("feeder_id") REFERENCES "feeder"("feeder_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meter_interval_read" ADD CONSTRAINT "meter_interval_read_meter_id_fkey" FOREIGN KEY ("meter_id") REFERENCES "meter"("meter_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "net_metering_credit" ADD CONSTRAINT "net_metering_credit_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "bill"("bill_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "net_metering_credit" ADD CONSTRAINT "net_metering_credit_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dunning_notice" ADD CONSTRAINT "dunning_notice_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "dunning_level"("level_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dunning_notice" ADD CONSTRAINT "dunning_notice_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "bill"("bill_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dunning_notice" ADD CONSTRAINT "dunning_notice_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_deposit" ADD CONSTRAINT "security_deposit_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_billing_plan" ADD CONSTRAINT "budget_billing_plan_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset" ADD CONSTRAINT "asset_feeder_id_fkey" FOREIGN KEY ("feeder_id") REFERENCES "feeder"("feeder_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_location" ADD CONSTRAINT "inventory_location_technician_id_fkey" FOREIGN KEY ("technician_id") REFERENCES "technician"("technician_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_stock" ADD CONSTRAINT "inventory_stock_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "inventory_location"("location_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_stock" ADD CONSTRAINT "inventory_stock_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "inventory_item"("item_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transfer" ADD CONSTRAINT "inventory_transfer_to_location_id_fkey" FOREIGN KEY ("to_location_id") REFERENCES "inventory_location"("location_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transfer" ADD CONSTRAINT "inventory_transfer_from_location_id_fkey" FOREIGN KEY ("from_location_id") REFERENCES "inventory_location"("location_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transfer" ADD CONSTRAINT "inventory_transfer_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "inventory_item"("item_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_activity" ADD CONSTRAINT "maintenance_activity_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "asset"("asset_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outage_event" ADD CONSTRAINT "outage_event_feeder_id_fkey" FOREIGN KEY ("feeder_id") REFERENCES "feeder"("feeder_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_request" ADD CONSTRAINT "service_request_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("customer_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_request" ADD CONSTRAINT "service_request_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("account_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_document" ADD CONSTRAINT "request_document_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "service_request"("request_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_log" ADD CONSTRAINT "workflow_log_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "service_request"("request_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boq_header" ADD CONSTRAINT "boq_header_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "service_request"("request_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boq_item" ADD CONSTRAINT "boq_item_boq_id_fkey" FOREIGN KEY ("boq_id") REFERENCES "boq_header"("boq_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demand_note" ADD CONSTRAINT "demand_note_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "service_request"("request_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaint_sub_category" ADD CONSTRAINT "complaint_sub_category_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "complaint_category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
