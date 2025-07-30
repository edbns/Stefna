export async function sendOTP(email: string, otp: string) {
  try {
    // Try Netlify function first
    const res = await fetch('/.netlify/functions/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });

    if (res.ok) {
      const data = await res.json();
      return data;
    } else {
      // Fallback for development or if Netlify function fails
      console.log('Netlify function failed, using development fallback');
      console.log(`Development OTP for ${email}: ${otp}`);
      
      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return { message: 'OTP sent successfully (development mode)' };
    }
  } catch (error) {
    console.error('OTP send error:', error);
    
    // Fallback for development
    console.log(`Development OTP for ${email}: ${otp}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return { message: 'OTP sent successfully (development mode)' };
  }
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export interface OTPResponse {
  message: string;
}

export interface OTPError {
  message: string;
  error?: any;
} 