import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const transactionSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']),
  amount: z.number().positive('Nominal harus lebih besar dari 0'),
  description: z.string().min(1, 'Deskripsi wajib diisi'),
  is_need: z.boolean().default(false),
  walletId: z.string().min(1, 'Dompet asal wajib dipilih'),
  destinationWalletId: z.string().optional(),
  categoryId: z.string().optional(),
  date: z.string().optional(), // optional date override
});

export async function GET(req: NextRequest) {
  try {
    const session = await getUserFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Retrieve all wallets for this user
    const wallets = await prisma.wallet.findMany({
      where: { userId: session.id },
      orderBy: { name: 'asc' },
    });

    // Retrieve all categories for this user
    const categories = await prisma.category.findMany({
      where: { userId: session.id },
      orderBy: { name: 'asc' },
    });

    // Retrieve all transactions for this user
    const transactions = await prisma.transaction.findMany({
      where: { userId: session.id },
      include: {
        category: true,
        wallet: true,
        destinationWallet: true,
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json({
      wallets,
      categories,
      transactions,
    });
  } catch (error: any) {
    console.error('GET Transactions API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getUserFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = transactionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const {
      type,
      amount,
      description,
      is_need,
      walletId,
      destinationWalletId,
      categoryId,
      date,
    } = parsed.data;

    const txDate = date ? new Date(date) : new Date();

    // Execute atomic transaction (ACID Compliance)
    const result = await prisma.$transaction(async (tx) => {
      // Find source wallet
      const wallet = await tx.wallet.findUnique({
        where: { id: walletId },
      });

      if (!wallet || wallet.userId !== session.id) {
        throw new Error('Dompet asal tidak ditemukan atau tidak sah');
      }

      const walletBalance = Number(wallet.balance);

      // Verify balance if EXPENSE or TRANSFER
      if (type === 'EXPENSE' || type === 'TRANSFER') {
        if (walletBalance < amount) {
          throw new Error('Saldo tidak mencukupi untuk melakukan transaksi ini');
        }

        // Deduct from source wallet
        await tx.wallet.update({
          where: { id: walletId },
          data: {
            balance: walletBalance - amount,
          },
        });
      }

      if (type === 'INCOME') {
        // Add to source wallet
        await tx.wallet.update({
          where: { id: walletId },
          data: {
            balance: walletBalance + amount,
          },
        });
      }

      if (type === 'TRANSFER') {
        if (!destinationWalletId) {
          throw new Error('Dompet tujuan wajib dipilih untuk transfer');
        }

        const destWallet = await tx.wallet.findUnique({
          where: { id: destinationWalletId },
        });

        if (!destWallet || destWallet.userId !== session.id) {
          throw new Error('Dompet tujuan tidak ditemukan atau tidak sah');
        }

        const destBalance = Number(destWallet.balance);

        // Add to destination wallet
        await tx.wallet.update({
          where: { id: destinationWalletId },
          data: {
            balance: destBalance + amount,
          },
        });
      }

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          type,
          amount,
          description,
          is_need: type === 'EXPENSE' ? is_need : false,
          date: txDate,
          walletId,
          destinationWalletId: type === 'TRANSFER' ? destinationWalletId : null,
          categoryId: type !== 'TRANSFER' ? categoryId : null,
          userId: session.id,
        },
        include: {
          category: true,
          wallet: true,
          destinationWallet: true,
        },
      });

      return transaction;
    });

    return NextResponse.json({
      success: true,
      transaction: result,
    });
  } catch (error: any) {
    console.error('POST Transaction ACID Error:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal mencatat transaksi' },
      { status: 400 }
    );
  }
}
