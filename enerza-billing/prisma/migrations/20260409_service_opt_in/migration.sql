-- Migration: Add service_opt_in table for BR-009 opt-in/opt-out tracking
-- Date: 2026-04-09

CREATE TABLE IF NOT EXISTS service_opt_in (
  opt_in_id       VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  account_id      VARCHAR NOT NULL REFERENCES account(account_id),
  program_type    VARCHAR NOT NULL,  -- PREPAID, BUDGET_BILLING, TOU_TARIFF, NET_METERING, SMART_METER
  status          VARCHAR NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE, OPTED_OUT
  effective_date  TIMESTAMP NOT NULL DEFAULT NOW(),
  opt_out_date    TIMESTAMP,
  notes           TEXT,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_opt_in_account ON service_opt_in(account_id);
CREATE INDEX IF NOT EXISTS idx_service_opt_in_program ON service_opt_in(program_type, status);
