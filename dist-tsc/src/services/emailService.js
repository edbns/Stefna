// Email Service for Netlify Edge Functions
// Handles OTP email sending via Resend
class EmailService {
    constructor() {
        Object.defineProperty(this, "baseUrl", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        // Use Netlify Edge Function URL
        this.baseUrl = import.meta.env.DEV
            ? 'http://localhost:8888/.netlify/edge-functions/send-otp-email'
            : '/api/send-otp-email';
    }
    // Send OTP email via Netlify Edge Function
    async sendOTPEmail(email, otp) {
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
            });
            const data = await response.json();
            if (!response.ok) {
                console.error('Email service error:', data);
                return {
                    success: false,
                    error: data.error || 'Failed to send email'
                };
            }
            return {
                success: true,
                data
            };
        }
        catch (error) {
            console.error('Email service error:', error);
            return {
                success: false,
                error: 'Network error while sending email'
            };
        }
    }
    // Send referral email via Netlify Function
    async sendReferralEmail(referralData) {
        try {
            const response = await fetch('/.netlify/functions/sendEmail', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    to: referralData.friendEmail,
                    subject: `You've Been Invited to Stefna – 25 Free Credits Inside`,
                    text: this.generateReferralEmailText(referralData)
                })
            });
            const data = await response.json();
            if (!response.ok) {
                console.error('Referral email service error:', data);
                return {
                    success: false,
                    error: data.error || 'Failed to send referral email'
                };
            }
            return {
                success: true,
                data
            };
        }
        catch (error) {
            console.error('Referral email service error:', error);
            return {
                success: false,
                error: 'Network error while sending referral email'
            };
        }
    }
    // Generate referral email text
    generateReferralEmailText(data) {
        const signupUrl = data.referralCode
            ? `https://stefna.xyz/auth?ref=${data.referralCode}`
            : 'https://stefna.xyz/auth';
        return `Someone invited you to try Stefna — a new way to generate high-quality AI images (and soon, videos).

As a referred user, you get 25 bonus credits the moment you sign up.

No subscriptions, no verification, just creative freedom with a daily 30 credit limit for everyone.

Use your 25 extra credits however you like — on top of your daily allowance.

Join now and start creating.

${signupUrl}

— The Stefna Team`;
    }
    // Generate a random 6-digit OTP
    generateOTP() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
    // Send OTP with auto-generated code
    async sendOTP(email) {
        const otp = this.generateOTP();
        return this.sendOTPEmail(email, otp);
    }
}
export default new EmailService();
