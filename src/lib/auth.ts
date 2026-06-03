import { SignJWT, jwtVerify } from 'jose';
import { NextRequest } from 'next/server';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'musad_jwt_secret_2026_enterprise_level_secure_key'
);

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role?: string;
}

export async function signToken(user: UserSession): Promise<string> {
  return new SignJWT({ ...user } as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<UserSession | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as UserSession;
  } catch (e) {
    return null;
  }
}

export async function getUserFromRequest(req: NextRequest): Promise<UserSession | null> {
  const token = req.cookies.get('token')?.value;
  if (!token) {
    const authHeader = req.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return verifyToken(authHeader.substring(7));
    }
    return null;
  }
  return verifyToken(token);
}
