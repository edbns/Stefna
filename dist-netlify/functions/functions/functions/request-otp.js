"use strict";
const { neon } = require('@neondatabase/serverless');
const { Resend } = require('resend');
exports.handler = async (event, context) => {
    console.log('=== OTP REQUEST FUNCTION STARTED ===');
    console.log('Event method:', event.httpMethod);
    console.log('Event body:', event.body);
    // Handle CORS
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: ''
        };
    }
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }
    try {
        const { email } = JSON.parse(event.body);
        console.log('Parsed email:', email);
        if (!email || !email.includes('@')) {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ error: 'Valid email is required' })
            };
        }
        // Check required environment variables
        const databaseUrl = process.env.NETLIFY_DATABASE_URL;
        const resendApiKey = process.env.RESEND_API_KEY;
        console.log('=== ENVIRONMENT VARIABLES ===');
        console.log('NETLIFY_DATABASE_URL:', databaseUrl ? 'LOADED' : 'MISSING');
        console.log('RESEND_API_KEY:', resendApiKey ? 'LOADED' : 'MISSING');
        if (!databaseUrl) {
            console.error('Missing Neon database environment variable');
            return {
                statusCode: 500,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ error: 'Database configuration error' })
            };
        }
        if (!resendApiKey) {
            console.error('Missing Resend API key');
            return {
                statusCode: 500,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ error: 'Email service configuration error' })
            };
        }
        console.log('=== CREATING NEON CLIENT ===');
        const sql = neon(databaseUrl);
        console.log('Neon client:', sql ? 'CREATED' : 'FAILED TO CREATE');
        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        console.log('=== GENERATED OTP ===');
        console.log('OTP:', otp);
        console.log('Expires at:', expiresAt.toISOString());
        // Try to create OTP table with error handling
        try {
            console.log('=== CREATING OTP TABLE ===');
            await sql `
        CREATE TABLE IF NOT EXISTS auth_otps (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          email text NOT NULL,
          code text NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now(),
          expires_at timestamptz NOT NULL,
          used boolean DEFAULT false
        )
      `;
            // Create indexes
            await sql `
        CREATE INDEX IF NOT EXISTS auth_otps_email_idx ON auth_otps(email);
        CREATE INDEX IF NOT EXISTS auth_otps_expires_idx ON auth_otps(expires_at);
      `;
            console.log('OTP table and indexes created successfully');
        }
        catch (tableError) {
            console.error('Failed to create OTP table:', tableError);
            // Continue anyway - table might already exist
        }
        // Try to insert OTP
        let otpInserted = false;
        try {
            console.log('=== INSERTING OTP ===');
            const insertResult = await sql `
        INSERT INTO auth_otps (email, code, expires_at)
        VALUES (${email.toLowerCase()}, ${otp}, ${expiresAt.toISOString()})
        RETURNING id
      `;
            console.log('OTP inserted successfully:', insertResult[0]);
            otpInserted = true;
        }
        catch (insertError) {
            console.error('Failed to insert OTP:', insertError);
            // Continue with email sending even if DB insert fails
        }
        // Send email via Resend
        console.log('=== SENDING EMAIL ===');
        const resend = new Resend(resendApiKey);
        try {
            const { data: emailData, error: emailError } = await resend.emails.send({
                from: 'Stefna <hello@stefna.xyz>',
                to: [email],
                subject: `Your Stefna Login Code`,
                text: `Here's your one-time login code:

${otp}

It expires in 10 minutes. If you didn't request this code, you can ignore this email.

— The Stefna Team`
            });
            if (emailError) {
                console.error('Email sending failed:', emailError);
                return {
                    statusCode: 500,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        error: 'Failed to send email',
                        details: emailError.message || 'Unknown email error'
                    })
                };
            }
            console.log('=== EMAIL SENT SUCCESSFULLY ===');
            console.log('Email data:', emailData);
            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    success: true,
                    message: 'OTP sent successfully',
                    otpStored: otpInserted
                })
            };
        }
        catch (emailError) {
            console.error('Email sending error:', emailError);
            return {
                statusCode: 500,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    error: 'Failed to send email',
                    details: emailError.message || 'Unknown email error'
                })
            };
        }
    }
    catch (err) {
        console.error('=== FUNCTION ERROR ===');
        console.error('Function error:', err);
        console.error('Error stack:', err.stack);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                error: 'Internal server error',
                details: err.message || 'Unknown error'
            })
        };
    }
};
