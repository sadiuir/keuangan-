import dns from 'dns';
if (process.env.NODE_ENV !== 'production') {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch (e) {
    console.warn('Failed to set custom DNS servers:', e);
  }
}
import { PrismaClient } from '../generated/prisma/client';

let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  const { Pool } = require('@neondatabase/serverless');
  const { PrismaNeon } = require('@prisma/adapter-neon');
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaNeon(pool);
  prisma = new PrismaClient({ adapter });
} else {
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
