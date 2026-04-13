#!/usr/bin/env python3
"""
Convert BFS Enerza seed SQL to Prisma-compatible PostgreSQL format.
Handles table renames, column filtering, and synthetic column injection.
"""

import re, sys

INPUT  = '/home/claude/seed_data.sql'
OUTPUT = '/home/claude/seed_converted.sql'

# ── Tables to skip entirely ──────────────────────────────────────────────────
SKIP = {
    'system_users',     # no Prisma model
    'grid_zones',       # no Prisma model
    'audit_log',        # no Prisma model
    'bill_lines',       # component_id/quantity are NOT NULL but SQL has NULLs
    'suspense_records', # all txn_id are NULL (violates NOT NULL + UNIQUE)
}

# ── SQL table → Prisma table name ────────────────────────────────────────────
TABLE_MAP = {
    'cgd_areas':              'cgd_area',
    'consumer_segments':      'consumer_segment',
    'routes':                 'route',
    'water_supply_zones':     'supply_zone',
    'pressure_bands':         'pressure_band',
    'bill_cycles':            'bill_cycle',
    'rate_plans':             'rate_plan',
    'charge_components':      'charge_component',
    'payment_channels':       'payment_channel',
    'payment_gateways':       'payment_gateway',
    'vehicle_categories':     'vehicle_category',
    'cng_stations':           'cng_station',
    'notif_templates':        'notif_template',
    'service_request_types':  'service_request_type',
    'api_partners':           'api_partner',
    'api_credentials':        'api_credential',
    'api_endpoint_mappings':  'api_endpoint_mapping',
    'api_rate_limits':        'api_rate_limit',
    'api_error_codes':        'api_error_code',
    'webhook_subscriptions':  'webhook_subscription',
    'customers':              'customer',
    'premises':               'premise',
    'accounts':               'account',
    'service_connections':    'service_connection',
    'gas_conn_details':       'gas_conn_detail',
    'elec_conn_details':      'elec_conn_detail',
    'water_conn_details':     'water_conn_detail',
    'meters':                 'meter',
    'meter_installations':    'meter_installation',
    'meter_readings':         'meter_reading',
    'cng_sales':              'cng_sale',
    'bills':                  'bill',
    'payment_orders':         'payment_order',
    'gateway_txns':           'gateway_txn',
    'settlements':            'settlement',
    'suspense_records':       'suspense_record',
    'refunds':                'refund',
    'app_users':              'app_user',
    'app_devices':            'app_device',
    'app_account_links':      'app_account_link',
    'app_sessions':           'app_session',
    'app_notifications':      'app_notification',
    'app_service_requests':   'app_service_request',
    'api_transactions':       'api_transaction',
    # Same name tables
    'tax_master':             'tax_master',
    'api_endpoint_catalog':   'api_endpoint_catalog',
}

