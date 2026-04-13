/*
  Warnings:

  - The primary key for the `service_opt_in` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Made the column `years_of_experience` on table `technician` required. This step will fail if there are existing NULL values in that column.
  - Made the column `clearance_level` on table `technician` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "service_opt_in" DROP CONSTRAINT "service_opt_in_account_id_fkey";

-- DropIndex
DROP INDEX "idx_service_opt_in_account";

-- DropIndex
DROP INDEX "idx_service_opt_in_program";

-- AlterTable
ALTER TABLE "dunning_notice" ADD COLUMN     "ptp_date" TIMESTAMP(3),
ADD COLUMN     "ptp_recorded_by" TEXT,
ADD COLUMN     "ptp_status" TEXT,
ADD COLUMN     "suspended_until" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "security_deposit" ADD COLUMN     "deposit_type" TEXT NOT NULL DEFAULT 'STANDARD',
ADD COLUMN     "interest_rate" DOUBLE PRECISION NOT NULL DEFAULT 7.25;

-- AlterTable
ALTER TABLE "service_opt_in" DROP CONSTRAINT "service_opt_in_pkey",
ALTER COLUMN "opt_in_id" DROP DEFAULT,
ALTER COLUMN "opt_in_id" SET DATA TYPE TEXT,
ALTER COLUMN "account_id" SET DATA TYPE TEXT,
ALTER COLUMN "program_type" SET DATA TYPE TEXT,
ALTER COLUMN "status" SET DATA TYPE TEXT,
ALTER COLUMN "effective_date" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "opt_out_date" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "service_opt_in_pkey" PRIMARY KEY ("opt_in_id");

-- AlterTable
ALTER TABLE "technician" ALTER COLUMN "email" SET DATA TYPE TEXT,
ALTER COLUMN "employee_id" SET DATA TYPE TEXT,
ALTER COLUMN "designation" SET DATA TYPE TEXT,
ALTER COLUMN "years_of_experience" SET NOT NULL,
ALTER COLUMN "clearance_level" SET NOT NULL,
ALTER COLUMN "clearance_level" SET DATA TYPE TEXT,
ALTER COLUMN "date_of_joining" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "safety_training_expiry" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "emergency_contact" SET DATA TYPE TEXT;

-- CreateTable
CREATE TABLE "dispute" (
    "dispute_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "bill_id" TEXT,
    "dispute_type" TEXT NOT NULL,
    "disputed_amount" DOUBLE PRECISION NOT NULL,
    "raised_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "financial_hold" BOOLEAN NOT NULL DEFAULT false,
    "assigned_to" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "resolved_on" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dispute_pkey" PRIMARY KEY ("dispute_id")
);

-- CreateTable
CREATE TABLE "credit_note" (
    "cn_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "dispute_id" TEXT,
    "bill_id" TEXT,
    "reason" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "issued_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "applied_to_bill_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credit_note_pkey" PRIMARY KEY ("cn_id")
);

-- CreateIndex
CREATE INDEX "dispute_account_id_idx" ON "dispute"("account_id");

-- CreateIndex
CREATE INDEX "dispute_status_idx" ON "dispute"("status");

-- CreateIndex
CREATE INDEX "credit_note_account_id_idx" ON "credit_note"("account_id");

-- AddForeignKey
ALTER TABLE "dispute" ADD CONSTRAINT "dispute_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute" ADD CONSTRAINT "dispute_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "bill"("bill_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_note" ADD CONSTRAINT "credit_note_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_note" ADD CONSTRAINT "credit_note_dispute_id_fkey" FOREIGN KEY ("dispute_id") REFERENCES "dispute"("dispute_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_opt_in" ADD CONSTRAINT "service_opt_in_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;
