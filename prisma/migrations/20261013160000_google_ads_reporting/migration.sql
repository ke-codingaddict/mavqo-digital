-- CreateTable
CREATE TABLE "ads_accounts" (
    "id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "customer_id" VARCHAR(10) NOT NULL,
    "currency_code" VARCHAR(3) NOT NULL DEFAULT 'KES',
    "time_zone" VARCHAR(60),
    "monthly_budget" DECIMAL(14,2),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "last_synced_at" TIMESTAMPTZ,
    "last_sync_error" VARCHAR(500),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "ads_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ads_campaign_days" (
    "account_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "campaign_id" VARCHAR(20) NOT NULL,
    "campaign_name" VARCHAR(255) NOT NULL,
    "campaign_status" VARCHAR(20) NOT NULL,
    "channel_type" VARCHAR(40) NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "cost_micros" BIGINT NOT NULL DEFAULT 0,
    "conversions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "conversions_value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "search_impression_share" DOUBLE PRECISION,
    "budget_lost_share" DOUBLE PRECISION,
    "rank_lost_share" DOUBLE PRECISION,

    CONSTRAINT "ads_campaign_days_pkey" PRIMARY KEY ("account_id","date","campaign_id")
);

-- CreateTable
CREATE TABLE "ads_conversion_days" (
    "account_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "campaign_id" VARCHAR(20) NOT NULL,
    "action_name" VARCHAR(255) NOT NULL,
    "category" VARCHAR(60) NOT NULL,
    "conversions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "value" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "ads_conversion_days_pkey" PRIMARY KEY ("account_id","date","campaign_id","action_name")
);

-- CreateTable
CREATE TABLE "ads_keywords" (
    "account_id" UUID NOT NULL,
    "ad_group_id" VARCHAR(20) NOT NULL,
    "criterion_id" VARCHAR(20) NOT NULL,
    "campaign_name" VARCHAR(255) NOT NULL,
    "ad_group_name" VARCHAR(255) NOT NULL,
    "text" VARCHAR(255) NOT NULL,
    "match_type" VARCHAR(20) NOT NULL,
    "quality_score" INTEGER,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "cost_micros" BIGINT NOT NULL DEFAULT 0,
    "conversions" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "ads_keywords_pkey" PRIMARY KEY ("account_id","ad_group_id","criterion_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ads_accounts_customer_id_key" ON "ads_accounts"("customer_id");

-- AddForeignKey
ALTER TABLE "ads_campaign_days" ADD CONSTRAINT "ads_campaign_days_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "ads_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ads_conversion_days" ADD CONSTRAINT "ads_conversion_days_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "ads_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ads_keywords" ADD CONSTRAINT "ads_keywords_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "ads_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
