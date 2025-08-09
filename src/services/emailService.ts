// Email Service for Netlify Edge Functions
// Handles OTP email sending via Resend

interface EmailResponse {
  success: boolean
  error?: string
  data?: any
}

interface ReferralEmailData {
  referrerEmail: string
  referrerName?: string
  friendEmail: string
  referralCode?: string
}

class EmailService {
  private baseUrl: string

  constructor() {
    // Use Netlify Edge Function URL
    this.baseUrl = import.meta.env.DEV 
      ? 'http://localhost:8888/.netlify/edge-functions/send-otp-email'
      : '/api/send-otp-email'
  }

  // Send OTP email via Netlify Edge Function
  async sendOTPEmail(email: string, otp: string): Promise<EmailResponse> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          otp
        })
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('Email service error:', data)
        return {
          success: false,
          error: data.error || 'Failed to send email'
        }
      }

      return {
        success: true,
        data
      }
    } catch (error) {
      console.error('Email service error:', error)
      return {
        success: false,
        error: 'Network error while sending email'
      }
    }
  }

  // Send referral email via Netlify Function
  async sendReferralEmail(referralData: ReferralEmailData): Promise<EmailResponse> {
    try {
      const response = await fetch('/.netlify/functions/sendEmail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: referralData.friendEmail,
          subject: `${referralData.referrerName || 'A friend'} invited you to Stefna! 🎨`,
          html: this.generateReferralEmailHTML(referralData)
        })
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('Referral email service error:', data)
        return {
          success: false,
          error: data.error || 'Failed to send referral email'
        }
      }

      return {
        success: true,
        data
      }
    } catch (error) {
      console.error('Referral email service error:', error)
      return {
        success: false,
        error: 'Network error while sending referral email'
      }
    }
  }

  // Generate referral email HTML
  private generateReferralEmailHTML(data: ReferralEmailData): string {
    const referrerName = data.referrerName || 'A friend'
    const signupUrl = data.referralCode 
      ? `https://stefna.xyz/auth?ref=${data.referralCode}`
      : 'https://stefna.xyz/auth'

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #000000; color: #ffffff;">
        <div style="text-align: center; padding: 40px 20px;">
          <!-- Logo -->
          <img src="https://stefna.xyz/logo.png" alt="Stefna" style="width: 80px; height: 80px; margin-bottom: 30px;">
          
          <!-- Main content -->
          <div style="background-color: #1a1a1a; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
            <h1 style="color: #ffffff; font-size: 24px; margin-bottom: 10px;">You've been invited!</h1>
            <p style="color: #cccccc; font-size: 16px; margin-bottom: 30px;">Join Stefna and start creating with AI</p>
            
            <p style="color: #cccccc; font-size: 14px; line-height: 1.5; margin-bottom: 20px;">
              <strong>${referrerName}</strong> thinks you'd love Stefna - the AI-powered creative platform where you can transform photos and videos with just a prompt.
            </p>
            
            <p style="color: #cccccc; font-size: 14px; line-height: 1.5; margin-bottom: 30px;">
              Create stunning AI art, remix existing content, and explore endless creative possibilities.
            </p>
            
            <div style="background-color: #1a1a1a; padding: 20px; border-radius: 10px; margin: 30px 0; border: 1px solid #333333;">
              <p style="color: #888888; font-size: 12px; text-transform: uppercase; margin-bottom: 10px;">Special Bonus</p>
              <p style="color: #ffffff; font-size: 14px; margin: 0;">
                Sign up with this invite and get <strong>25 bonus tokens</strong> to start creating immediately!
              </p>
            </div>
            
            <a href="${signupUrl}" 
               style="display: inline-block; background-color: #ffffff; color: #000000; text-decoration: none; padding: 15px 30px; border-radius: 10px; font-weight: bold; font-size: 16px; margin: 20px 0;">
              Join Stefna Now
            </a>
            
            <p style="color: #888888; font-size: 14px; margin-top: 20px;">
              No credit card required • Start creating in seconds
            </p>
          </div>
          
          <!-- Features -->
          <div style="background-color: #1a1a1a; padding: 30px; border-radius: 15px; margin-bottom: 30px;">
            <h2 style="color: #ffffff; font-size: 20px; margin-bottom: 20px;">What you can do with Stefna:</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; text-align: left;">
              <div>
                <h3 style="color: #ffffff; font-size: 16px; margin-bottom: 8px;">AI Art Generation</h3>
                <p style="color: #cccccc; font-size: 14px;">Create stunning images from text prompts</p>
              </div>
              <div>
                <h3 style="color: #ffffff; font-size: 16px; margin-bottom: 8px;">Video Transformation</h3>
                <p style="color: #cccccc; font-size: 14px;">Transform videos with AI-powered effects</p>
              </div>
              <div>
                <h3 style="color: #ffffff; font-size: 16px; margin-bottom: 8px;">Content Remixing</h3>
                <p style="color: #cccccc; font-size: 14px;">Remix and enhance existing media</p>
              </div>
              <div>
                <h3 style="color: #ffffff; font-size: 16px; margin-bottom: 8px;">Instant Results</h3>
                <p style="color: #cccccc; font-size: 14px;">Get results in seconds, not hours</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="border-top: 1px solid #333333; padding: 30px 20px; text-align: center;">
          <p style="color: #ffffff; font-size: 14px; margin-bottom: 5px;">Stefna - Turn Moments into Masterpieces—No Limits</p>
          <p style="color: #888888; font-size: 12px; margin-bottom: 5px;">This email was sent to ${data.friendEmail}</p>
          <p style="color: #888888; font-size: 12px;">If you have any questions, contact us at hello@stefna.xyz</p>
        </div>
      </div>
    `
  }

  // Generate a random 6-digit OTP
  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  // Send OTP with auto-generated code
  async sendOTP(email: string): Promise<EmailResponse> {
    const otp = this.generateOTP()
    return this.sendOTPEmail(email, otp)
  }
}

export default new EmailService() 