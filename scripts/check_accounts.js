const { PrismaClient } = require("@prisma/client");
(async () => {
  const prisma = new PrismaClient();
  try {
    const rows = await prisma.account.findMany({
      where: { providerId: "credential", password: null },
      select: {
        id: true,
        userId: true,
        providerId: true,
        providerUserId: true,
        createdAt: true,
      },
      take: 100,
    });
    console.log(JSON.stringify(rows, null, 2));
  } catch (e) {
    console.error("ERROR", e);
  } finally {
    await prisma.$disconnect();
  }
})();
