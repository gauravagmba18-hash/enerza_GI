-- AlterTable
ALTER TABLE "work_order" ADD COLUMN     "approval_status" TEXT,
ADD COLUMN     "approved_at" TIMESTAMP(3),
ADD COLUMN     "rejection_reason" TEXT,
ADD COLUMN     "request_id" TEXT;

-- AddForeignKey
ALTER TABLE "work_order" ADD CONSTRAINT "work_order_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "service_request"("request_id") ON DELETE SET NULL ON UPDATE CASCADE;
