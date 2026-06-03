// Edge client: tidak memuat binary query engine, tidak butuh fs.readdir
import { PrismaClient } from '../generated/prisma/edge';
import { neon } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';

let _client: PrismaClient | null = null;

function getClient(): PrismaClient {
  if (_client) return _client;

  const sql = neon(process.env.DATABASE_URL!);
  const adapter = new PrismaNeon(sql);
  _client = new PrismaClient({ adapter });

  return _client;
}

// Proxy: prisma.user.findMany() dll bekerja seperti biasa,
// tapi inisialisasi terjadi saat request pertama (bukan saat import)
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_, prop: string | symbol) {
    return (getClient() as any)[prop as string];
  },
});
