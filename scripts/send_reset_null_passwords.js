const { PrismaClient } = require("@prisma/client");
const fetch = global.fetch || require("node-fetch");

(async () => {
  const prisma = new PrismaClient();
  try {
    const accounts = await prisma.account.findMany({
      where: { providerId: "credential", password: null },
      select: { id: true, userId: true },
    });
    console.log("Found accounts:", accounts.length);
    for (const a of accounts) {
      const user = await prisma.user.findUnique({ where: { id: a.userId } });
      if (!user || !user.email) {
        console.log("No email for user", a.userId);
        continue;
      }
      console.log("Triggering reset for", user.email);
      try {
        const res = await fetch(
          "https://gestic-app.vercel.app/api/auth/request-password-reset",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: user.email }),
          },
        );
        const body = await res.text();
        console.log("Response status:", res.status, "body:", body);
      } catch (err) {
        console.error(
          "Failed to call request-password-reset for",
          user.email,
          err,
        );
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
})();
