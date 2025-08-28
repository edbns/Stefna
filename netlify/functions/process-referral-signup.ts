import type { Handler } from "@netlify/functions";
import { PrismaClient } from "@prisma/client";
import { json } from "./_lib/http";

export const handler: Handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      }
    };
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { referrerEmail, newUserId, newUserEmail } = body;
    
    if (!referrerEmail || !newUserId || !newUserEmail) {
      return json({ ok: false, error: "MISSING_PARAMS" }, { status: 400 });
    }

    const prisma = new PrismaClient();

    // Find referrer by email
    const referrer = await prisma.user.findFirst({
      where: { 
        email: { 
          equals: referrerEmail, 
          mode: 'insensitive' 
        } 
      },
      select: { id: true }
    });
    
    if (!referrer) {
      return json({ ok: false, error: "REFERRER_NOT_FOUND" }, { status: 404 });
    }
    const referrerId = referrer.id;

    // Skip referral tracking for now since referralSignup table doesn't exist
    // TODO: Implement referral tracking when table is created
    
    // Only award if this is the first time (check ledger for existing referral grants)
    const existingReferralGrant = await prisma.creditTransaction.findFirst({
      where: {
        userId: referrerId,
        status: 'granted',
        action: 'referral.referrer',
        meta: {
          path: ['new_user_id'],
          equals: newUserId
        }
      }
    });
    
    if (!existingReferralGrant) {
      // Use hardcoded bonus amounts since appConfig table doesn't exist
      const refBonus = 50; // Referrer gets 50 credits
      const newBonus = 25; // New user gets 25 credits

      // Grant to referrer
      await prisma.creditTransaction.create({
        data: {
          userId: referrerId,
          action: 'referral.referrer',
          amount: refBonus,
          status: 'granted',
          meta: {
            reason: 'referral.referrer',
            new_user_id: newUserId
          }
        }
      });
      
      // Grant to new user
      await prisma.creditTransaction.create({
        data: {
          userId: newUserId,
          action: 'referral.new',
          amount: newBonus,
          status: 'granted',
          meta: {
            reason: 'referral.new',
            referrer_user_id: referrerId
          }
        }
      });

      // Update user credits balances
      await prisma.userCredits.upsert({
        where: { userId: referrerId },
        update: { 
          credits: { increment: refBonus }
        },
        create: {
          userId: referrerId,
          credits: refBonus
        }
      });

      await prisma.userCredits.upsert({
        where: { userId: newUserId },
        update: { 
          credits: { increment: newBonus }
        },
        create: {
          userId: newUserId,
          credits: newBonus
        }
      });

      console.log(`✅ Referral processed: ${refBonus} credits to referrer, ${newBonus} credits to new user`);
    } else {
      console.log(`ℹ️ Referral already processed for user ${newUserId}`);
    }

    await prisma.$disconnect();
    return json({ ok: true });
  } catch (e) {
    console.error('❌ Referral processing error:', e);
    return json({ ok: false, error: 'INTERNAL_ERROR', details: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 });
  }
};
