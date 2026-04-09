import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Create a .env file at the project root with:\n" +
        'DATABASE_URL="postgresql://postgres:password@localhost:5432/enerza_billing"'
    );
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