# ── Allowed columns per TARGET table (from actual DB schema) ─────────────────
ALLOWED = {
    'account':               {'account_id','customer_id','premise_id','cycle_id','bill_delivery_mode','status','effective_from'},
    'api_credential':        {'credential_id','partner_id','client_id','secret_ref','token_expiry','ip_whitelist','cert_ref'},
    'api_endpoint_catalog':  {'endpoint_id','endpoint_code','operation_type','request_method','auth_type','sync_flag','version'},
    'api_endpoint_mapping':  {'mapping_id','partner_id','endpoint_id','enabled','effective_from'},
    'api_error_code':        {'error_code','http_status','message','retryable','category'},
    'api_partner':           {'partner_id','partner_name','partner_type','contact_email','contact_mobile','settlement_mode','status'},
    'api_rate_limit':        {'limit_id','partner_id','requests_per_min','burst_limit','timeout_ms','retry_policy'},
    'api_transaction':       {'api_txn_id','partner_id','endpoint_id','request_time','response_ms','status_code','error_code','payload_ref'},
    'app_account_link':      {'link_id','app_user_id','account_id','ownership_type','linked_at'},
    'app_device':            {'device_id','app_user_id','os_type','app_version','push_token','device_fingerprint','active'},
    'app_notification':      {'notif_id','app_user_id','template_id','message','channel','sent_at','read_flag'},
    'app_service_request':   {'request_id','app_user_id','account_id','type_id','description','status'},
    'app_session':           {'session_id','app_user_id','device_id','started_at','ended_at','session_status'},
    'app_user':              {'app_user_id','customer_id','mobile','email','otp_verified','status','registered_at'},
    'bill':                  {'bill_id','account_id','connection_id','cycle_id','bill_date','due_date','net_amount','tax_amount','total_amount','status'},
    'bill_cycle':            {'cycle_id','cycle_name','read_date_rule','bill_date_rule','due_date_rule','grace_days','status'},
    'cgd_area':              {'area_id','area_name','city','district','state','zone','utility_type','status'},
    'charge_component':      {'component_id','rate_plan_id','component_name','component_type','uom','rate','posting_class','slab_from','slab_to'},
    'cng_sale':              {'sale_id','station_id','category_id','sale_date','quantity_scm','unit_price','amount'},
    'cng_station':           {'station_id','station_name','area_id','city','compressor_type','dispenser_count','status'},
    'consumer_segment':      {'segment_id','segment_name','utility_type','description'},
    # segment_id added synthetically from customer_type
    'customer':              {'customer_id','full_name','customer_type','kyc_status','pan_ref','aadhaar_ref','mobile','email','status','segment_id'},
    'elec_conn_detail':      {'connection_id','load_kw','supply_voltage','phase_type','tariff_category'},
    'gas_conn_detail':       {'connection_id','service_type','pressure_band_id','regulator_serial'},
    'gateway_txn':           {'txn_id','order_id','settlement_id','gateway_ref','gateway_status','response_at','settled_at'},
    'meter':                 {'meter_id','serial_no','meter_type','make','model','uom','utility_type','calibration_due','status'},
    'meter_installation':    {'install_id','meter_id','connection_id','install_date','remove_date','seal_no','reason'},
    'meter_reading':         {'reading_id','meter_id','connection_id','route_id','reading_date','reading_value','consumption','reading_type','status'},
    'notif_template':        {'template_id','channel','event_type','language','body_template','active'},
    'payment_channel':       {'channel_id','channel_name','channel_type','provider','status'},
    'payment_gateway':       {'gateway_id','provider','merchant_id','callback_url','environment','status'},
    'payment_order':         {'order_id','bill_id','account_id','channel_id','gateway_id','amount','convenience_fee','status','initiated_at'},
    'premise':               {'premise_id','address_line1','address_line2','area_id','geo_lat','geo_lon','building_type','status'},
    'pressure_band':         {'band_id','band_name','min_pressure','max_pressure','usage_class'},
    'rate_plan':             {'rate_plan_id','plan_name','utility_type','segment_id','effective_from','effective_to','billing_freq','status'},
    'refund':                {'refund_id','order_id','reason_code','amount','status','initiated_at'},
    'route':                 {'route_id','area_id','route_name','cycle_group','reader_id','status'},
    'service_connection':    {'connection_id','account_id','utility_type','segment_id','start_date','end_date','status'},
    'service_request_type':  {'type_id','category','subcategory','sla_hours','priority','department'},
    'settlement':            {'settlement_id','gateway_id','settlement_date','gross_amount','net_amount','matched_count','exception_count'},
    'supply_zone':           {'supply_zone_id','name','status'},
    'suspense_record':       {'suspense_id','txn_id','reason','amount','resolution_status'},
    'tax_master':            {'tax_id','tax_name','jurisdiction','tax_rate','applicability','effective_from','effective_to'},
    'vehicle_category':      {'category_id','category_name','vehicle_type','commercial_flag','status'},
    'water_conn_detail':     {'connection_id','pipe_size_mm','supply_zone_id','meter_type'},
    'webhook_subscription':  {'webhook_id','partner_id','event_type','target_url','signature_method','retry_count','active'},
}

