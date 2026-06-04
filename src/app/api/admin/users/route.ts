import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const resetPasswordSchema = z.object({
  userId: z.string().min(1),
  newPassword: z.string().min(6, 'Password minimal 6 karakter'),
});

const deleteUserSchema = z.object({
  userId: z.string().min(1),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getUserFromRequest(req);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all users
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      }
    });

    // System stats
    const totalUsers = users.length;
    const totalWallets = await prisma.wallet.count();
    const totalTransactions = await prisma.transaction.count();
    const totalLoans = await prisma.loan.count();

    return NextResponse.json({
      users,
      stats: {
        totalUsers,
        totalWallets,
        totalTransactions,
        totalLoans
      }
    });
  } catch (error: any) {
    console.error('Admin GET users error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getUserFromRequest(req);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;

    // RESET PASSWORD
    if (action === 'reset_password') {
      const parsed = resetPasswordSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
      }

      const { userId, newPassword } = parsed.data;

      const passwordHash = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash }
      });

      return NextResponse.json({ success: true, message: 'Password berhasil di-reset' });
    }

    // DELETE USER
    if (action === 'delete_user') {
      const parsed = deleteUserSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
      }

      const { userId } = parsed.data;

      // Prevent self-deletion
      if (userId === session.id) {
        return NextResponse.json({ error: 'Anda tidak dapat menghapus akun Anda sendiri' }, { status: 400 });
      }

      await prisma.user.delete({
        where: { id: userId }
      });

      return NextResponse.json({ success: true, message: 'Akun berhasil dihapus' });
    }

    return NextResponse.json({ error: 'Aksi tidak dikenal' }, { status: 400 });
  } catch (error: any) {
    console.error('Admin POST action error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
