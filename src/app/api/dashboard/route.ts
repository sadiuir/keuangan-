import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { calculateAmortization } from '@/lib/math';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getUserFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const currentDay = now.getDate();

    // 1. Wallets & Total Balance
    const wallets = await prisma.wallet.findMany({
      where: { userId: session.id }
    });
    const totalBalance = wallets.reduce((sum, w) => sum + Number(w.balance), 0);

    // 2. Active Loans & Tagihan Bulan Ini
    const loans = await prisma.loan.findMany({
      where: {
        userId: session.id,
        remainingTenor: { gt: 0 }
      }
    });

    let totalInstallmentsThisMonth = 0;
    const upcomingBills = [];

    for (const loan of loans) {
      const P = Number(loan.principal);
      const interestRatePct = loan.interestRate * 100 * 12;
      const tenor = loan.tenor;
      const interestType = loan.interestType as 'FLAT' | 'EFFECTIVE' | 'ANNUITY';

      // Monthly payment for current period
      const amort = calculateAmortization(P, interestRatePct, tenor, interestType);
      const paymentNumber = tenor - loan.remainingTenor + 1;

      let installment = 0;
      if (interestType === 'EFFECTIVE') {
        const periodIndex = paymentNumber - 1;
        installment = amort.schedule[periodIndex]?.installment || amort.installmentPerMonth;
      } else {
        installment = amort.installmentPerMonth;
      }
      
      installment = parseFloat(installment.toFixed(2));
      totalInstallmentsThisMonth += installment;

      // Check if bill is due in H-3 (DueDate is between currentDay and currentDay + 3)
      const diff = loan.dueDate - currentDay;
      if (diff >= 0 && diff <= 3) {
        upcomingBills.push({
          id: loan.id,
          name: loan.name,
          installment,
          dueDate: loan.dueDate,
          daysLeft: diff,
          interestType: loan.interestType
        });
      }
    }

    // 3. Sisa Dana Alokasi (SDA)
    // SDA = Total Saldo - Sum(Tagihan Aktif Bulan Ini)
    const sda = Math.max(0, totalBalance - totalInstallmentsThisMonth);

    // 4. Current Month Income & Expenses
    const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59);

    const monthTransactions = await prisma.transaction.findMany({
      where: {
        userId: session.id,
        date: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    });

    const monthIncome = monthTransactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const monthExpense = monthTransactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // 5. Active Allocations
    let allocation = await prisma.allocation.findFirst({
      where: {
        userId: session.id,
        month: currentMonth,
        year: currentYear
      }
    });

    if (!allocation) {
      // fallback to latest
      allocation = await prisma.allocation.findFirst({
        where: { userId: session.id },
        orderBy: { createdAt: 'desc' }
      });
    }

    const allocationPct = allocation ? {
      tabungan: allocation.tabungan,
      darurat: allocation.darurat,
      jajan: allocation.jajan
    } : {
      tabungan: 30,
      darurat: 30,
      jajan: 40
    };

    // 6. Recharts Daily Flux dataset (Days 1 to 31)
    const dailyFlux = Array.from({ length: 31 }, (_, idx) => {
      const day = idx + 1;
      return {
        day: `Tgl ${day}`,
        dayNum: day,
        Pemasukan: 0,
        Pengeluaran: 0
      };
    });

    // Populate daily flux from transactions
    monthTransactions.forEach(t => {
      const tDate = new Date(t.date);
      const tDay = tDate.getDate();
      if (tDay >= 1 && tDay <= 31) {
        const amount = Number(t.amount);
        if (t.type === 'INCOME') {
          dailyFlux[tDay - 1].Pemasukan += amount;
        } else if (t.type === 'EXPENSE') {
          dailyFlux[tDay - 1].Pengeluaran += amount;
        }
      }
    });

    // Round values
    dailyFlux.forEach(df => {
      df.Pemasukan = parseFloat(df.Pemasukan.toFixed(2));
      df.Pengeluaran = parseFloat(df.Pengeluaran.toFixed(2));
    });

    return NextResponse.json({
      totalBalance,
      sda,
      monthIncome,
      monthExpense,
      allocationPct,
      upcomingBills: upcomingBills.sort((a, b) => a.daysLeft - b.daysLeft),
      dailyFlux,
      wallets,
      user: {
        name: session.name
      }
    });

  } catch (error: any) {
    console.error('GET Dashboard Data Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
