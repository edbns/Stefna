import type { Handler } from '@netlify/functions';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4, v4 as randomUUID } from 'uuid';
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
    const user = await prisma.user.findFirst({
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
          user_id: userId,
          balance: starterAmount,
          updated_at: now
        }
      });
      
      await prisma.creditTransaction.create({
        data: {
          userId: userId,
          requestId: uuidv4(),
          action: 'starter_grant',
          status: 'committed',
          amount: starterAmount,
          createdAt: now
        }
      });
      
      console.log(`New user created with ${starterAmount} starter credits`);
      
      // 🔒 CREATE PRIVATE USER SETTINGS FOR NEW USERS
      await prisma.userSettings.create({
        data: {
          id: `settings-${userId}`,
          userId: userId,
          shareToFeed: false,  // 🔒 PRIVACY FIRST: New users start private
          allowRemix: true,
          updatedAt: now
        }
      });
      
      console.log(`🔒 New user privacy settings created: shareToFeed=false (private by default)`);
      
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
                id: uuidv4(),
                referrer_user_id: referrerId,
                new_user_id: userId,
                referrer_email: referrerEmail.toLowerCase(),
                new_user_email: email.toLowerCase(),
                created_at: now
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
                requestId: randomUUID(),
                action: 'referral_referrer',
                status: 'committed',
                amount: refBonusAmount,
                createdAt: now
              }
            });
            
            // Award new user
            await prisma.creditTransaction.create({
              data: {
                userId: userId,
                requestId: randomUUID(),
                action: 'referral_new',
                status: 'committed',
                amount: newBonusAmount,
                createdAt: now
              }
            });
            
            // Update balances
            await prisma.userCredits.update({
              where: { user_id: referrerId },
              data: { balance: { increment: refBonusAmount } }
            });
            
            await prisma.userCredits.update({
              where: { user_id: userId },
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
                        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Stefna</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            margin: 0; 
            padding: 0; 
            background-color: #000000; 
            color: #ffffff;
        }
                            .container { 
                        max-width: 600px; 
                        margin: 0 auto; 
                        background-color: #000000; 
                        padding: 40px 30px;
                        text-align: center;
                    }
        .logo { 
            text-align: center; 
            margin-bottom: 40px;
        }
        .logo img {
            height: 60px;
            width: auto;
        }
                            .content { 
                        line-height: 1.6;
                        text-align: center;
                    }
        .welcome-box { 
            background-color: #1a1a1a; 
            border: 2px solid #333333; 
            border-radius: 8px; 
            padding: 30px; 
            text-align: center; 
            margin: 30px 0;
        }
        .credits { 
            font-size: 32px; 
            font-weight: 700; 
            color: #ffffff; 
            margin: 20px 0;
        }
        .highlight { 
            background-color: #1a1a1a; 
            border-radius: 6px; 
            padding: 20px; 
            margin: 20px 0;
            border: 1px solid #333333;
        }
        .cta { 
            background-color: #ffffff; 
            color: #000000; 
            padding: 15px 30px; 
            border-radius: 6px; 
            text-decoration: none; 
            display: inline-block; 
            margin: 20px 0; 
            font-weight: 600;
        }
                            .footer { 
                        margin-top: 40px; 
                        text-align: center; 
                        color: #ffffff; 
                        font-size: 14px;
                        border-top: 1px solid #333333;
                        padding-top: 20px;
                    }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <img src="https://stefna.xyz/logo.png" alt="Stefna" />
        </div>
        
        <div class="content">
            <h2 style="margin-top: 0; color: #ffffff;">Welcome to Stefna</h2>
            <p>Your account is now active, and we've already added <strong>30 credits</strong> to get you started.</p>
            
            <div class="welcome-box">
                <div class="credits">30 Credits</div>
                <p>That's enough to create up to 15 high-quality images today. Credits reset daily, so you'll get 30 more tomorrow.</p>
            </div>
            
            <div class="highlight">
                <strong>No tiers, no gimmicks, and no social media verification.</strong><br>
                Everyone gets the same creative power.
            </div>
            
            <div style="text-align: center;">
                <a href="https://stefna.xyz" class="cta">Start Creating Now</a>
            </div>
        </div>
        
        <div class="footer">
            <p>This email was sent to: ${email}</p>
            <p>Stefna 2025 all rights reserved</p>
        </div>
    </div>
</body>
</html>`,
            text: `Welcome to Stefna.

Your account is now active, and we've already added 30 credits to get you started. That's enough to create up to 15 high-quality images today. Credits reset daily, so you'll get 30 more tomorrow.

There are no tiers, no gimmicks, and no social media verification. Everyone gets the same creative power.

Start creating now.

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
