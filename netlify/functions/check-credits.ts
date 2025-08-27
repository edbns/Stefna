import type { Handler } from '@netlify/functions';
import { PrismaClient } from '@prisma/client';
import { requireUser } from './_lib/auth';

export const handler: Handler = async (event) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      }
    };
  }

  try {
    // Authenticate user
    const user = await requireUser(event);
    
    const prisma = new PrismaClient();
    
    // Get current credit balance from CreditTransaction table
    const currentCredits = await prisma.creditTransaction.aggregate({
      where: { 
        userId: user.id 
      },
      _sum: {
        amount: true
      }
    });
    
    const totalCredits = currentCredits._sum.amount || 0;
    
    // Get recent credit history
    const recentTransactions = await prisma.creditTransaction.findMany({
      where: { 
        userId: user.id 
      },
      select: {
        amount: true,
        reason: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    await prisma.$disconnect();

    console.log(`💰 User ${user.id} has ${totalCredits} credits`);

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        ok: true,
        credits: totalCredits,
        recentTransactions: recentTransactions.map(t => ({
          amount: t.amount,
          reason: t.reason,
          date: t.createdAt
        })),
        message: `Current balance: ${totalCredits} credits`
      })
    };

  } catch (error: any) {
    console.error('❌ Check credits error:', error);
    
    const statusCode = error?.status || 500;
    return {
      statusCode,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        ok: false,
        error: error.message || 'Internal server error',
        statusCode
      })
    };
  }
};
