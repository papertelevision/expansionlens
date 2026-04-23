-- Add prose fields to SpotlightArticle
ALTER TABLE "SpotlightArticle" ADD COLUMN IF NOT EXISTS "cityContext" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SpotlightArticle" ADD COLUMN IF NOT EXISTS "competitiveText" TEXT NOT NULL DEFAULT '';

-- Create BlogPost table
CREATE TABLE IF NOT EXISTS "BlogPost" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "faqEntries" TEXT NOT NULL DEFAULT '[]',
    "readTime" TEXT NOT NULL DEFAULT '6 min read',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "BlogPost_slug_key" ON "BlogPost"("slug");

-- Create PromoReport table
CREATE TABLE IF NOT EXISTS "PromoReport" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "industry" TEXT NOT NULL DEFAULT 'dental',
    "lat" DOUBLE PRECISION NOT NULL,
    "lon" DOUBLE PRECISION NOT NULL,
    "score" INTEGER NOT NULL,
    "reportData" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PromoReport_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PromoReport_slug_key" ON "PromoReport"("slug");
