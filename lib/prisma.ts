// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const RAW_URL = process.env.DATABASE_URL || '';
const isAccelUrl = /^prisma(\+postgres)?:\/\//i.test(RAW_URL);

// Only enable Accelerate if the URL is really an Accelerate URL.
// (Prevents "must start with prisma://" errors with normal postgres URLs.)
const USE_ACCELERATE = isAccelUrl;

const redact = (u: string) =>
  u.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:****@');

let prisma = new PrismaClient({
  log: ['error', 'warn'],
  // Do NOT pass datasourceUrl unless you really need to override schema.prisma.
  // datasourceUrl: RAW_URL,
});

// Attach Accelerate only when URL is prisma:// or prisma+postgres://
if (USE_ACCELERATE) {
  // Lazy import so builds do not require the pkg unless used
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { withAccelerate } = require('@prisma/extension-accelerate');
  prisma = prisma.$extends(withAccelerate());
}

console.info(
  `[Prisma] mode=${USE_ACCELERATE ? 'accelerate' : 'direct'} url=${redact(RAW_URL)}`
);

export default prisma;
