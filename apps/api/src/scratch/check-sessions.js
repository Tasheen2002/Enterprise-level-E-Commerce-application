const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkSessions() {
  const sessions = await prisma.memberSession.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log(JSON.stringify(sessions, null, 2));
}

checkSessions()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