# ── Column renames: (source_sql_table, src_col) → target_col ─────────────────
COL_RENAMES = {
    ('water_supply_zones', 'zone_name'): 'name',
}

# ── Tables that need updated_at injected (Prisma @updatedAt — no DB default) ──
# All tables in ALLOWED need it (verified from DB schema)
NEEDS_UPDATED_AT = set(ALLOWED.keys())

# ── Synthetic columns: added to rows based on other column values ─────────────
# customer.segment_id derived from customer_type
CUSTOMER_SEGMENT_MAP = {
    "'Individual'":  "'SEG-006'",
    "'Commercial'":  "'SEG-007'",
    "'Industrial'":  "'SEG-008'",
}
CUSTOMER_SEGMENT_DEFAULT = "'SEG-006'"


def parse_values(line: str) -> list[str]:
    """Parse a SQL values row like  ('a', 'b', NULL, 3.14), into tokens."""
    # Strip leading whitespace, the opening paren, trailing comma/paren
    s = line.strip()
    if s.endswith(','):
        s = s[:-1]
    if s.endswith(')'):
        s = s[:-1]
    if s.startswith('('):
        s = s[1:]

    tokens = []
    cur = []
    in_str = False
    i = 0
    while i < len(s):
        c = s[i]
        if in_str:
            cur.append(c)
            if c == "'":
                # Check for escaped quote ''
                if i + 1 < len(s) and s[i+1] == "'":
                    cur.append("'")
                    i += 2
                    continue
                else:
                    in_str = False
        else:
            if c == "'":
                in_str = True
                cur.append(c)
            elif c == ',':
                tokens.append(''.join(cur).strip())
                cur = []
                i += 1
                continue
            else:
                cur.append(c)
        i += 1

    if cur or tokens:
        tokens.append(''.join(cur).strip())
    return tokens


def filter_row(src_cols: list, tokens: list, keep_indices: list,
               target_table: str, src_table: str,
               synthetic_col: str | None, synthetic_from_idx: int | None,
               add_updated_at: bool = False) -> str | None:
    """Return filtered SQL value tuple, or None to skip."""
    if len(tokens) != len(src_cols):
        # Malformed row — skip
        return None

    vals = [tokens[i] for i in keep_indices]

    # Add synthetic segment_id for customer table
    if target_table == 'customer' and synthetic_col == 'segment_id':
        ctype = tokens[synthetic_from_idx] if synthetic_from_idx is not None else ''
        seg = CUSTOMER_SEGMENT_MAP.get(ctype, CUSTOMER_SEGMENT_DEFAULT)
        vals.append(seg)

    # Fix generator bug: meter_installation.install_date has segment_id instead of a date
    # install_date is at index 3 in the filtered vals (install_id, meter_id, connection_id, install_date, ...)
    if target_table == 'meter_installation' and len(vals) > 3:
        if not re.match(r"'\d{4}-\d{2}-\d{2}'", vals[3]):
            vals[3] = "'2020-01-01'"

    # Inject updated_at
    if add_updated_at:
        vals.append('CURRENT_TIMESTAMP')

    return '  (' + ', '.join(vals) + ')'


