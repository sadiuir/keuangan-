import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { signToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

const registerSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter'),
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

const updateProfileSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter'),
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter').optional().or(z.literal('')),
  oldPassword: z.string().optional().or(z.literal('')),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    // --- LOGOUT ACTION ---
    if (action === 'logout') {
      const response = NextResponse.json({ success: true, message: 'Logout berhasil' });
      response.cookies.set({
        name: 'token',
        value: '',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: new Date(0), // expire immediately
        path: '/',
      });
      return response;
    }

    // --- LOGIN ACTION ---
    if (action === 'login') {
      const parsed = loginSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0].message },
          { status: 400 }
        );
      }

      const { email, password } = parsed.data;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return NextResponse.json(
          { error: 'Email atau password salah' },
          { status: 401 }
        );
      }

      // Verify password
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return NextResponse.json(
          { error: 'Email atau password salah' },
          { status: 401 }
        );
      }

      // Create session payload
      const sessionPayload = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      };

      const token = signToken(sessionPayload);

      const response = NextResponse.json({
        success: true,
        user: sessionPayload,
      });

      // Set cookie
      response.cookies.set({
        name: 'token',
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });

      return response;
    }

    // --- REGISTER ACTION ---
    if (action === 'register') {
      const parsed = registerSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0].message },
          { status: 400 }
        );
      }

      const { name, email, password } = parsed.data;

      // Check if user exists
      const existingEmail = await prisma.user.findUnique({
        where: { email },
      });
      if (existingEmail) {
        return NextResponse.json(
          { error: 'Email sudah terdaftar' },
          { status: 400 }
        );
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Save user
      const user = await prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
        },
      });

      // Auto-create default categories
      const categoriesData = [
        { name: 'Gaji', type: 'INCOME' },
        { name: 'Bonus', type: 'INCOME' },
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

      // Auto-create default Smart Budgeting allocation
      const now = new Date();
      await prisma.allocation.create({
        data: {
          tabungan: 30,
          darurat: 30,
          jajan: 40,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
          userId: user.id
        }
      });

      const sessionPayload = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      };

      const token = signToken(sessionPayload);

      const response = NextResponse.json({
        success: true,
        user: sessionPayload,
      });

      // Set cookie
      response.cookies.set({
        name: 'token',
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });

      return response;
    }

    // --- UPDATE PROFILE ACTION ---
    if (action === 'update_profile') {
      const tokenCookie = req.cookies.get('token');
      if (!tokenCookie || !tokenCookie.value) {
        return NextResponse.json({ error: 'Sesi tidak valid' }, { status: 401 });
      }

      let payload: any;
      try {
        const { verifyToken } = require('@/lib/auth');
        payload = verifyToken(tokenCookie.value);
      } catch (e) {
        return NextResponse.json({ error: 'Sesi kedaluwarsa' }, { status: 401 });
      }

      const parsed = updateProfileSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0].message },
          { status: 400 }
        );
      }

      const { name, email, password, oldPassword } = parsed.data;

      const user = await prisma.user.findUnique({
        where: { id: payload.id }
      });
      if (!user) {
        return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
      }

      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id: payload.id }
        }
      });
      if (existingUser) {
        return NextResponse.json(
          { error: 'Email sudah digunakan oleh akun lain' },
          { status: 400 }
        );
      }

      const updateData: any = { name, email };
      if (password && password.trim() !== '') {
        if (!oldPassword || oldPassword.trim() === '') {
          return NextResponse.json(
            { error: 'Password lama wajib diisi untuk mengubah password' },
            { status: 400 }
          );
        }
        const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
        if (!isMatch) {
          return NextResponse.json(
            { error: 'Password lama salah' },
            { status: 400 }
          );
        }
        updateData.passwordHash = await bcrypt.hash(password, 10);
      }

      const updatedUser = await prisma.user.update({
        where: { id: payload.id },
        data: updateData
      });

      const sessionPayload = {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      };
      const newToken = signToken(sessionPayload);

      const response = NextResponse.json({
        success: true,
        user: sessionPayload,
        message: 'Profil berhasil diperbarui'
      });

      response.cookies.set({
        name: 'token',
        value: newToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });

      return response;
    }

    return NextResponse.json({ error: 'Aksi tidak dikenal' }, { status: 400 });
  } catch (error: any) {
    console.error('Auth API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
