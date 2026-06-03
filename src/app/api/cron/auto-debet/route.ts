import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { calculateAmortization } from '@/lib/math';

export async function GET(req: NextRequest) {
  return handleCron(req);
}

export async function POST(req: NextRequest) {
  return handleCron(req);
}

async function handleCron(req: NextRequest) {
  const now = new Date();
  const todayDay = now.getDate();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  
  try {
    // 1. Verify CRON_SECRET security
    const authHeader = req.headers.get('Authorization');
    const urlSecret = req.nextUrl.searchParams.get('secret');
    const cronSecret = process.env.CRON_SECRET;

    const isAuthorized = 
      (authHeader === `Bearer ${cronSecret}`) || 
      (urlSecret === cronSecret);

    if (!isAuthorized) {
      // Log unauthorized attempt
      await prisma.cronLog.create({
        data: {
          jobName: 'auto-debet',
          status: 'FAILED',
          message: 'Unauthorized cron trigger attempt'
        }
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`Cron triggered at ${now.toISOString()} (Day of Month: ${todayDay})`);

    // 2. Fetch all active loans with auto-debet enabled that are due today
    // We look for remainingTenor > 0 and dueDate = todayDay
    const loans = await prisma.loan.findMany({
      where: {
        remainingTenor: { gt: 0 },
        autoDebet: true,
        dueDate: todayDay
      },
      include: {
        wallet: true,
        user: true
      }
    });

    if (loans.length === 0) {
      await prisma.cronLog.create({
        data: {
          jobName: 'auto-debet',
          status: 'SUCCESS',
          message: `Cron executed. No active auto-debet loans due on day ${todayDay}.`
        }
      });
      return NextResponse.json({ 
        message: 'No loans due today', 
        processedLoansCount: 0 
      });
    }

    let processedCount = 0;
    let failedCount = 0;
    const details: string[] = [];

    // 3. Process each loan due today
    for (const loan of loans) {
      try {
        // --- IDEMPOTENCY CHECK ---
        // Check if we already debited this loan in the current calendar month
        // We look for a transaction for this loan, of type EXPENSE, in the current month and year
        const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
        const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59);

        const existingTx = await prisma.transaction.findFirst({
          where: {
            userId: loan.userId,
            walletId: loan.walletId,
            type: 'EXPENSE',
            description: {
              contains: `Auto-Debet: ${loan.name}`
            },
            date: {
              gte: startOfMonth,
              lte: endOfMonth
            }
          }
        });

        if (existingTx) {
          details.push(`Loan "${loan.name}" already debited this month (idempotent skip).`);
          continue;
        }

        // --- INSTALLMENT CALCULATION ---
        // Calculate the installment amount for the current month
        const P = Number(loan.principal);
        const interestRatePct = loan.interestRate * 100 * 12; // convert monthly rate decimal to annual %
        const tenor = loan.tenor;
        const interestType = loan.interestType as 'FLAT' | 'EFFECTIVE' | 'ANNUITY';

        const amort = calculateAmortization(P, interestRatePct, tenor, interestType);
        
        // Sisa tenor before this payment (e.g. if remaining is 10, payment number is 12 - 10 + 1 = 3)
        const paymentNumber = tenor - loan.remainingTenor + 1;
        
        let installmentAmount = 0;
        if (interestType === 'EFFECTIVE') {
          // For effective, installments vary monthly. Grab the installment for the current month index
          const periodIndex = paymentNumber - 1;
          installmentAmount = amort.schedule[periodIndex]?.installment || amort.installmentPerMonth;
        } else {
          // Flat and Annuity are fixed installments
          installmentAmount = amort.installmentPerMonth;
        }

        // Round installment to 2 decimals
        installmentAmount = parseFloat(installmentAmount.toFixed(2));

        // Find or create "Tagihan" category for this user
        let tagihanCat = await prisma.category.findFirst({
          where: {
            userId: loan.userId,
            name: 'Tagihan',
            type: 'EXPENSE'
          }
        });

        if (!tagihanCat) {
          tagihanCat = await prisma.category.create({
            data: {
              name: 'Tagihan',
              type: 'EXPENSE',
              userId: loan.userId
            }
          });
        }

        // --- ACID TRANSACTION ---
        await prisma.$transaction(async (tx) => {
          // Re-fetch wallet inside transaction to get latest balance
          const wallet = await tx.wallet.findUnique({
            where: { id: loan.walletId }
          });

          if (!wallet) {
            throw new Error(`Wallet ${loan.walletId} not found`);
          }

          const balance = Number(wallet.balance);

          // Validate balance
          if (balance < installmentAmount) {
            throw new Error(`Saldo dompet "${wallet.name}" (${balance}) tidak mencukupi untuk tagihan ${installmentAmount}`);
          }

          // 1. Deduct wallet balance
          await tx.wallet.update({
            where: { id: loan.walletId },
            data: {
              balance: balance - installmentAmount
            }
          });

          // 2. Insert transaction log
          await tx.transaction.create({
            data: {
              type: 'EXPENSE',
              amount: installmentAmount,
              description: `Auto-Debet: ${loan.name} (Bulan ke-${paymentNumber}/${tenor})`,
              is_need: true, // tags as essential expense
              date: now,
              walletId: loan.walletId,
              categoryId: tagihanCat!.id,
              userId: loan.userId
            }
          });

          // 3. Decrement loan remainingTenor
          await tx.loan.update({
            where: { id: loan.id },
            data: {
              remainingTenor: loan.remainingTenor - 1
            }
          });
        });

        processedCount++;
        details.push(`Loan "${loan.name}" successfully auto-debited for ${installmentAmount}.`);
      } catch (err: any) {
        failedCount++;
        details.push(`Loan "${loan.name}" auto-debet FAILED: ${err.message}`);
        console.error(`Auto-debet error for loan ${loan.id}:`, err);
      }
    }

    // 4. Log completion status
    const status = failedCount > 0 && processedCount === 0 ? 'FAILED' : 'SUCCESS';
    const finalMessage = `Processed: ${processedCount}, Failed: ${failedCount}. Details: ${details.join(' | ')}`;

    await prisma.cronLog.create({
      data: {
        jobName: 'auto-debet',
        status,
        message: finalMessage
      }
    });

    return NextResponse.json({
      message: 'Cron job completed',
      processedCount,
      failedCount,
      details
    });

  } catch (error: any) {
    console.error('CRON System Error:', error);
    try {
      await prisma.cronLog.create({
        data: {
          jobName: 'auto-debet',
          status: 'FAILED',
          message: `CRON System error: ${error.message}`
        }
      });
    } catch (dbErr) {
      console.error('Failed to log cron error to database:', dbErr);
    }
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
