import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';

const loanSchema = z.object({
  name: z.string().min(1, 'Nama cicilan wajib diisi'),
  principal: z.number().positive('Pokok pinjaman harus lebih besar dari 0'),
  annualInterestRatePct: z.number().nonnegative('Bunga tidak boleh negatif'),
  tenor: z.number().int().positive('Tenor harus berupa bulan positif'),
  interestType: z.enum(['FLAT', 'EFFECTIVE', 'ANNUITY']),
  dueDate: z.number().int().min(1).max(31, 'Tanggal jatuh tempo harus antara 1-31'),
  walletId: z.string().min(1, 'Pilih dompet untuk pembayaran'),
  autoDebet: z.boolean().default(true),
});

export async function GET(req: NextRequest) {
  try {
    const session = getUserFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const loans = await prisma.loan.findMany({
      where: { userId: session.id },
      include: { wallet: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ loans });
  } catch (error: any) {
    console.error('GET Loans API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = getUserFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = loanSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const {
      name,
      principal,
      annualInterestRatePct,
      tenor,
      interestType,
      dueDate,
      walletId,
      autoDebet,
    } = parsed.data;

    // Convert annual percent to monthly rate decimal
    // e.g. 12% annual = 12 / 100 / 12 = 0.01 monthly decimal
    const monthlyRateDecimal = (annualInterestRatePct / 100) / 12;

    const loan = await prisma.loan.create({
      data: {
        name,
        principal,
        interestRate: monthlyRateDecimal,
        tenor,
        remainingTenor: tenor, // initially full tenor is remaining
        interestType,
        startDate: new Date(),
        dueDate,
        autoDebet,
        walletId,
        userId: session.id,
      },
      include: {
        wallet: true,
      },
    });

    return NextResponse.json({
      success: true,
      loan,
    });
  } catch (error: any) {
    console.error('POST Loan API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal menambahkan data cicilan' },
      { status: 400 }
    );
  }
}

// Support toggling auto-debet or manual payments
export async function PUT(req: NextRequest) {
  try {
    const session = getUserFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { loanId, action } = body;

    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
    });

    if (!loan || loan.userId !== session.id) {
      return NextResponse.json({ error: 'Cicilan tidak ditemukan' }, { status: 404 });
    }

    if (action === 'toggle-autodebet') {
      const updated = await prisma.loan.update({
        where: { id: loanId },
        data: { autoDebet: !loan.autoDebet },
      });
      return NextResponse.json({ success: true, loan: updated });
    }

    return NextResponse.json({ error: 'Aksi tidak dikenal' }, { status: 400 });
  } catch (error: any) {
    console.error('PUT Loan Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
