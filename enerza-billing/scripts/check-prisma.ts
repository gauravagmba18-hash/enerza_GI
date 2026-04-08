import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
  const url = process.env.DATABASE_URL || 'file:./dev.db';
  const adapter = new PrismaLibSql({ url });
  const prisma = new PrismaClient({ adapter } as any);

  console.log("Prisma Properties:");
  const keys = Object.keys(prisma);
  console.log(keys.filter(k => k.toLowerCase().includes("request")));
  
  await prisma.$disconnect();
}

main().catch(console.error);
