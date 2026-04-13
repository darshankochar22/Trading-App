-- CreateTable
CREATE TABLE "SipPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "fundCode" TEXT NOT NULL,
    "fundName" TEXT NOT NULL,
    "monthlyAmount" REAL NOT NULL,
    "expectedAnnualReturn" REAL NOT NULL,
    "dayOfMonth" INTEGER NOT NULL,
    "startDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SipPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "SipPlan_userId_status_idx" ON "SipPlan"("userId", "status");
