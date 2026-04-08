-- CreateTable
CREATE TABLE "service_request" (
    "request_id" TEXT NOT NULL PRIMARY KEY,
    "customer_id" TEXT,
    "account_id" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "current_step" INTEGER NOT NULL DEFAULT 1,
    "description" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "assigned_to" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "service_request_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer" ("customer_id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "service_request_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account" ("account_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "request_document" (
    "doc_id" TEXT NOT NULL PRIMARY KEY,
    "request_id" TEXT NOT NULL,
    "doc_type" TEXT NOT NULL,
    "doc_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "verified_at" DATETIME,
    CONSTRAINT "request_document_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "service_request" ("request_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "workflow_log" (
    "log_id" TEXT NOT NULL PRIMARY KEY,
    "request_id" TEXT NOT NULL,
    "step_name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "performed_by" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "workflow_log_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "service_request" ("request_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "boq_header" (
    "boq_id" TEXT NOT NULL PRIMARY KEY,
    "request_id" TEXT NOT NULL,
    "total_amount" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PROPOSED',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "boq_header_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "service_request" ("request_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "boq_item" (
    "item_id" TEXT NOT NULL PRIMARY KEY,
    "boq_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "unit_rate" REAL NOT NULL,
    "amount" REAL NOT NULL,
    CONSTRAINT "boq_item_boq_id_fkey" FOREIGN KEY ("boq_id") REFERENCES "boq_header" ("boq_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "demand_note" (
    "note_id" TEXT NOT NULL PRIMARY KEY,
    "request_id" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UNPAID',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "demand_note_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "service_request" ("request_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "complaint_category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT
);

-- CreateTable
CREATE TABLE "complaint_sub_category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sla_hours" INTEGER NOT NULL DEFAULT 24,
    CONSTRAINT "complaint_sub_category_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "complaint_category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "boq_header_request_id_key" ON "boq_header"("request_id");

-- CreateIndex
CREATE UNIQUE INDEX "demand_note_request_id_key" ON "demand_note"("request_id");

-- CreateIndex
CREATE UNIQUE INDEX "complaint_category_name_key" ON "complaint_category"("name");
