import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding FI-CA & Master Data...");

  // 1. Dunning Levels
  console.log("- Dunning Levels...");
  await prisma.dunningLevel.deleteMany();
  await prisma.dunningLevel.createMany({
    data: [
      { dunningLevelId: "L0_REMINDER",  levelName: "Soft Reminder",     graceDays: 5,  feeAmount: 0.00,  noticeType: "SMS_EMAIL",  status: "ACTIVE" },
      { dunningLevelId: "L1_FORMAL",    levelName: "Formal Notice",     graceDays: 15, feeAmount: 150.00, noticeType: "PAPER",     status: "ACTIVE" },
      { dunningLevelId: "L2_DISCONNECT",levelName: "Disconnection Warn", graceDays: 25, feeAmount: 500.00, noticeType: "LEGAL",     status: "ACTIVE" },
      { dunningLevelId: "L3_LEGAL",     levelName: "Legal Recovery",    graceDays: 45, feeAmount: 1200.00, noticeType: "LEGAL",     status: "ACTIVE" },
    ]
  });

  // 2. Budget Billing Plans
  console.log("- Budget Billing Plans...");
  await prisma.budgetBillingPlan.deleteMany();
  const accounts = await prisma.account.findMany({ take: 5 });
  for (const acc of accounts) {
    await prisma.budgetBillingPlan.create({
      data: {
        accountId: acc.accountId,
        planName: "Annual Average Plan",
        fixedMonthlyAmount: 2500.00,
        settlementMonth: "MARCH",
        status: "ACTIVE"
      }
    });
  }

  // 3. Security Deposits
  console.log("- Security Deposits...");
  await prisma.securityDeposit.deleteMany();
  for (const acc of accounts) {
      await prisma.securityDeposit.create({
          data: {
              accountId: acc.accountId,
              depositAmount: 5000.00,
              interestRate: 6.5,
              depositDate: new Date("2024-01-01"),
              status: "HELD"
          }
      });
  }

  // 4. Payment Orders & Settlements
  console.log("- Payments & Settlements...");
  const bills = await prisma.bill.findMany({ take: 10, include: { account: true } });
  await prisma.paymentOrder.deleteMany();
  await prisma.settlement.deleteMany();

  for (let i = 0; i < bills.length; i++) {
      const bill = bills[i];
      const order = await prisma.paymentOrder.create({
          data: {
              billId: bill.billId,
              accountId: bill.accountId,
              paymentChannelId: "cl_pc_bbps_01",
              orderAmount: bill.totalAmount,
              gatewayRef: `REF-${Math.floor(Math.random() * 90000) + 10000}`,
              status: "SUCCESS"
          }
      });

      // Every 3rd order is settled
      if (i % 3 === 0) {
          await prisma.settlement.create({
              data: {
                  settlementRef: `STL-${Math.floor(Math.random() * 90000) + 10000}`,
                  settlementDate: new Date(),
                  grossAmount: bill.totalAmount,
                  gatewayFee: bill.totalAmount * 0.02,
                  netAmount: bill.totalAmount * 0.98,
                  status: "COMPLETED",
                  paymentOrders: { connect: { orderId: order.orderId } }
              }
          });
      }
  }

  console.log("✅ Seed Complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
