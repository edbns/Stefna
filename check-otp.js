import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkOTP() {
  try {
    // Check all OTPs
    const allOtps = await prisma.authOtp.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Total OTPs in database: ${allOtps.length}`);
    
    if (allOtps.length > 0) {
      console.log('\nLatest OTPs:');
      allOtps.slice(0, 5).forEach((otp, index) => {
        console.log(`${index + 1}. ID: ${otp.id}, Email: ${otp.email}, Code: ${otp.code}, Used: ${otp.used}, Expires: ${otp.expiresAt}, Created: ${otp.createdAt}`);
      });
    }

    // Check specific email
    const specificOtp = await prisma.authOtp.findFirst({
      where: {
        email: 'souhil@pm.me'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (specificOtp) {
      console.log('\nLatest OTP for souhil@pm.me:');
      console.log('ID:', specificOtp.id);
      console.log('Code:', specificOtp.code);
      console.log('Used:', specificOtp.used);
      console.log('Expires:', specificOtp.expiresAt);
      console.log('Created:', specificOtp.createdAt);
      
      // Check if OTP is expired
      const now = new Date();
      const isExpired = specificOtp.expiresAt < now;
      console.log('Current time:', now);
      console.log('Is expired:', isExpired);
      console.log('Time until expiry:', specificOtp.expiresAt.getTime() - now.getTime(), 'ms');
    } else {
      console.log('\nNo OTP found for souhil@pm.me');
    }

    // Check for the specific OTP code 618154
    const otp618154 = await prisma.authOtp.findFirst({
      where: {
        code: '618154'
      }
    });

    if (otp618154) {
      console.log('\nOTP with code 618154 found:');
      console.log('ID:', otp618154.id);
      console.log('Email:', otp618154.email);
      console.log('Used:', otp618154.used);
      console.log('Expires:', otp618154.expiresAt);
      console.log('Created:', otp618154.createdAt);
    } else {
      console.log('\nOTP with code 618154 NOT found');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOTP();
