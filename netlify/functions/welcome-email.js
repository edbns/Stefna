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
      subject: 'Your Creative Playground Awaits 🖤',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #000000; color: #ffffff; min-height: 100vh;">
          <div style="text-align: center; padding: 60px 20px;">
            <!-- Logo centered in the middle -->
            <img src="https://stefna.xyz/logo.png" alt="Stefna" style="width: 120px; height: 120px; margin-bottom: 40px;">
            
            <!-- Welcome content -->
            <div style="background-color: #1a1a1a; padding: 40px; border-radius: 15px; margin-bottom: 30px;">
              <h1 style="color: #ffffff; font-size: 28px; margin-bottom: 30px; font-weight: 300;">Hello,</h1>
              
              <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                Welcome to Stefna, where creativity meets possibility. Here, AI is your brush—ready to help you remix, enhance, and reimagine photos and videos in ways only you can imagine.
              </p>
              
              <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                Start exploring, start experimenting, and don't be shy about sharing what you make. The world is waiting to see your vision.
              </p>
              
              <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                Let's see what you can do with <span style="color: #ffffff; font-weight: bold;">#AIasabrush</span>.
              </p>
              
              <p style="color: #ffffff; font-size: 18px; font-weight: 600; margin-top: 40px;">Stefna</p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="border-top: 1px solid #333333; padding: 30px 20px; text-align: center;">
            <p style="color: #ffffff; font-size: 14px; margin-bottom: 5px;">Stefna - Turn Moments into Masterpieces—No Limits</p>
            <p style="color: #888888; font-size: 12px; margin-bottom: 5px;">This email was sent to ${email}</p>
            <p style="color: #888888; font-size: 12px;">If you have any questions, contact us at <span style="background-color: #ffff00; color: #000000; padding: 2px 4px;">hello@stefna.xyz</span></p>
          </div>
        </div>
      `
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

  } catch (error) {
    console.error('Welcome email function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
