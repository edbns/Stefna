// OTP Service for Authentication
export interface OTPResult {
  success: boolean
  error?: string
}

class OTPService {
  private static instance: OTPService

  static getInstance(): OTPService {
    if (!OTPService.instance) {
      OTPService.instance = new OTPService()
    }
    return OTPService.instance
  }

  private constructor() {}

  // Send OTP email
  async sendOTP(email: string): Promise<OTPResult> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    
    try {
      console.log('🔧 Sending OTP to:', email, 'Code:', otp)
      
      const response = await fetch('/.netlify/functions/send-otp-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('📧 OTP Send Error:', errorData)
        throw new Error(errorData.error || 'Failed to send OTP')
      }

      const result = await response.json()
      console.log('📧 OTP sent successfully:', result)

      // Store OTP for verification (consider more secure methods)
      localStorage.setItem('otp', otp)
      localStorage.setItem('otpEmail', email)
      localStorage.setItem('otpTimestamp', Date.now().toString())

      return { success: true }
    } catch (error) {
      console.error('📧 OTP Send Error:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Failed to send OTP' }
    }
  }

  // Verify OTP
  verifyOTP(userInputOTP: string): OTPResult {
    const storedOTP = localStorage.getItem('otp')
    const storedEmail = localStorage.getItem('otpEmail')
    const storedTimestamp = localStorage.getItem('otpTimestamp')

    if (!storedOTP || !storedEmail || !storedTimestamp) {
      return { success: false, error: 'No OTP found. Please request a new one.' }
    }

    // Check if OTP has expired (10 minutes)
    const now = Date.now()
    const otpTime = parseInt(storedTimestamp)
    const tenMinutes = 10 * 60 * 1000 // 10 minutes in milliseconds

    if (now - otpTime > tenMinutes) {
      // Clear expired OTP
      this.clearOTP()
      return { success: false, error: 'OTP has expired. Please request a new one.' }
    }

    if (userInputOTP === storedOTP) {
      // Clear OTP after successful verification
      this.clearOTP()
      return { success: true }
    }

    return { success: false, error: 'Invalid OTP code. Please try again.' }
  }

  // Clear OTP from localStorage
  clearOTP(): void {
    localStorage.removeItem('otp')
    localStorage.removeItem('otpEmail')
    localStorage.removeItem('otpTimestamp')
  }

  // Check if OTP exists and is not expired
  hasValidOTP(): boolean {
    const storedOTP = localStorage.getItem('otp')
    const storedTimestamp = localStorage.getItem('otpTimestamp')

    if (!storedOTP || !storedTimestamp) {
      return false
    }

    const now = Date.now()
    const otpTime = parseInt(storedTimestamp)
    const tenMinutes = 10 * 60 * 1000

    return (now - otpTime) <= tenMinutes
  }

  // Get remaining time for OTP
  getOTPRemainingTime(): number {
    const storedTimestamp = localStorage.getItem('otpTimestamp')
    if (!storedTimestamp) return 0

    const now = Date.now()
    const otpTime = parseInt(storedTimestamp)
    const tenMinutes = 10 * 60 * 1000
    const remaining = tenMinutes - (now - otpTime)

    return Math.max(0, Math.floor(remaining / 1000)) // Return seconds
  }
}

export default OTPService 