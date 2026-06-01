-- CreateTable
CREATE TABLE "ProjectArchitecture" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "summary" TEXT,
    "mermaidSource" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProjectArchitecture_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectArchitecture_projectId_key" ON "ProjectArchitecture"("projectId");

-- CreateIndex
CREATE INDEX "ProjectArchitecture_updatedAt_idx" ON "ProjectArchitecture"("updatedAt");
