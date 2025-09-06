// Email Service for Netlify Functions
// Handles all email types via universal sendEmail function

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

interface EmailData {
  to: string
  subject: string
  text?: string
  html?: string
  type?: string
  data?: any
}

class EmailService {
  private baseUrl: string

  constructor() {
    // Use Netlify Function URL
    this.baseUrl = import.meta.env.DEV 
      ? 'http://localhost:8888/.netlify/functions/sendEmail'
      : '/.netlify/functions/sendEmail'
  }

  // Universal email sending method
  async sendEmail(emailData: EmailData): Promise<EmailResponse> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData)
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

  // Send OTP email
  async sendOTPEmail(email: string, otp: string): Promise<EmailResponse> {
    return this.sendEmail({
      to: email,
      subject: `Your Stefna Login Code **${otp}**`,
      text: `Hello,

Your one-time login code is:

**${otp}**

This code will expire in 10 minutes. If you didn't request it, you can safely ignore this email.`,
      type: 'otp',
      data: { otp }
    })
  }

  // Send welcome email
  async sendWelcomeEmail(email: string): Promise<EmailResponse> {
    return this.sendEmail({
      to: email,
      subject: 'Welcome to Stefna',
      text: `Welcome!

Thanks for joining Stefna — where moments turn into masterpieces. You've got 30 free credits today to try our AI transformations.

Need help? Just reply to this email.

Let's create something amazing.`,
      type: 'welcome'
    })
  }

  // Send account deleted email
  async sendAccountDeletedEmail(email: string): Promise<EmailResponse> {
    return this.sendEmail({
      to: email,
      subject: 'Your Stefna Account Has Been Deleted',
      text: `Hello,

This is to confirm that your Stefna account has been permanently deleted.

If this was a mistake, we're here to help — but your data has been fully removed for your privacy.

Thank you for being part of Stefna.`,
      type: 'account_deleted'
    })
  }

  // Send inactive user reminder
  async sendInactiveReminderEmail(email: string): Promise<EmailResponse> {
    return this.sendEmail({
      to: email,
      subject: "Haven't seen you in a while",
      text: `Hey there,

Just a quick reminder — your daily credits on Stefna have refreshed.

Come back and transform your next photo. It only takes a moment.

See what you can create → stefna.xyz`,
      type: 'inactive_reminder'
    })
  }

  // Send referral bonus received email
  async sendReferralBonusEmail(email: string): Promise<EmailResponse> {
    return this.sendEmail({
      to: email,
      subject: 'You earned bonus credits',
      text: `Nice work!

You earned +50 credits for referring a friend to Stefna. They signed up and joined the fun.

Use your bonus now → stefna.xyz`,
      type: 'referral_bonus'
    })
  }

  // Send credit warning email
  async sendCreditWarningEmail(email: string, remainingCredits: number): Promise<EmailResponse> {
    return this.sendEmail({
      to: email,
      subject: "You're almost out of credits today",
      text: `Heads up — you're running low on credits.

Don't worry, they refresh daily. Want more? Invite a friend and earn bonus credits instantly.

Check your balance → stefna.xyz/profile`,
      type: 'credits_low',
      data: { remainingCredits }
    })
  }

  // Send referral email
  async sendReferralEmail(referralData: ReferralEmailData): Promise<EmailResponse> {
    return this.sendEmail({
      to: referralData.friendEmail,
      subject: 'Your Friend Invited You to Try Stefna',
      text: `Hey there,

Your friend invited you to try Stefna — the AI photo transformation studio that turns any selfie or Photo into cinematic magic.

Join now and you'll receive +25 free credits to get started right away.

Claim your credits here:
https://stefna.xyz/auth?ref=${referralData.referrerEmail}

No account? Get one. It only takes seconds.

Let your creativity run wild — no limits.`,
      type: 'referral',
      data: { referrerEmail: referralData.referrerEmail }
    })
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