import type { Handler } from "@netlify/functions";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "./_lib/auth";
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
    const { userId: newUserId, email: newUserEmail } = requireAuth(event.headers.authorization);
    const body = event.body ? JSON.parse(event.body) : {};
    const referrerEmail: string = body.referrerEmail;
    if (!referrerEmail) return json({ ok:false, error:"MISSING_REFERRER_EMAIL" }, { status: 400 });

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
    
    if (!referrer) return json({ ok:false, error:"REFERRER_NOT_FOUND" }, { status: 404 });
    const referrerId = referrer.id;

    // Upsert referral row — unique on new_user_id prevents double awards
    await prisma.referralSignup.upsert({
      where: { new_user_id: newUserId },
      update: {}, // Don't update if exists
      create: {
        id: crypto.randomUUID(), // Generate UUID for the referral record
        referrer_user_id: referrerId,
        new_user_id: newUserId,
        referrer_email: referrerEmail,
        new_user_email: newUserEmail ?? null
      }
    });

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
      // Get bonus amounts from app config
      const refBonusConfig = await prisma.appConfig.findUnique({
        where: { key: 'referral_referrer_bonus' }
      });
      const newBonusConfig = await prisma.appConfig.findUnique({
        where: { key: 'referral_new_bonus' }
      });
      
      const refBonus = refBonusConfig?.value ? parseInt(String(refBonusConfig.value)) : 50;
      const newBonus = newBonusConfig?.value ? parseInt(String(newBonusConfig.value)) : 25;

      // Grant to referrer
      await prisma.creditTransaction.create({
        data: {
          userId: referrerId,
          requestId: crypto.randomUUID(),
          action: 'referral.referrer',
          amount: refBonus,
          status: 'granted',
          meta: {
            reason: 'referral_referrer',
            new_user_id: newUserId
          },
          createdAt: new Date()
        }
      });

      // Grant to new user
      await prisma.creditTransaction.create({
        data: {
          userId: newUserId,
          requestId: crypto.randomUUID(),
          action: 'referral.new',
          amount: newBonus,
          status: 'granted',
          meta: {
            reason: 'referral_new',
            referrer_user_id: referrerId
          },
          createdAt: new Date()
        }
      });

      // Update user credits balances
      await prisma.userCredits.upsert({
        where: { user_id: referrerId },
        update: { 
          balance: { increment: refBonus },
          updated_at: new Date()
        },
        create: {
          user_id: referrerId,
          balance: refBonus,
          updated_at: new Date()
        }
      });

      await prisma.userCredits.upsert({
        where: { user_id: newUserId },
        update: { 
          balance: { increment: newBonus },
          updated_at: new Date()
        },
        create: {
          user_id: newUserId,
          balance: newBonus,
          updated_at: new Date()
        }
      });
    }

    await prisma.$disconnect();
    return json({ ok:true });
  } catch (e) {
    console.error('Referral processing error:', e);
    return json({ ok: false, error: 'INTERNAL_ERROR', details: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 });
  }
};
