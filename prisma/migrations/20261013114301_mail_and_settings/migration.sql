-- CreateEnum
CREATE TYPE "MailDirection" AS ENUM ('inbound', 'outbound');

-- CreateEnum
CREATE TYPE "MailCategory" AS ENUM ('received', 'compose', 'reply', 'auto_reply', 'account', 'test');

-- CreateEnum
CREATE TYPE "MailStatus" AS ENUM ('received', 'sent', 'failed');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "signature" JSONB;

-- CreateTable
CREATE TABLE "settings" (
    "key" VARCHAR(60) NOT NULL,
    "value" JSONB NOT NULL,
    "updated_by_id" UUID,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "mail_threads" (
    "id" UUID NOT NULL,
    "subject" VARCHAR(300) NOT NULL,
    "normalized_subject" VARCHAR(300) NOT NULL,
    "contact_email" VARCHAR(254) NOT NULL,
    "contact_name" VARCHAR(160),
    "lead_id" UUID,
    "archived_at" TIMESTAMPTZ,
    "last_message_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mail_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mail_messages" (
    "id" UUID NOT NULL,
    "thread_id" UUID NOT NULL,
    "direction" "MailDirection" NOT NULL,
    "category" "MailCategory" NOT NULL,
    "status" "MailStatus" NOT NULL,
    "from_address" VARCHAR(254) NOT NULL,
    "from_name" VARCHAR(200),
    "to" TEXT[],
    "cc" TEXT[],
    "subject" VARCHAR(300) NOT NULL,
    "text" TEXT,
    "html" TEXT,
    "message_id" VARCHAR(300),
    "in_reply_to" VARCHAR(300),
    "references" TEXT[],
    "resend_id" VARCHAR(64),
    "attachments" JSONB,
    "error" VARCHAR(300),
    "sent_by_id" UUID,
    "read_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mail_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mail_threads_last_message_at_idx" ON "mail_threads"("last_message_at");

-- CreateIndex
CREATE INDEX "mail_threads_contact_email_normalized_subject_idx" ON "mail_threads"("contact_email", "normalized_subject");

-- CreateIndex
CREATE UNIQUE INDEX "mail_messages_message_id_key" ON "mail_messages"("message_id");

-- CreateIndex
CREATE UNIQUE INDEX "mail_messages_resend_id_key" ON "mail_messages"("resend_id");

-- CreateIndex
CREATE INDEX "mail_messages_thread_id_created_at_idx" ON "mail_messages"("thread_id", "created_at");

-- CreateIndex
CREATE INDEX "mail_messages_direction_read_at_idx" ON "mail_messages"("direction", "read_at");

-- AddForeignKey
ALTER TABLE "settings" ADD CONSTRAINT "settings_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail_threads" ADD CONSTRAINT "mail_threads_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail_messages" ADD CONSTRAINT "mail_messages_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "mail_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail_messages" ADD CONSTRAINT "mail_messages_sent_by_id_fkey" FOREIGN KEY ("sent_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
