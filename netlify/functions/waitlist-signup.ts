import { Handler } from '@netlify/functions';
import { json } from './_lib/http';
import { q } from './_db';

const waitlistSignup: Handler = async (event) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return json({}, {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    });
  }

  if (event.httpMethod !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const { email } = JSON.parse(event.body || '{}');

    if (!email) {
      return json({ error: 'Email is required' }, { status: 400 });
    }

    // Add to waitlist
    const result = await q('SELECT add_to_waitlist($1)', [email]);
    const waitlistData = result[0];

    console.log(`✅ [Waitlist] New signup: ${email}`);

    return json({
      success: true,
      message: 'Successfully joined waitlist!',
      position: waitlistData.position
    });

  } catch (error: any) {
    console.error('💥 [Waitlist] Error:', error?.message || error);
    return json({ 
      error: 'Failed to join waitlist',
      message: error?.message || 'Unknown error occurred'
    }, { status: 500 });
  }
};

export { waitlistSignup as handler };