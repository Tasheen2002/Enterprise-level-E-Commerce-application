import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:1234@localhost:5432/enterprise_level_ecommerce"
    }
  }
});

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: "tasheenadmin@gmail.com" }
  });
  console.log("Admin User Query Result:", user);
}

main().catch(console.error).finally(() => prisma.$disconnect());
