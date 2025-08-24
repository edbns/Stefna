import type { Handler } from '@netlify/functions';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import * as jwt from 'jsonwebtoken';
import { Resend } from 'resend';

const prisma = new PrismaClient();

export const handler: Handler = async (event) => {
  console.log('=== VERIFY OTP FUNCTION STARTED ===');
  
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    };
  }
  
  try {
    if (event.httpMethod !== 'POST') {
      return { 
        statusCode: 405, 
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Method Not Allowed' })
      };
    }
    
    const { email, otp, referrerEmail } = JSON.parse(event.body || '{}');
    console.log('Input:', { email, otp, referrerEmail });
    if (!email || !otp) {
      return { 
        statusCode: 400, 
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Email and OTP required' })
      };
    }
    
    console.log('=== USING PRISMA CLIENT ===');

    // 1) Verify OTP exists, not used, and not expired
    const now = new Date();
    console.log('Looking up OTP for email:', email, 'code:', otp, 'at time:', now);
    
    const otpRecord = await prisma.authOtp.findFirst({
      where: {
        email: email.toLowerCase(),
        code: otp,
        used: false,
        expiresAt: {
          gt: now
        }
      }
    });
    
    console.log('OTP lookup result:', otpRecord);

    if (!otpRecord) {
      console.log('Invalid or expired OTP');
      return { 
        statusCode: 401, 
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Invalid or expired OTP' })
      };
    }

    // 2) Mark OTP as used
    const otpId = otpRecord.id;
    console.log('Marking OTP as used:', otpId);
    
    await prisma.authOtp.update({
      where: { id: otpId },
      data: { used: true }
    });
    
    // 3) Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });
    
    let userId: string;
    let isNewUser = false;
    
    if (user) {
      // User exists
      userId = user.id;
      console.log('Existing user found:', userId);
    } else {
      // Create new user
      isNewUser = true;
      userId = uuidv4();
      console.log('Creating new user with ID:', userId);
      
      await prisma.user.create({
        data: {
          id: userId,
          email: email.toLowerCase(),
          createdAt: now
        }
      });
      
      // Initialize user credits
      const starterGrant = await prisma.appConfig.findUnique({
        where: { key: 'starter_grant' }
      });
      const starterAmount = starterGrant?.value ? parseInt(String(starterGrant.value)) : 30;
      
      await prisma.userCredits.create({
        data: {
          userId: userId,
          balance: starterAmount,
          updatedAt: now
        }
      });
      
      await prisma.creditTransaction.create({
        data: {
          userId: userId,
          reason: 'starter_grant',
          amount: starterAmount,
          env: 'production',
          createdAt: now
        }
      });
      
      console.log(`New user created with ${starterAmount} starter credits`);
      
      // Process referral if provided
      if (referrerEmail) {
        try {
          const referrer = await prisma.user.findUnique({
            where: { email: referrerEmail.toLowerCase() }
          });
          
          if (referrer) {
            const referrerId = referrer.id;
            
            // Insert referral record
            await prisma.referralSignup.create({
              data: {
                referrerUserId: referrerId,
                newUserId: userId,
                referrerEmail: referrerEmail.toLowerCase(),
                newUserEmail: email.toLowerCase(),
                createdAt: now
              }
            });
            
            // Award referral bonuses
            const refBonus = await prisma.appConfig.findUnique({
              where: { key: 'referral_referrer_bonus' }
            });
            const newBonus = await prisma.appConfig.findUnique({
              where: { key: 'referral_new_bonus' }
            });
            
            const refBonusAmount = refBonus?.value ? parseInt(String(refBonus.value)) : 50;
            const newBonusAmount = newBonus?.value ? parseInt(String(newBonus.value)) : 25;
            
            // Award referrer
            await prisma.creditTransaction.create({
              data: {
                userId: referrerId,
                reason: 'referral_referrer',
                status: 'committed',
                amount: refBonusAmount,
                env: 'production',
                createdAt: now
              }
            });
            
            // Award new user
            await prisma.creditTransaction.create({
              data: {
                userId: userId,
                reason: 'referral_new',
                amount: newBonusAmount,
                env: 'production',
                createdAt: now
              }
            });
            
            // Update balances
            await prisma.userCredits.update({
              where: { userId: referrerId },
              data: { balance: { increment: refBonusAmount } }
            });
            
            await prisma.userCredits.update({
              where: { userId: userId },
              data: { balance: { increment: newBonusAmount } }
            });
            
            console.log(`Referral processed: ${refBonusAmount} credits to referrer, ${newBonusAmount} credits to new user`);
          }
        } catch (referralError) {
          console.error('Referral processing failed:', referralError);
          // Don't fail the main flow if referral fails
        }
      }
    }
    
    // 4) Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('Missing JWT_SECRET environment variable');
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Server configuration error' })
      };
    }
    
    const token = jwt.sign(
      { 
        sub: userId, 
        email: email.toLowerCase(),
        iat: Math.floor(Date.now() / 1000)
      },
      jwtSecret,
      { 
        expiresIn: '7d',
        audience: 'stefna-app',
        issuer: 'stefna'
      }
    );
    
    console.log('JWT token generated successfully');
    
    // 5) Send welcome email for new users
    if (isNewUser) {
      try {
        const resendApiKey = process.env.RESEND_API_KEY;
        if (resendApiKey) {
          const resend = new Resend(resendApiKey);
          await resend.emails.send({
            from: 'Stefna <hello@stefna.xyz>',
            to: [email],
            subject: 'Welcome to Stefna – Your 30 Credits Are Ready',
            text: `Welcome to Stefna.

Your account is now active, and we've already added 30 credits to get you started. That's enough to generate up to 15 high-quality images today. Credits reset daily, so you'll get 30 more tomorrow.

There are no tiers, no gimmicks, and no social media verification. Everyone gets the same creative power.

Start generating now.

— The Stefna Team`
          });
          console.log('Welcome email sent successfully');
        }
      } catch (emailError) {
        console.error('Welcome email failed:', emailError);
        // Don't fail the main flow if email fails
      }
    }
    
    // 6) Return success response
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        token,
        user: {
          id: userId,
          email: email.toLowerCase(),
          isNewUser
        }
      })
    };
    
  } catch (error: any) {
    console.error('=== VERIFY OTP FUNCTION ERROR ===');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Internal server error',
        details: error.message || 'Unknown error'
      })
    };
  }
};
