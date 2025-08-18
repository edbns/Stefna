"use strict";
const { Resend } = require('resend');
exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }
    try {
        const { email, name } = JSON.parse(event.body);
        if (!email) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Email is required' })
            };
        }
        const resendApiKey = process.env.RESEND_API_KEY;
        if (!resendApiKey) {
            console.error('Missing Resend API key');
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Email service configuration error' })
            };
        }
        const resend = new Resend(resendApiKey);
        const { data: emailData, error: emailError } = await resend.emails.send({
            from: 'Stefna <hello@stefna.xyz>',
            to: [email],
            subject: 'Welcome to Stefna – Your 30 Credits Are Ready',
            text: `Welcome to Stefna.

Your account is now active, and we've already added 30 credits to get you started. That's enough to generate up to 15 high-quality images today. Credits reset daily, so you'll get 30 more tomorrow.

There are no tiers, no gimmicks, and no social media verification. Everyone gets the same creative power.

Start generating now.

— The Stefna Team`
        });
        if (emailError) {
            console.error('Welcome email error:', emailError);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    error: 'Failed to send welcome email',
                    details: emailError.message || 'Unknown email error'
                })
            };
        }
        console.log('Welcome email sent successfully:', emailData);
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Welcome email sent successfully',
                data: emailData
            })
        };
    }
    catch (error) {
        console.error('Welcome email function error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};
