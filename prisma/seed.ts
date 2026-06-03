import 'dotenv/config';
import dns from 'dns';
if (process.env.NODE_ENV !== 'production') {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
}
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL;
console.log('Using connection string:', connectionString);
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database via Prisma 7 Pg Adapter...');

  // 1. Clean existing records
  await prisma.cronLog.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.loan.deleteMany({});
  await prisma.allocation.deleteMany({});
  await prisma.wallet.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Create Sadi User
  const passwordHash = await bcrypt.hash('password123', 10);
  const user = await prisma.user.create({
    data: {
      npm: '213110045',
      name: 'Muhammad Abdullah Hasyim Musadi',
      email: 'musad@musadi.my.id',
      passwordHash: passwordHash,
      role: 'ADMIN',
    },
  });
  console.log(`User seeded: ${user.name} (NPM: ${user.npm})`);

  // 3. Create Wallets
  const tunai = await prisma.wallet.create({
    data: {
      name: 'Tunai',
      balance: 1500000.00,
      initialBalance: 1500000.00,
      userId: user.id,
    },
  });

  const mandiri = await prisma.wallet.create({
    data: {
      name: 'Bank Mandiri',
      balance: 12000000.00,
      initialBalance: 12000000.00,
      userId: user.id,
    },
  });

  const gopay = await prisma.wallet.create({
    data: {
      name: 'GoPay',
      balance: 2500000.00,
      initialBalance: 2500000.00,
      userId: user.id,
    },
  });
  console.log('Wallets seeded.');

  // 4. Create Categories
  const categoriesData = [
    { name: 'Gaji', type: 'INCOME' },
    { name: 'Bonus', type: 'INCOME' },
    { name: 'Investasi', type: 'INCOME' },
    { name: 'Makan', type: 'EXPENSE' },
    { name: 'Transportasi', type: 'EXPENSE' },
    { name: 'Jajan & Hiburan', type: 'EXPENSE' },
    { name: 'Tagihan', type: 'EXPENSE' },
    { name: 'Lainnya', type: 'EXPENSE' }
  ];

  for (const cat of categoriesData) {
    await prisma.category.create({
      data: {
        name: cat.name,
        type: cat.type,
        userId: user.id
      }
    });
  }
  console.log('Categories seeded.');

  // 5. Create default Smart Allocation for this month
  const now = new Date();
  const allocation = await prisma.allocation.create({
    data: {
      tabungan: 30,
      darurat: 30,
      jajan: 40,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      userId: user.id
    }
  });
  console.log('Default smart allocation seeded.');

  // 6. Create active loans
  // Loan 1: Flat interest (Cicilan Laptop)
  const laptopLoan = await prisma.loan.create({
    data: {
      name: 'Cicilan Laptop (Flat)',
      principal: 6000000.00,
      interestRate: 0.01, // 1% per month
      tenor: 12,
      remainingTenor: 10,
      interestType: 'FLAT',
      startDate: new Date(now.getFullYear(), now.getMonth() - 2, 5),
      dueDate: 5,
      autoDebet: true,
      walletId: mandiri.id,
      userId: user.id
    }
  });

  // Loan 2: Annuity interest (Cicilan Motor)
  const motorLoan = await prisma.loan.create({
    data: {
      name: 'Cicilan Motor (Anuitas)',
      principal: 18000000.00,
      interestRate: 0.008, // 0.8% per month
      tenor: 24,
      remainingTenor: 20,
      interestType: 'ANNUITY',
      startDate: new Date(now.getFullYear(), now.getMonth() - 4, 10),
      dueDate: 10,
      autoDebet: true,
      walletId: mandiri.id,
      userId: user.id
    }
  });
  console.log('Loans seeded.');

  // 7. Seed sample cash flow for the Daily Flux Chart (from 1st to current day of month)
  const makanCat = await prisma.category.findFirst({ where: { userId: user.id, name: 'Makan' } })!;
  const gajiCat = await prisma.category.findFirst({ where: { userId: user.id, name: 'Gaji' } })!;
  const jajanCat = await prisma.category.findFirst({ where: { userId: user.id, name: 'Jajan & Hiburan' } })!;

  // Add initial salary at day 1
  await prisma.transaction.create({
    data: {
      type: 'INCOME',
      amount: 15000000.00,
      description: 'Gaji Bulanan',
      is_need: false,
      date: new Date(now.getFullYear(), now.getMonth(), 1),
      walletId: mandiri.id,
      categoryId: gajiCat!.id,
      userId: user.id
    }
  });

  // Generate some daily fluctuations (some days income, some expense)
  const currentDay = now.getDate();
  for (let d = 2; d <= Math.min(currentDay, 28); d++) {
    // Add dining expense every few days
    if (d % 3 === 0) {
      await prisma.transaction.create({
        data: {
          type: 'EXPENSE',
          amount: 85000.00 + (d % 4 * 15000),
          description: `Makan Siang tanggal ${d}`,
          is_need: true,
          date: new Date(now.getFullYear(), now.getMonth(), d),
          walletId: tunai.id,
          categoryId: makanCat!.id,
          userId: user.id
        }
      });
    }
    // Add jajan expense every other day
    if (d % 4 === 1) {
      await prisma.transaction.create({
        data: {
          type: 'EXPENSE',
          amount: 50000.00 + (d % 5 * 10000),
          description: `Kopi & Cemilan tanggal ${d}`,
          is_need: false,
          date: new Date(now.getFullYear(), now.getMonth(), d),
          walletId: gopay.id,
          categoryId: jajanCat!.id,
          userId: user.id
        }
      });
    }
  }

  console.log('Sample transactions seeded.');
  console.log('Database seeding successfully finished!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
