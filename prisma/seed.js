const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Delete all existing data to prevent duplicate seed errors
  await prisma.cronLog.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.loan.deleteMany({});
  await prisma.allocation.deleteMany({});
  await prisma.wallet.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Create target user
  const passwordHash = await bcrypt.hash('password123', 10);
  const user = await prisma.user.create({
    data: {
      npm: '213110045',
      name: 'Muhammad Abdullah Hasyim Musadi',
      email: 'musad@musadi.net',
      passwordHash: passwordHash,
    },
  });
  console.log(`User created: ${user.name} (${user.email})`);

  // 3. Create wallets
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
  console.log('Wallets created.');

  // 4. Create categories
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
  console.log('Categories created.');

  // 5. Create default Smart Allocation
  const now = new Date();
  const allocation = await prisma.allocation.create({
    data: {
      tabungan: 30,
      darurat: 30,
      jajan: 40,
      month: now.getMonth() + 1, // 1-12
      year: now.getFullYear(),
      userId: user.id
    }
  });
  console.log('Default smart allocation created.');

  // 6. Create active loans
  // Loan 1: Flat interest
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

  // Loan 2: Annuity interest
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
  console.log('Loans created.');

  // 7. Create some sample transactions to populate history and flux chart
  const makanCat = await prisma.category.findFirst({ where: { userId: user.id, name: 'Makan' } });
  const gajiCat = await prisma.category.findFirst({ where: { userId: user.id, name: 'Gaji' } });

  // Add initial salary
  await prisma.transaction.create({
    data: {
      type: 'INCOME',
      amount: 15000000.00,
      description: 'Gaji Bulanan',
      is_need: false,
      date: new Date(now.getFullYear(), now.getMonth(), 1),
      walletId: mandiri.id,
      categoryId: gajiCat.id,
      userId: user.id
    }
  });

  // Add some expenses spread across the month so far
  const day = now.getDate();
  for (let i = 1; i <= Math.min(day, 28); i += 3) {
    await prisma.transaction.create({
      data: {
        type: 'EXPENSE',
        amount: 150000.00 + (i * 10000),
        description: `Belanja Makan Hari ke-${i}`,
        is_need: true, // makan is a need
        date: new Date(now.getFullYear(), now.getMonth(), i),
        walletId: tunai.id,
        categoryId: makanCat.id,
        userId: user.id
      }
    });
  }

  console.log('Sample transactions created.');
  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
