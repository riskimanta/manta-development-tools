-- CreateTable
CREATE TABLE "WorkProgressSessionSummary" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "summaryMarkdown" TEXT NOT NULL,
    "firstSnapshotId" TEXT,
    "latestSnapshotId" TEXT,
    "branch" TEXT,
    "sessionStartedAt" DATETIME,
    "sessionEndedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkProgressSessionSummary_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "WorkProgressSessionSummary_projectId_idx" ON "WorkProgressSessionSummary"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkProgressSessionSummary_projectId_sessionId_key" ON "WorkProgressSessionSummary"("projectId", "sessionId");
