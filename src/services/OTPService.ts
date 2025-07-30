export async function sendOTP(email: string, otp: string) {
  try {
    // Try Netlify function first
    const res = await fetch('/.netlify/functions/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });

    const data = await res.json();

    if (res.ok) {
      return data;
    } else {
      // Check if it's a configuration error
      if (data.error && data.error.includes('RESEND_API_KEY')) {
        console.log('Email service not configured, using development fallback');
        console.log(`🔐 Development OTP for ${email}: ${otp}`);
        console.log('📧 Please configure RESEND_API_KEY in Netlify environment variables');
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return { 
          message: 'OTP sent! Check console for development code',
          development: true,
          otp: otp,
          configError: true
        };
      }
      
      // Other error
      console.log('Netlify function failed, using development fallback');
      console.log(`🔐 Development OTP for ${email}: ${otp}`);
      console.log('📧 In production, this would be sent via email');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return { 
        message: 'OTP sent! Check console for development code',
        development: true,
        otp: otp
      };
    }
  } catch (error) {
    console.error('OTP send error:', error);
    
    // Fallback for development
    console.log(`🔐 Development OTP for ${email}: ${otp}`);
    console.log('📧 In production, this would be sent via email');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return { 
      message: 'OTP sent! Check console for development code',
      development: true,
      otp: otp
    };
  }
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export interface OTPResponse {
  message: string;
  development?: boolean;
  otp?: string;
}

export interface OTPError {
  message: string;
  error?: any;
} 