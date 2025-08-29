import { PrismaClient } from '@prisma/client';

// Create a global Prisma client instance to avoid multiple connections
declare global {
  var __prisma: PrismaClient | undefined;
}

export const prisma = globalThis.__prisma ?? new PrismaClient({ 
  log: ['warn', 'error'],
  // Ensure we're using the binary engine, not data proxy
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

if (!globalThis.__prisma) {
  globalThis.__prisma = prisma;
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
