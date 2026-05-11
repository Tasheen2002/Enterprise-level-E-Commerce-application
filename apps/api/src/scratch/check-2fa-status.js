
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  
  users.forEach(u => {
    console.log(`User: ${u.email}`, {
      twoFactorEnabled: u.twoFactorEnabled,
      phoneVerified: u.phoneVerified,
      phone: u.phone
    });
  });
}

check().catch(console.error).finally(() => prisma.$disconnect());
