import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createWalletSchema = z.object({
  name: z.string().min(1, 'Nama dompet wajib diisi'),
  initialBalance: z.number().min(0, 'Saldo awal tidak boleh negatif'),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getUserFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createWalletSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { name, initialBalance } = parsed.data;

    // Create wallet in database
    const wallet = await prisma.wallet.create({
      data: {
        name,
        balance: initialBalance,
        initialBalance: initialBalance,
        userId: session.id
      }
    });

    return NextResponse.json({ success: true, wallet });
  } catch (error: any) {
    console.log('Create Wallet Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getUserFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, balance } = body;
    if (!id || !name || balance === undefined || isNaN(Number(balance))) {
      return NextResponse.json({ error: 'Data tidak lengkap atau tidak valid' }, { status: 400 });
    }

    const existing = await prisma.wallet.findFirst({
      where: { id, userId: session.id }
    });
    if (!existing) {
      return NextResponse.json({ error: 'Dompet tidak ditemukan' }, { status: 404 });
    }

    const updated = await prisma.wallet.update({
      where: { id },
      data: {
        name,
        balance: Number(balance)
      }
    });

    return NextResponse.json({ success: true, wallet: updated });
  } catch (error: any) {
    console.error('Update Wallet Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getUserFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID dompet wajib diisi' }, { status: 400 });
    }

    const existing = await prisma.wallet.findFirst({
      where: { id, userId: session.id }
    });
    if (!existing) {
      return NextResponse.json({ error: 'Dompet tidak ditemukan' }, { status: 404 });
    }

    await prisma.wallet.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete Wallet Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

