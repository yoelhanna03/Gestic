import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Get the user with familyId from the database.
 * Better Auth doesn't include custom fields (familyId) in the session by default,
 * so we need to fetch it from the database.
 */
export async function getUserWithFamilyId(userId: string) {
  return await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      image: true,
      familyId: true,
    },
  });
}

/**
 * Get just the familyId for a user
 */
export async function getFamilyId(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { familyId: true },
  });
  return user?.familyId;
}
