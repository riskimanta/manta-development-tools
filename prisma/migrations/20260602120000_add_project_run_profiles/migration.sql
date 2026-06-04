-- CreateTable
CREATE TABLE "ProjectRunProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "command" TEXT NOT NULL,
    "workingDirectory" TEXT,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProjectRunProfile_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ProjectRunProfile_projectId_idx" ON "ProjectRunProfile"("projectId");

-- CreateIndex
CREATE INDEX "ProjectRunProfile_projectId_isDefault_idx" ON "ProjectRunProfile"("projectId", "isDefault");
