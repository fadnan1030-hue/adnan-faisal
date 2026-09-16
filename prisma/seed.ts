import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "password123";

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const users = [
    { name: "Amina Admin", email: "admin@demo.local", role: "ADMIN" as const },
    { name: "Marcus Manager", email: "manager@demo.local", role: "MAINTENANCE_MANAGER" as const },
    { name: "Elena Engineer", email: "engineer@demo.local", role: "MAINTENANCE_ENGINEER" as const },
    { name: "Sam Supervisor", email: "supervisor@demo.local", role: "SUPERVISOR" as const },
    { name: "Tariq Technician", email: "tech@demo.local", role: "TECHNICIAN" as const },
    { name: "Hana HSE", email: "hse@demo.local", role: "HSE_USER" as const },
    { name: "Quentin QC", email: "qc@demo.local", role: "QC_USER" as const },
    { name: "Mona Management", email: "mgmt@demo.local", role: "MANAGEMENT" as const },
    { name: "Victor Viewer", email: "viewer@demo.local", role: "VIEWER" as const },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, active: true },
      create: { ...u, passwordHash },
    });
  }

  console.log(`Seeded ${users.length} demo users (password: ${DEMO_PASSWORD})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
