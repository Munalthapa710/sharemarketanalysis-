import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_DEMO_USER_EMAIL ?? "demo@shareanalysis.app";
  const password = process.env.SEED_DEMO_USER_PASSWORD ?? "DemoPass123!";
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email },
    update: {
      name: "Open Demo",
      passwordHash
    },
    create: {
      name: "Open Demo",
      email,
      passwordHash,
      watchlistItems: {
        createMany: {
          data: [
            { symbol: "NABIL", companyName: "Nabil Bank Limited" },
            { symbol: "NTC", companyName: "Nepal Telecom" }
          ]
        }
      }
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
