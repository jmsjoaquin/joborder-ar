import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.employeeProfile.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      fullName: "JAMES MATTHEW B. JOAQUIN",
      position: "COMPUTER PROGRAMMER III",
      department: "PMT-ISM",
      approvingOfficerName: "ALLAN M. DE VILLA",
      approvingOfficerPosition: "ACTING SENIOR MANAGER - ITMD",
    },
  });

  if ((await prisma.savedTarget.count()) === 0) {
    await prisma.savedTarget.createMany({ data: [
      { name: "FARU Trial Balance", targetText: "Develop the Frontend/Backend of FARU Trial Balance Report module" },
      { name: "FARU Requesting Unit", targetText: "Develop the Frontend/Backend of FARU Requesting Unit module" },
    ] });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => { console.error(error); await prisma.$disconnect(); process.exit(1); });
