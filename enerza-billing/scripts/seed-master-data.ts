import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env relative to the script
dotenv.config({ path: path.join(__dirname, '../.env') });

const url = process.env.DATABASE_URL || 'file:./dev.db';
const adapter = new PrismaLibSql({ url });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log('🌱 Seeding master data...');

  // 1. Complaint Categories & Sub-Categories
  const categories = [
    {
      name: 'Billing & Payments',
      description: 'Issues related to invoices, payments, and refunds',
      subCategories: [
        { name: 'High Bill Dispute', slaHours: 48 },
        { name: 'Payment Not Reflected', slaHours: 24 },
        { name: 'Refund Request', slaHours: 72 },
        { name: 'Tariff Change Request', slaHours: 48 },
      ],
    },
    {
      name: 'Technical & Outage',
      description: 'Power supply and network issues',
      subCategories: [
        { name: 'No Power Supply - Individual', slaHours: 4 },
        { name: 'Voltage Fluctuation', slaHours: 8 },
        { name: 'Street Light Issue', slaHours: 24 },
        { name: 'Neutral Link Fault', slaHours: 12 },
      ],
    },
    {
      name: 'Metering',
      description: 'Meter related faults and services',
      subCategories: [
        { name: 'Faulty / Burnt Meter', slaHours: 24 },
        { name: 'Glass Broken / Seal Tampered', slaHours: 48 },
        { name: 'Meter Shifting Request', slaHours: 72 },
        { name: 'Meter Testing Request', slaHours: 48 },
      ],
    },
    {
      name: 'New Connection & Service',
      description: 'Onboarding and lifecycle requests',
      subCategories: [
        { name: 'New Connection Application', slaHours: 168 },
        { name: 'Load Enhancement', slaHours: 72 },
        { name: 'Name Transfer (Change of Occupancy)', slaHours: 120 },
        { name: 'Temporary Connection', slaHours: 48 },
      ],
    },
  ];

  for (const cat of categories) {
    const parent = await prisma.complaintCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: {
        name: cat.name,
        description: cat.description,
      },
    });

    for (const sub of cat.subCategories) {
      await prisma.complaintSubCategory.create({
        data: {
          name: sub.name,
          slaHours: sub.slaHours,
          categoryId: parent.id,
        },
      });
    }
  }

  console.log('✅ Master data seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
