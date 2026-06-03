import { PrismaClient } from '../generated/prisma/client';

let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  // Cloudflare Workers: gunakan Neon HTTP mode (tidak butuh WebSocket/fs)
  const { neon } = require('@neondatabase/serverless');
  const { PrismaNeon } = require('@prisma/adapter-neon');

  const sql = neon(process.env.DATABASE_URL!);
  const adapter = new PrismaNeon(sql);
  prisma = new PrismaClient({ adapter });
} else {
  // Development: gunakan pg Pool biasa
  const { Pool } = require('pg');
  const { PrismaPg } = require('@prisma/adapter-pg');

  const globalAny = global as any;
  if (!globalAny.globalPrisma) {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    const adapter = new PrismaPg(pool);
    globalAny.globalPrisma = new PrismaClient({ adapter });
  }
  prisma = globalAny.globalPrisma;
}

export { prisma };
export type { Decimal } from '../generated/prisma/client/runtime/library';