def main():
    insert_re = re.compile(
        r'^INSERT INTO (\w+)\s*\(([^)]+)\)\s*VALUES\s*$',
        re.IGNORECASE
    )

    stats = {}
    skipped_tables = set()

    with open(INPUT, 'r', encoding='utf-8') as fin, \
         open(OUTPUT, 'w', encoding='utf-8') as fout:

        fout.write("-- Converted BFS Enerza seed data for Prisma PostgreSQL\n")
        fout.write("-- Each INSERT is its own auto-commit (no global transaction)\n")
        fout.write("SET session_replication_role = replica;\n\n")

        current_target  = None
        current_src     = None
        src_cols        = []
        keep_indices    = []
        out_cols        = []
        synthetic_col   = None
        syn_from_idx    = None
        add_updated_at  = False
        in_block        = False
        rows_buf        = []
        rows_written    = 0

        def flush_block():
            nonlocal rows_written
            if not rows_buf or current_target is None:
                return
            fout.write(f"INSERT INTO {current_target} ({', '.join(out_cols)}) VALUES\n")
            for j, row in enumerate(rows_buf):
                sep = ',\n' if j < len(rows_buf) - 1 else '\n'
                fout.write(row + sep)
            fout.write("ON CONFLICT DO NOTHING;\n\n")
            rows_written += len(rows_buf)
            stats[current_target] = stats.get(current_target, 0) + len(rows_buf)
            rows_buf.clear()

        for raw in fin:
            line = raw.rstrip('\n')

            # Section comments / header lines — pass through (outside blocks)
            if not in_block and (line.startswith('--') or line.strip() == ''):
                fout.write(line + '\n')
                continue

            # Detect new INSERT statement
            m = insert_re.match(line)
            if m:
                flush_block()
                in_block = False

                src_table = m.group(1)
                raw_cols  = [c.strip() for c in m.group(2).split(',')]

                if src_table in SKIP:
                    current_target = None
                    current_src    = src_table
                    skipped_tables.add(src_table)
                    in_block = True
                    rows_buf.clear()
                    continue

                target = TABLE_MAP.get(src_table, src_table)
                allowed = ALLOWED.get(target)

                if allowed is None:
                    # Unknown target — skip
                    current_target = None
                    current_src    = src_table
                    skipped_tables.add(src_table)
                    in_block = True
                    rows_buf.clear()
                    continue

                # Build column mapping
                keep_indices = []
                out_cols = []
                synthetic_col = None
                syn_from_idx  = None

                for i, col in enumerate(raw_cols):
                    # Apply column rename
                    renamed = COL_RENAMES.get((src_table, col), col)
                    if renamed in allowed:
                        keep_indices.append(i)
                        out_cols.append(renamed)

                # Handle synthetic segment_id for customer
                if target == 'customer' and 'segment_id' in allowed:
                    synthetic_col = 'segment_id'
                    # Find customer_type column index
                    try:
                        syn_from_idx = raw_cols.index('customer_type')
                    except ValueError:
                        syn_from_idx = None
                    if 'segment_id' not in out_cols:
                        out_cols.append('segment_id')

                # Inject updated_at if needed (Prisma @updatedAt has no DB default)
                add_updated_at = (
                    target in NEEDS_UPDATED_AT
                    and 'updated_at' not in out_cols
                    and 'updated_at' not in raw_cols  # source doesn't provide it
                )
                if add_updated_at:
                    out_cols.append('updated_at')

                current_target   = target
                current_src      = src_table
                src_cols         = raw_cols
                in_block         = True
                rows_buf.clear()
                continue

            # Inside a block — process data rows
            if in_block:
                stripped = line.strip()

                if stripped == 'ON CONFLICT DO NOTHING;':
                    flush_block()
                    in_block = False
                    current_target = None
                    continue

                # Skip empty lines inside blocks
                if not stripped:
                    continue

                # Skip if table is skipped
                if current_target is None:
                    continue

                # Parse and filter row
                tokens = parse_values(stripped)
                row = filter_row(
                    src_cols, tokens, keep_indices,
                    current_target, current_src,
                    synthetic_col, syn_from_idx,
                    add_updated_at
                )
                if row:
                    rows_buf.append(row)
            # (lines outside blocks are handled above)

        flush_block()
        fout.write("\n-- Seed data load complete.\n")
        fout.write("SET session_replication_role = DEFAULT;\n")

    print("=== Conversion complete ===")
    print(f"Output: {OUTPUT}")
    print(f"Skipped tables: {sorted(skipped_tables)}")
    print("\nRows per table:")
    total = 0
    for tbl, cnt in sorted(stats.items()):
        print(f"  {tbl:35s} {cnt:>8,}")
        total += cnt
    print(f"  {'TOTAL':35s} {total:>8,}")


if __name__ == '__main__':
    main()
