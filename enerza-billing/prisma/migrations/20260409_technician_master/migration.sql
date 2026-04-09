-- Migration: Add utility master data fields to technician table
-- Date: 2026-04-09
-- BR-038, BR-039, BR-040 — Field technician skill, clearance & certification tracking

ALTER TABLE technician
  ADD COLUMN IF NOT EXISTS email                 VARCHAR,
  ADD COLUMN IF NOT EXISTS employee_id           VARCHAR UNIQUE,
  ADD COLUMN IF NOT EXISTS designation           VARCHAR DEFAULT 'Field Technician',
  ADD COLUMN IF NOT EXISTS years_of_experience   INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS specializations       TEXT,
  ADD COLUMN IF NOT EXISTS certifications        TEXT,
  ADD COLUMN IF NOT EXISTS clearances            TEXT,
  ADD COLUMN IF NOT EXISTS clearance_level       VARCHAR DEFAULT 'LV',
  ADD COLUMN IF NOT EXISTS date_of_joining       DATE,
  ADD COLUMN IF NOT EXISTS safety_training_expiry DATE,
  ADD COLUMN IF NOT EXISTS emergency_contact     VARCHAR;
