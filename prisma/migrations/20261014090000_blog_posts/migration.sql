-- CreateTable
CREATE TABLE "blog_posts" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "excerpt" VARCHAR(320) NOT NULL,
    "category" VARCHAR(60) NOT NULL,
    "body" TEXT NOT NULL,
    "author" VARCHAR(120) NOT NULL,
    "seo_title" VARCHAR(70) NOT NULL,
    "seo_description" VARCHAR(170) NOT NULL,
    "cta_label" VARCHAR(80) NOT NULL,
    "cta_href" VARCHAR(200) NOT NULL,
    "image_src" VARCHAR(200),
    "image_alt" VARCHAR(200) NOT NULL,
    "image" BYTEA,
    "image_type" VARCHAR(20),
    "image_updated_at" TIMESTAMPTZ,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "published_at" DATE,
    "created_by_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "blog_posts_slug_key" ON "blog_posts"("slug");

-- CreateIndex
CREATE INDEX "blog_posts_published_published_at_idx" ON "blog_posts"("published", "published_at");

-- AddForeignKey
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

