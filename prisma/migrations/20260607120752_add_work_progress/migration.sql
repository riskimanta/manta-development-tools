-- CreateTable
CREATE TABLE "WorkProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "branch" TEXT NOT NULL,
    "latestCommitHash" TEXT NOT NULL,
    "latestCommitMessage" TEXT NOT NULL,
    "latestCommitAuthor" TEXT NOT NULL,
    "latestCommitDate" DATETIME NOT NULL,
    "changedFilesJson" TEXT NOT NULL,
    "changedFilesCount" INTEGER NOT NULL,
    "gitStatusText" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkProgress_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "WorkProgress_projectId_idx" ON "WorkProgress"("projectId");

-- CreateIndex
CREATE INDEX "WorkProgress_projectId_createdAt_idx" ON "WorkProgress"("projectId", "createdAt");
