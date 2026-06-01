import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const project = await prisma.project.upsert({
    where: { slug: "expenses-tracker-v3" },
    update: {},
    create: {
      name: "Expenses Tracker v3",
      slug: "expenses-tracker-v3",
      description: "Personal expense tracking (linked from ManDev seed).",
      repoUrl: "https://github.com/your-org/expenses-tracker-v3",
      localPath: "/Users/riskimanta/Documents/expenses-tracker-v3",
    },
  });

  const existing = await prisma.feature.findFirst({
    where: { projectId: project.id, title: "Dashboard overview widgets" },
  });
  if (!existing) {
    await prisma.feature.create({
      data: {
        projectId: project.id,
        title: "Dashboard overview widgets",
        description: "Example feature row for ManDev dashboard.",
        status: "ready",
        priority: 1,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
