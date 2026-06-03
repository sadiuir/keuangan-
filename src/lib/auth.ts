import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'musad_jwt_secret_2026_enterprise_level_secure_key';

export interface UserSession {
  id: string;
  name: string;
  email: string;
}

export function signToken(user: UserSession): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): UserSession | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserSession;
  } catch (e) {
    return null;
  }
}

export function getUserFromRequest(req: NextRequest): UserSession | null {
  const token = req.cookies.get('token')?.value;
  if (!token) {
    // Also fallback to Authorization header if cookies are not populated (e.g. for testing)
    const authHeader = req.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return verifyToken(authHeader.substring(7));
    }
    return null;
  }
  return verifyToken(token);
}
