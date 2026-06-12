import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function scanExpiringDocuments() {
  console.log("Starting alert scan...");

  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(now.getDate() + 30);

  try {
    // 1. Find documents that expire within 30 days and have not expired yet (or just expired)
    const expiringDocuments = await prisma.document.findMany({
      where: {
        expirationDate: {
          lte: thirtyDaysFromNow,
          gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // Include docs that expired in the last 7 days
        },
      },
      include: {
        alerts: true,
      },
    });

    let createdAlertsCount = 0;

    for (const doc of expiringDocuments) {
      // Check if a PENDING alert already exists for this document
      const hasPendingAlert = doc.alerts.some(alert => !alert.isSent);

      if (!hasPendingAlert) {
        await prisma.alert.create({
          data: {
            documentId: doc.id,
            triggerDate: new Date(),
            isSent: false,
          },
        });
        createdAlertsCount++;
      }
    }

    return {
      scanned: expiringDocuments.length,
      created: createdAlertsCount,
    };
  } catch (error) {
    console.error("Error during alert scan:", error);
    throw error;
  }
}
