import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';

const allocationSchema = z.object({
  tabungan: z.number().min(0).max(100),
  darurat: z.number().min(0).max(100),
  jajan: z.number().min(0).max(100),
  tabunganWalletId: z.string().nullable().optional(),
  daruratWalletId: z.string().nullable().optional(),
  jajanWalletId: z.string().nullable().optional(),
}).refine(data => {
  const sum = data.tabungan + data.darurat + data.jajan;
  return Math.abs(sum - 100) < 0.1; // allow tiny float tolerance, but check it's 100%
}, {
  message: 'Total alokasi harus tepat 100%',
});

export async function GET(req: NextRequest) {
  try {
    const session = await getUserFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Try to get allocation for current month/year
    let allocation = await prisma.allocation.findFirst({
      where: {
        userId: session.id,
        month: currentMonth,
        year: currentYear,
      },
    });

    // If none exists, fetch the most recent one
    if (!allocation) {
      allocation = await prisma.allocation.findFirst({
        where: { userId: session.id },
        orderBy: { createdAt: 'desc' },
      });
    }

    // Default if database is empty of allocations
    if (!allocation) {
      allocation = {
        id: '',
        tabungan: 30,
        darurat: 30,
        jajan: 40,
        month: currentMonth,
        year: currentYear,
        userId: session.id,
        createdAt: now,
      };
    }

    return NextResponse.json({ allocation });
  } catch (error: any) {
    console.error('GET Allocations Error:', error);
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
    const parsed = allocationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { tabungan, darurat, jajan, tabunganWalletId, daruratWalletId, jajanWalletId } = parsed.data;
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Save or update non-retroactively (restricted to current month/year)
    const result = await prisma.allocation.upsert({
      where: {
        userId_month_year: {
          userId: session.id,
          month: currentMonth,
          year: currentYear,
        },
      },
      update: {
        tabungan,
        darurat,
        jajan,
        tabunganWalletId,
        daruratWalletId,
        jajanWalletId,
      },
      create: {
        tabungan,
        darurat,
        jajan,
        tabunganWalletId,
        daruratWalletId,
        jajanWalletId,
        month: currentMonth,
        year: currentYear,
        userId: session.id,
      },
    });

    return NextResponse.json({
      success: true,
      allocation: result,
    });
  } catch (error: any) {
    console.error('POST Allocations Error:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal menyimpan alokasi anggaran' },
      { status: 400 }
    );
  }
}
