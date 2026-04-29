-- CreateTable
CREATE TABLE IF NOT EXISTS "PromoReportView" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "referrer" TEXT,
    "userAgent" TEXT,
    "deviceType" TEXT,
    "ip" TEXT,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromoReportView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PromoReportView_reportId_idx" ON "PromoReportView"("reportId");

-- AddForeignKey
ALTER TABLE "PromoReportView" ADD CONSTRAINT "PromoReportView_reportId_fkey"
    FOREIGN KEY ("reportId") REFERENCES "PromoReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
