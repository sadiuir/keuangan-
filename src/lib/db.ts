// Edge client: no binary engine, no fs.readdir, connects via DATABASE_URL directly
import { PrismaClient } from '../generated/prisma/edge';

let _client: PrismaClient | null = null;

function getClient(): PrismaClient {
  if (_client) return _client;
  _client = new PrismaClient();
  return _client;
}

// Proxy: prisma.user.findMany() dll bekerja seperti biasa,
// tapi inisialisasi terjadi saat request pertama (bukan saat import/build time)
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_, prop: string | symbol) {
    return (getClient() as any)[prop as string];
  },
});
