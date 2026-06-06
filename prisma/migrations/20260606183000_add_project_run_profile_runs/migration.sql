-- CreateTable
CREATE TABLE "ProjectRunProfileRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "runProfileId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "command" TEXT NOT NULL,
    "workingDirectory" TEXT NOT NULL,
    "pid" INTEGER,
    "startedAt" DATETIME NOT NULL,
    "endedAt" DATETIME,
    "exitCode" INTEGER,
    "signal" TEXT,
    "durationMs" INTEGER,
    "stdoutPreview" TEXT,
    "stderrPreview" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProjectRunProfileRun_runProfileId_fkey" FOREIGN KEY ("runProfileId") REFERENCES "ProjectRunProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ProjectRunProfileRun_runProfileId_idx" ON "ProjectRunProfileRun"("runProfileId");

-- CreateIndex
CREATE INDEX "ProjectRunProfileRun_startedAt_idx" ON "ProjectRunProfileRun"("startedAt");

-- CreateIndex
CREATE INDEX "ProjectRunProfileRun_runProfileId_startedAt_idx" ON "ProjectRunProfileRun"("runProfileId", "startedAt");
