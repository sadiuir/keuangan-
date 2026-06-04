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

    // 1. Get days in current month
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

    // 2. Compute NDI = Gaji - Loan Installments - Mandatory Expenses
    // Gaji (Income)
    const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59);

    const monthTransactions = await prisma.transaction.findMany({
      where: {
        userId: session.id,
        date: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      include: { category: true }
    });

    const income = monthTransactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Active loan installments
    const loans = await prisma.loan.findMany({
      where: {
        userId: session.id,
        remainingTenor: { gt: 0 }
      }
    });

    let installments = 0;
    for (const loan of loans) {
      const P = Number(loan.principal);
      const interestRatePct = loan.interestRate * 100 * 12;
      const tenor = loan.tenor;
      const interestType = loan.interestType as 'FLAT' | 'EFFECTIVE' | 'ANNUITY';

      const amort = calculateAmortization(P, interestRatePct, tenor, interestType);
      const paymentNumber = tenor - loan.remainingTenor + 1;

      let installment = 0;
      if (interestType === 'EFFECTIVE') {
        const periodIndex = paymentNumber - 1;
        installment = amort.schedule[periodIndex]?.installment || amort.installmentPerMonth;
      } else {
        installment = amort.installmentPerMonth;
      }
      installments += Number(installment);
    }

    // Mandatory expenses (is_need === true)
    const mandatoryExpenses = monthTransactions
      .filter(t => t.type === 'EXPENSE' && t.is_need === true)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // NDI
    const ndi = Math.max(0, income - installments - mandatoryExpenses);
    const displayNdi = ndi > 0 ? ndi : 0; // fallback if no transactions

    // 3. Find Jajan & Hiburan allocation %
    let allocation = await prisma.allocation.findFirst({
      where: {
        userId: session.id,
        month: currentMonth,
        year: currentYear
      }
    });

    if (!allocation) {
      allocation = await prisma.allocation.findFirst({
        where: { userId: session.id },
        orderBy: { createdAt: 'desc' }
      });
    }

    const jajanPct = allocation ? allocation.jajan : 40;
    const initialJajanBudget = (jajanPct / 100) * displayNdi;

    // 4. Find all Jajan expenditures in this month
    // We look for EXPENSE transactions under category 'Jajan & Hiburan' or transactions with is_need = false
    const jajanTransactions = monthTransactions.filter(
      t => t.type === 'EXPENSE' && t.is_need === false
    );

    const totalJajanSpent = jajanTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const actualJajanRemaining = Math.max(0, initialJajanBudget - totalJajanSpent);

    // 5. Spent today under Jajan & Hiburan
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const jajanSpentToday = monthTransactions
      .filter(t => {
        const tDate = new Date(t.date);
        return t.type === 'EXPENSE' && t.is_need === false && tDate >= startOfToday && tDate <= endOfToday;
      })
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const wallets = await prisma.wallet.findMany({
      where: { userId: session.id }
    });

    return NextResponse.json({
      initialMoney: initialJajanBudget,
      actualMoneyRemaining: actualJajanRemaining,
      spentToday: jajanSpentToday,
      todayDateNum: currentDay,
      daysInMonth: daysInMonth,
      allocation: allocation ? {
        tabunganWalletId: allocation.tabunganWalletId,
        daruratWalletId: allocation.daruratWalletId,
        jajanWalletId: allocation.jajanWalletId,
      } : null,
      wallets: wallets.map(w => ({
        id: w.id,
        name: w.name,
        balance: Number(w.balance)
      })),
      jajanSpentHistory: jajanTransactions.map(t => ({
        id: t.id,
        description: t.description,
        amount: Number(t.amount),
        date: t.date
      })),
      user: {
        name: session.name
      }
    });

  } catch (error: any) {
    console.error('GET Anak Kost Data Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
