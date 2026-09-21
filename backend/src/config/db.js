import { createConnection } from 'mysql2/promise';
import { PrismaClient } from '@prisma/client';

let prisma;

if (process.env.NODE_ENV !== 'production') {
  prisma = new PrismaClient({
    log: ['query', 'error', 'warn'],
  });
  prisma.$connect().catch((e) => {
    console.error('Prisma connection error:', e);
    process.exit(1);
  });
} else {
  prisma = new PrismaClient({});
}

export default prisma;