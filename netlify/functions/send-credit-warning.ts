// netlify/functions/send-credit-warning.ts
import { Handler } from '@netlify/functions';
import { Resend } from 'resend';

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
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
    const { to, usagePercentage, dailyUsed, dailyCap, remainingCredits, isCritical } = JSON.parse(event.body || '{}');
    
    if (!to) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Email address is required' })
      };
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error('Missing RESEND_API_KEY environment variable');
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Email service not configured' })
      };
    }

    const resend = new Resend(resendApiKey);
    
    // Enhanced email content based on usage data
    let subject, text;
    
    if (isCritical) {
      subject = '⚠️ Critical: You\'re Almost Out of Credits Today';
      text = `You've used ${dailyUsed} out of ${dailyCap} daily credits (${usagePercentage}%).

⚠️ WARNING: You only have ${remainingCredits} credits remaining today!

Your daily credits reset at midnight UTC. You'll be back to full power tomorrow.

Want more credits now? Invite a friend and get 50 bonus credits instantly.

— The Stefna Team`;
    } else {
      subject = '📢 You\'re Running Low on Credits';
      text = `You've used ${dailyUsed} out of ${dailyCap} daily credits (${usagePercentage}%).

Just a heads-up — you're running low on credits for today.

You have ${remainingCredits} credits remaining. Your daily 30 credits reset at midnight UTC.

Want more now? Invite a friend and get 50 bonus credits instantly.

— The Stefna Team`;
    }
    
    await resend.emails.send({
      from: 'Stefna <hello@stefna.xyz>',
      to: [to],
      subject: subject,
      text: text
    });

    console.log(`📧 Low credit warning email sent to ${to}: ${usagePercentage}% usage (${dailyUsed}/${dailyCap})`);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        ok: true, 
        message: 'Credit warning email sent successfully',
        usagePercentage,
        dailyUsed,
        dailyCap,
        remainingCredits
      })
    };

  } catch (error) {
    console.error('❌ send-credit-warning error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        ok: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};
