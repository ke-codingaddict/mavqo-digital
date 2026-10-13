-- CreateEnum
CREATE TYPE "EnquiryType" AS ENUM ('contact', 'demo', 'quote', 'marketing', 'waitlist');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('new', 'contacted', 'qualified', 'proposal_sent', 'won', 'lost');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'sales');

-- CreateTable
CREATE TABLE "leads" (
    "id" UUID NOT NULL,
    "reference" VARCHAR(16) NOT NULL,
    "enquiry_type" "EnquiryType" NOT NULL,
    "status" "LeadStatus" NOT NULL DEFAULT 'new',
    "name" VARCHAR(160) NOT NULL,
    "email" VARCHAR(254),
    "phone" VARCHAR(40),
    "organization" VARCHAR(200),
    "preferred_contact" VARCHAR(20),
    "product_interest" VARCHAR(80),
    "service_interest" VARCHAR(80),
    "organization_size" VARCHAR(40),
    "website_url" VARCHAR(300),
    "objective" VARCHAR(300),
    "budget_range" VARCHAR(40),
    "timeline" VARCHAR(40),
    "message" TEXT,
    "source_page" VARCHAR(300),
    "referrer" VARCHAR(300),
    "utm_source" VARCHAR(100),
    "utm_medium" VARCHAR(100),
    "utm_campaign" VARCHAR(150),
    "utm_term" VARCHAR(150),
    "utm_content" VARCHAR(150),
    "gclid" VARCHAR(200),
    "ip_hash" VARCHAR(64),
    "consent_given" BOOLEAN NOT NULL DEFAULT false,
    "internal_notes" TEXT,
    "notified_at" TIMESTAMPTZ,
    "first_contacted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'sales',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "failed_logins" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMPTZ,
    "last_login_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actor_id" UUID,
    "action" VARCHAR(60) NOT NULL,
    "entity_type" VARCHAR(40),
    "entity_id" VARCHAR(64),
    "metadata" JSONB,
    "ip_hash" VARCHAR(64),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "leads_reference_key" ON "leads"("reference");

-- CreateIndex
CREATE INDEX "leads_status_created_at_idx" ON "leads"("status", "created_at");

-- CreateIndex
CREATE INDEX "leads_enquiry_type_created_at_idx" ON "leads"("enquiry_type", "created_at");

-- CreateIndex
CREATE INDEX "leads_ip_hash_created_at_idx" ON "leads"("ip_hash", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "audit_logs_action_created_at_idx" ON "audit_logs"("action", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
