-- AlterTable
ALTER TABLE "app_service_request" ADD COLUMN "boq_amount" REAL;
ALTER TABLE "app_service_request" ADD COLUMN "demand_note_status" TEXT DEFAULT 'NOT_GENERATED';
ALTER TABLE "app_service_request" ADD COLUMN "verification_steps" TEXT;
