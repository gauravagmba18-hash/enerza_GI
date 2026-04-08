-- CreateTable
CREATE TABLE "customer" (
    "customer_id" TEXT NOT NULL PRIMARY KEY,
    "full_name" TEXT NOT NULL,
    "customer_type" TEXT NOT NULL,
    "kyc_status" TEXT NOT NULL,
    "pan_ref" TEXT,
    "aadhaar_ref" TEXT,
    "mobile" TEXT NOT NULL,
    "email" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "segment_id" TEXT NOT NULL,
    CONSTRAINT "customer_segment_id_fkey" FOREIGN KEY ("segment_id") REFERENCES "consumer_segment" ("segment_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "consumer_segment" (
    "segment_id" TEXT NOT NULL PRIMARY KEY,
    "segment_name" TEXT NOT NULL,
    "utility_type" TEXT NOT NULL,
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "premise" (
    "premise_id" TEXT NOT NULL PRIMARY KEY,
    "address_line1" TEXT NOT NULL,
    "address_line2" TEXT,
    "geo_lat" REAL,
    "geo_lon" REAL,
    "building_type" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "area_id" TEXT NOT NULL,
    CONSTRAINT "premise_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "cgd_area" ("area_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "account" (
    "account_id" TEXT NOT NULL PRIMARY KEY,
    "bp_type" TEXT,
    "bill_delivery_mode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "effective_from" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "customer_id" TEXT NOT NULL,
    "premise_id" TEXT NOT NULL,
    "cycle_id" TEXT NOT NULL,
    CONSTRAINT "account_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "bill_cycle" ("cycle_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "account_premise_id_fkey" FOREIGN KEY ("premise_id") REFERENCES "premise" ("premise_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "account_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer" ("customer_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "service_connection" (
    "connection_id" TEXT NOT NULL PRIMARY KEY,
    "pod_id" TEXT,
    "utility_type" TEXT NOT NULL,
    "start_date" DATETIME NOT NULL,
    "end_date" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "account_id" TEXT NOT NULL,
    "segment_id" TEXT NOT NULL,
    CONSTRAINT "service_connection_segment_id_fkey" FOREIGN KEY ("segment_id") REFERENCES "consumer_segment" ("segment_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "service_connection_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account" ("account_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "gas_conn_detail" (
    "connection_id" TEXT NOT NULL PRIMARY KEY,
    "service_type" TEXT NOT NULL,
    "regulator_serial" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "pressure_band_id" TEXT NOT NULL,
    CONSTRAINT "gas_conn_detail_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "service_connection" ("connection_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "gas_conn_detail_pressure_band_id_fkey" FOREIGN KEY ("pressure_band_id") REFERENCES "pressure_band" ("band_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "elec_conn_detail" (
    "connection_id" TEXT NOT NULL PRIMARY KEY,
    "load_kw" REAL,
    "supply_voltage" TEXT,
    "phase_type" TEXT,
    "tariff_category" TEXT,
    "contract_demand_kva" REAL,
    "is_net_metered" BOOLEAN NOT NULL DEFAULT false,
    "solar_capacity_kw" REAL,
    "dt_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "elec_conn_detail_dt_id_fkey" FOREIGN KEY ("dt_id") REFERENCES "distribution_transformer" ("dt_id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "elec_conn_detail_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "service_connection" ("connection_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "water_conn_detail" (
    "connection_id" TEXT NOT NULL PRIMARY KEY,
    "pipe_size_mm" REAL,
    "supply_zone_id" TEXT,
    "meter_type" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "water_conn_detail_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "service_connection" ("connection_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "water_conn_detail_supply_zone_id_fkey" FOREIGN KEY ("supply_zone_id") REFERENCES "supply_zone" ("supply_zone_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "supply_zone" (
    "supply_zone_id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "utility_type" TEXT NOT NULL DEFAULT 'WATER',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "bulk_meter_read" (
    "read_id" TEXT NOT NULL PRIMARY KEY,
    "supply_zone_id" TEXT NOT NULL,
    "read_date" DATETIME NOT NULL,
    "value_scm" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'FINAL',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bulk_meter_read_supply_zone_id_fkey" FOREIGN KEY ("supply_zone_id") REFERENCES "supply_zone" ("supply_zone_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pressure_band" (
    "band_id" TEXT NOT NULL PRIMARY KEY,
    "band_name" TEXT NOT NULL,
    "min_pressure" REAL NOT NULL,
    "max_pressure" REAL NOT NULL,
    "usage_class" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "rate_plan" (
    "rate_plan_id" TEXT NOT NULL PRIMARY KEY,
    "plan_name" TEXT NOT NULL,
    "utility_type" TEXT NOT NULL,
    "effective_from" DATETIME NOT NULL,
    "effective_to" DATETIME,
    "billing_freq" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "segment_id" TEXT NOT NULL,
    CONSTRAINT "rate_plan_segment_id_fkey" FOREIGN KEY ("segment_id") REFERENCES "consumer_segment" ("segment_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "charge_component" (
    "component_id" TEXT NOT NULL PRIMARY KEY,
    "component_name" TEXT NOT NULL,
    "component_type" TEXT NOT NULL,
    "uom" TEXT,
    "rate" REAL NOT NULL,
    "posting_class" TEXT,
    "slab_from" INTEGER,
    "slab_to" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "rate_plan_id" TEXT NOT NULL,
    CONSTRAINT "charge_component_rate_plan_id_fkey" FOREIGN KEY ("rate_plan_id") REFERENCES "rate_plan" ("rate_plan_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tax_master" (
    "tax_id" TEXT NOT NULL PRIMARY KEY,
    "tax_name" TEXT NOT NULL,
    "jurisdiction" TEXT NOT NULL,
    "tax_rate" REAL NOT NULL,
    "applicability" TEXT NOT NULL,
    "effective_from" DATETIME NOT NULL,
    "effective_to" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "bill_cycle" (
    "cycle_id" TEXT NOT NULL PRIMARY KEY,
    "cycle_name" TEXT NOT NULL,
    "read_date_rule" TEXT NOT NULL,
    "bill_date_rule" TEXT NOT NULL,
    "due_date_rule" TEXT NOT NULL,
    "grace_days" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "bill" (
    "bill_id" TEXT NOT NULL PRIMARY KEY,
    "bill_date" DATETIME NOT NULL,
    "due_date" DATETIME NOT NULL,
    "net_amount" REAL NOT NULL,
    "tax_amount" REAL NOT NULL,
    "total_amount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "account_id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "cycle_id" TEXT NOT NULL,
    CONSTRAINT "bill_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "bill_cycle" ("cycle_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "bill_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "service_connection" ("connection_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "bill_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account" ("account_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bill_line" (
    "line_id" TEXT NOT NULL PRIMARY KEY,
    "description" TEXT,
    "quantity" REAL NOT NULL,
    "rate" REAL NOT NULL,
    "amount" REAL NOT NULL,
    "line_type" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "bill_id" TEXT NOT NULL,
    "component_id" TEXT NOT NULL,
    CONSTRAINT "bill_line_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "charge_component" ("component_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "bill_line_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "bill" ("bill_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "payment_channel" (
    "channel_id" TEXT NOT NULL PRIMARY KEY,
    "channel_name" TEXT NOT NULL,
    "channel_type" TEXT NOT NULL,
    "provider" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "payment_gateway" (
    "gateway_id" TEXT NOT NULL PRIMARY KEY,
    "provider" TEXT NOT NULL,
    "merchant_id" TEXT NOT NULL,
    "callback_url" TEXT NOT NULL,
    "environment" TEXT NOT NULL DEFAULT 'SANDBOX',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "payment_order" (
    "order_id" TEXT NOT NULL PRIMARY KEY,
    "amount" REAL NOT NULL,
    "convenience_fee" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'INITIATED',
    "initiated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "bill_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "gateway_id" TEXT NOT NULL,
    CONSTRAINT "payment_order_gateway_id_fkey" FOREIGN KEY ("gateway_id") REFERENCES "payment_gateway" ("gateway_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "payment_order_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "payment_channel" ("channel_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "payment_order_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account" ("account_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "payment_order_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "bill" ("bill_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "gateway_txn" (
    "txn_id" TEXT NOT NULL PRIMARY KEY,
    "gateway_ref" TEXT,
    "gateway_status" TEXT NOT NULL,
    "response_at" DATETIME,
    "settled_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "order_id" TEXT NOT NULL,
    "settlement_id" TEXT,
    CONSTRAINT "gateway_txn_settlement_id_fkey" FOREIGN KEY ("settlement_id") REFERENCES "settlement" ("settlement_id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "gateway_txn_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "payment_order" ("order_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "settlement" (
    "settlement_id" TEXT NOT NULL PRIMARY KEY,
    "settlement_date" DATETIME NOT NULL,
    "gross_amount" REAL NOT NULL,
    "net_amount" REAL NOT NULL,
    "matched_count" INTEGER NOT NULL DEFAULT 0,
    "exception_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "gateway_id" TEXT NOT NULL,
    CONSTRAINT "settlement_gateway_id_fkey" FOREIGN KEY ("gateway_id") REFERENCES "payment_gateway" ("gateway_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "refund" (
    "refund_id" TEXT NOT NULL PRIMARY KEY,
    "reason_code" TEXT,
    "amount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'INITIATED',
    "initiated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "order_id" TEXT NOT NULL,
    CONSTRAINT "refund_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "payment_order" ("order_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "suspense_record" (
    "suspense_id" TEXT NOT NULL PRIMARY KEY,
    "reason" TEXT,
    "amount" REAL NOT NULL,
    "resolution_status" TEXT NOT NULL DEFAULT 'OPEN',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "txn_id" TEXT NOT NULL,
    CONSTRAINT "suspense_record_txn_id_fkey" FOREIGN KEY ("txn_id") REFERENCES "gateway_txn" ("txn_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "cgd_area" (
    "area_id" TEXT NOT NULL PRIMARY KEY,
    "area_name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zone" TEXT,
    "utility_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "route" (
    "route_id" TEXT NOT NULL PRIMARY KEY,
    "route_name" TEXT NOT NULL,
    "cycle_group" TEXT,
    "reader_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "area_id" TEXT NOT NULL,
    CONSTRAINT "route_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "cgd_area" ("area_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "meter" (
    "meter_id" TEXT NOT NULL PRIMARY KEY,
    "serial_no" TEXT NOT NULL,
    "meter_type" TEXT NOT NULL,
    "make" TEXT,
    "model" TEXT,
    "uom" TEXT,
    "utility_type" TEXT NOT NULL,
    "calibration_due" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "meter_installation" (
    "install_id" TEXT NOT NULL PRIMARY KEY,
    "install_date" DATETIME NOT NULL,
    "remove_date" DATETIME,
    "seal_no" TEXT,
    "reason" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "meter_id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    CONSTRAINT "meter_installation_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "service_connection" ("connection_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "meter_installation_meter_id_fkey" FOREIGN KEY ("meter_id") REFERENCES "meter" ("meter_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "meter_reading" (
    "reading_id" TEXT NOT NULL PRIMARY KEY,
    "reading_date" DATETIME NOT NULL,
    "reading_value" REAL NOT NULL,
    "consumption" REAL NOT NULL,
    "kvah" REAL,
    "max_demand" REAL,
    "reading_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "meter_id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "route_id" TEXT NOT NULL,
    CONSTRAINT "meter_reading_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "route" ("route_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "meter_reading_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "service_connection" ("connection_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "meter_reading_meter_id_fkey" FOREIGN KEY ("meter_id") REFERENCES "meter" ("meter_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "cng_station" (
    "station_id" TEXT NOT NULL PRIMARY KEY,
    "station_name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "compressor_type" TEXT,
    "dispenser_count" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "area_id" TEXT NOT NULL,
    CONSTRAINT "cng_station_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "cgd_area" ("area_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "vehicle_category" (
    "category_id" TEXT NOT NULL PRIMARY KEY,
    "category_name" TEXT NOT NULL,
    "vehicle_type" TEXT NOT NULL,
    "commercial_flag" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "cng_sale" (
    "sale_id" TEXT NOT NULL PRIMARY KEY,
    "sale_date" DATETIME NOT NULL,
    "quantity_scm" REAL NOT NULL,
    "unit_price" REAL NOT NULL,
    "amount" REAL NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "station_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    CONSTRAINT "cng_sale_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "vehicle_category" ("category_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "cng_sale_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "cng_station" ("station_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "app_user" (
    "app_user_id" TEXT NOT NULL PRIMARY KEY,
    "mobile" TEXT NOT NULL,
    "email" TEXT,
    "otp_verified" TEXT NOT NULL DEFAULT 'N',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "registered_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "customer_id" TEXT NOT NULL,
    CONSTRAINT "app_user_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer" ("customer_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "app_device" (
    "device_id" TEXT NOT NULL PRIMARY KEY,
    "os_type" TEXT,
    "app_version" TEXT,
    "push_token" TEXT,
    "device_fingerprint" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "app_user_id" TEXT NOT NULL,
    CONSTRAINT "app_device_app_user_id_fkey" FOREIGN KEY ("app_user_id") REFERENCES "app_user" ("app_user_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "app_account_link" (
    "link_id" TEXT NOT NULL PRIMARY KEY,
    "ownership_type" TEXT,
    "linked_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "app_user_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    CONSTRAINT "app_account_link_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account" ("account_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "app_account_link_app_user_id_fkey" FOREIGN KEY ("app_user_id") REFERENCES "app_user" ("app_user_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "app_session" (
    "session_id" TEXT NOT NULL PRIMARY KEY,
    "started_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" DATETIME,
    "session_status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "app_user_id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    CONSTRAINT "app_session_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "app_device" ("device_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "app_session_app_user_id_fkey" FOREIGN KEY ("app_user_id") REFERENCES "app_user" ("app_user_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "app_notification" (
    "notif_id" TEXT NOT NULL PRIMARY KEY,
    "message" TEXT,
    "channel" TEXT,
    "sent_at" DATETIME,
    "read_flag" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "app_user_id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    CONSTRAINT "app_notification_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "notif_template" ("template_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "app_notification_app_user_id_fkey" FOREIGN KEY ("app_user_id") REFERENCES "app_user" ("app_user_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notif_template" (
    "template_id" TEXT NOT NULL PRIMARY KEY,
    "channel" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "body_template" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "app_service_request" (
    "request_id" TEXT NOT NULL PRIMARY KEY,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "app_user_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "type_id" TEXT NOT NULL,
    CONSTRAINT "app_service_request_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "service_request_type" ("type_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "app_service_request_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account" ("account_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "app_service_request_app_user_id_fkey" FOREIGN KEY ("app_user_id") REFERENCES "app_user" ("app_user_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "service_request_type" (
    "type_id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "sla_hours" INTEGER NOT NULL DEFAULT 24,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "department" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "api_partner" (
    "partner_id" TEXT NOT NULL PRIMARY KEY,
    "partner_name" TEXT NOT NULL,
    "partner_type" TEXT NOT NULL,
    "contact_email" TEXT,
    "contact_mobile" TEXT,
    "settlement_mode" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "api_credential" (
    "credential_id" TEXT NOT NULL PRIMARY KEY,
    "client_id" TEXT NOT NULL,
    "secret_ref" TEXT,
    "token_expiry" DATETIME,
    "ip_whitelist" TEXT,
    "cert_ref" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "partner_id" TEXT NOT NULL,
    CONSTRAINT "api_credential_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "api_partner" ("partner_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "api_endpoint_catalog" (
    "endpoint_id" TEXT NOT NULL PRIMARY KEY,
    "endpoint_code" TEXT NOT NULL,
    "operation_type" TEXT NOT NULL,
    "request_method" TEXT NOT NULL,
    "auth_type" TEXT NOT NULL,
    "sync_flag" BOOLEAN NOT NULL DEFAULT true,
    "version" TEXT NOT NULL DEFAULT 'v1',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "api_endpoint_mapping" (
    "mapping_id" TEXT NOT NULL PRIMARY KEY,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "effective_from" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "partner_id" TEXT NOT NULL,
    "endpoint_id" TEXT NOT NULL,
    CONSTRAINT "api_endpoint_mapping_endpoint_id_fkey" FOREIGN KEY ("endpoint_id") REFERENCES "api_endpoint_catalog" ("endpoint_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "api_endpoint_mapping_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "api_partner" ("partner_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "api_transaction" (
    "api_txn_id" TEXT NOT NULL PRIMARY KEY,
    "request_time" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "response_ms" INTEGER,
    "status_code" TEXT,
    "payload_ref" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "partner_id" TEXT NOT NULL,
    "endpoint_id" TEXT NOT NULL,
    "error_code" TEXT,
    CONSTRAINT "api_transaction_error_code_fkey" FOREIGN KEY ("error_code") REFERENCES "api_error_code" ("error_code") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "api_transaction_endpoint_id_fkey" FOREIGN KEY ("endpoint_id") REFERENCES "api_endpoint_catalog" ("endpoint_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "api_transaction_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "api_partner" ("partner_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "webhook_subscription" (
    "webhook_id" TEXT NOT NULL PRIMARY KEY,
    "event_type" TEXT NOT NULL,
    "target_url" TEXT NOT NULL,
    "signature_method" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 3,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "partner_id" TEXT NOT NULL,
    CONSTRAINT "webhook_subscription_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "api_partner" ("partner_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "api_rate_limit" (
    "limit_id" TEXT NOT NULL PRIMARY KEY,
    "requests_per_min" INTEGER NOT NULL,
    "burst_limit" INTEGER NOT NULL,
    "timeout_ms" INTEGER NOT NULL DEFAULT 5000,
    "retry_policy" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "partner_id" TEXT NOT NULL,
    CONSTRAINT "api_rate_limit_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "api_partner" ("partner_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "api_error_code" (
    "error_code" TEXT NOT NULL PRIMARY KEY,
    "http_status" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "retryable" BOOLEAN NOT NULL DEFAULT false,
    "category" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "utility_config" (
    "config_id" TEXT NOT NULL PRIMARY KEY DEFAULT 'SYSTEM_DEFAULT',
    "utility_name" TEXT NOT NULL,
    "prorationMode" TEXT NOT NULL DEFAULT 'IMMEDIATE',
    "minBillingMode" TEXT NOT NULL DEFAULT 'FIXED',
    "minBillingValue" REAL NOT NULL DEFAULT 0.0,
    "default_sla_hours" INTEGER NOT NULL DEFAULT 24,
    "maintenance_email" TEXT,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "service_ticket" (
    "ticket_id" TEXT NOT NULL PRIMARY KEY,
    "subject" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "category" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "closed_at" DATETIME,
    "account_id" TEXT NOT NULL,
    "outage_id" TEXT,
    CONSTRAINT "service_ticket_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account" ("account_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "service_ticket_outage_id_fkey" FOREIGN KEY ("outage_id") REFERENCES "outage_event" ("outage_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "outage_event" (
    "outage_id" TEXT NOT NULL PRIMARY KEY,
    "area" TEXT NOT NULL,
    "feeder_id" TEXT,
    "type" TEXT NOT NULL DEFAULT 'FORCED',
    "start_at" DATETIME NOT NULL,
    "est_restore" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "outage_event_feeder_id_fkey" FOREIGN KEY ("feeder_id") REFERENCES "feeder" ("feeder_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "work_order" (
    "work_order_id" TEXT NOT NULL PRIMARY KEY,
    "ticket_id" TEXT,
    "technician_id" TEXT,
    "asset_id" TEXT,
    "type" TEXT NOT NULL DEFAULT 'SERVICE_RESTORATION',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "scheduled_date" DATETIME,
    "started_at" DATETIME,
    "completed_at" DATETIME,
    "inspection_notes" TEXT,
    "resolution_notes" TEXT,
    "gps_lat" REAL,
    "gps_lon" REAL,
    "checklist" TEXT,
    "materials" TEXT,
    "photos" TEXT,
    "signature" TEXT,
    "unattended_reason" TEXT,
    CONSTRAINT "work_order_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "service_ticket" ("ticket_id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "work_order_technician_id_fkey" FOREIGN KEY ("technician_id") REFERENCES "technician" ("technician_id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "work_order_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "asset" ("asset_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "technician" (
    "technician_id" TEXT NOT NULL PRIMARY KEY,
    "full_name" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "pincode_scope" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "inventory_item" (
    "item_id" TEXT NOT NULL PRIMARY KEY,
    "item_code" TEXT,
    "item_name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "uom" TEXT,
    "min_level" REAL NOT NULL DEFAULT 10,
    "unit_cost" REAL NOT NULL DEFAULT 0.0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "inventory_location" (
    "location_id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'WAREHOUSE',
    "technician_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "inventory_location_technician_id_fkey" FOREIGN KEY ("technician_id") REFERENCES "technician" ("technician_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "inventory_stock" (
    "item_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "quantity" REAL NOT NULL DEFAULT 0,

    PRIMARY KEY ("item_id", "location_id"),
    CONSTRAINT "inventory_stock_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "inventory_item" ("item_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "inventory_stock_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "inventory_location" ("location_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "inventory_transfer" (
    "transfer_id" TEXT NOT NULL PRIMARY KEY,
    "item_id" TEXT NOT NULL,
    "from_location_id" TEXT NOT NULL,
    "to_location_id" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "inventory_transfer_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "inventory_item" ("item_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "inventory_transfer_from_location_id_fkey" FOREIGN KEY ("from_location_id") REFERENCES "inventory_location" ("location_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "inventory_transfer_to_location_id_fkey" FOREIGN KEY ("to_location_id") REFERENCES "inventory_location" ("location_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "work_order_spare" (
    "usage_id" TEXT NOT NULL PRIMARY KEY,
    "work_order_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "work_order_spare_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_order" ("work_order_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "work_order_spare_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "inventory_item" ("item_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "asset" (
    "asset_id" TEXT NOT NULL PRIMARY KEY,
    "asset_code" TEXT,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "health_status" TEXT NOT NULL DEFAULT 'GOOD',
    "last_maint_date" DATETIME,
    "next_maint_date" DATETIME,
    "ytd_failures" INTEGER NOT NULL DEFAULT 0,
    "feeder_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "asset_feeder_id_fkey" FOREIGN KEY ("feeder_id") REFERENCES "feeder" ("feeder_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "maintenance_activity" (
    "activity_id" TEXT NOT NULL PRIMARY KEY,
    "asset_id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'PREVENTIVE',
    "description" TEXT,
    "performed_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "health_update" TEXT,
    CONSTRAINT "maintenance_activity_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "asset" ("asset_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sub_station" (
    "sub_station_id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "voltage_level" TEXT NOT NULL,
    "area_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "feeder" (
    "feeder_id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "sub_station_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "feeder_sub_station_id_fkey" FOREIGN KEY ("sub_station_id") REFERENCES "sub_station" ("sub_station_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "distribution_transformer" (
    "dt_id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "feeder_id" TEXT NOT NULL,
    "capacity_kva" REAL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "distribution_transformer_feeder_id_fkey" FOREIGN KEY ("feeder_id") REFERENCES "feeder" ("feeder_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tod_slot" (
    "slot_id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "rateModifier" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "meter_interval_read" (
    "interval_id" TEXT NOT NULL PRIMARY KEY,
    "meter_id" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL,
    "kwh_import" REAL NOT NULL DEFAULT 0,
    "kwh_export" REAL NOT NULL DEFAULT 0,
    "kvah" REAL NOT NULL DEFAULT 0,
    "kvarh" REAL NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "meter_interval_read_meter_id_fkey" FOREIGN KEY ("meter_id") REFERENCES "meter" ("meter_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "net_metering_credit" (
    "credit_id" TEXT NOT NULL PRIMARY KEY,
    "account_id" TEXT NOT NULL,
    "bill_id" TEXT,
    "credit_kwh" REAL NOT NULL,
    "carry_forward" BOOLEAN NOT NULL DEFAULT true,
    "expiry_date" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "net_metering_credit_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account" ("account_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "net_metering_credit_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "bill" ("bill_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "dunning_level" (
    "level_id" TEXT NOT NULL PRIMARY KEY,
    "levelName" TEXT NOT NULL,
    "days_overdue" INTEGER NOT NULL,
    "penalty_fee" REAL NOT NULL DEFAULT 0,
    "action_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "dunning_notice" (
    "notice_id" TEXT NOT NULL PRIMARY KEY,
    "account_id" TEXT NOT NULL,
    "bill_id" TEXT NOT NULL,
    "level_id" TEXT NOT NULL,
    "issued_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'ISSUED',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "dunning_notice_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account" ("account_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "dunning_notice_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "bill" ("bill_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "dunning_notice_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "dunning_level" ("level_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "security_deposit" (
    "deposit_id" TEXT NOT NULL PRIMARY KEY,
    "account_id" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "payment_date" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "refund_date" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "security_deposit_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account" ("account_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "budget_billing_plan" (
    "plan_id" TEXT NOT NULL PRIMARY KEY,
    "account_id" TEXT NOT NULL,
    "monthly_amount" REAL NOT NULL,
    "start_date" DATETIME NOT NULL,
    "end_date" DATETIME,
    "reconciliation_month" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "budget_billing_plan_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account" ("account_id") ON DELETE RESTRICT ON UPDATE CASCADE
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
CREATE UNIQUE INDEX "inventory_location_technician_id_key" ON "inventory_location"("technician_id");

-- CreateIndex
CREATE UNIQUE INDEX "asset_asset_code_key" ON "asset"("asset_code");

-- CreateIndex
CREATE INDEX "meter_interval_read_meter_id_timestamp_idx" ON "meter_interval_read"("meter_id", "timestamp");
