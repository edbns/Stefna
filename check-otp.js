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
        console.log(`${index + 1}. Email: ${otp.email}, Code: ${otp.code}, Used: ${otp.used}, Expires: ${otp.expiresAt}`);
      });
    }

    // Check specific email
    const specificOtp = await prisma.authOtp.findFirst({
      where: {
        email: 'test@stefna.com'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (specificOtp) {
      console.log('\nLatest OTP for test@stefna.com:');
      console.log('Code:', specificOtp.code);
      console.log('Used:', specificOtp.used);
      console.log('Expires:', specificOtp.expiresAt);
      console.log('Created:', specificOtp.createdAt);
    } else {
      console.log('\nNo OTP found for test@stefna.com');
    }

    // Try to create a test OTP to see what error occurs
    console.log('\n=== TESTING OTP CREATION ===');
    try {
      const testOtp = await prisma.authOtp.create({
        data: {
          email: 'test@stefna.com',
          code: '123456',
          expiresAt: new Date(Date.now() + 10 * 60 * 1000)
        }
      });
      console.log('✅ Test OTP created successfully:', testOtp.id);
      
      // Clean up test OTP
      await prisma.authOtp.delete({
        where: { id: testOtp.id }
      });
      console.log('✅ Test OTP cleaned up');
      
    } catch (createError) {
      console.error('❌ Failed to create test OTP:', createError);
      console.error('Error details:', createError.message);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOTP();
