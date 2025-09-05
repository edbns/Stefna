import { Handler } from '@netlify/functions';
import { json } from './_lib/http';
import { q } from './_db';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    // Get launch status
    const launchStatus = await q('SELECT * FROM get_launch_status()');
    
    return json({
      success: true,
      launch: launchStatus[0] || { is_launched: false, launch_date: null, waitlist_count: 0 }
    });

  } catch (error: any) {
    console.error('Launch status error:', error);
    return json({ 
      error: 'Failed to get launch status',
      message: error?.message || 'Unknown error occurred'
    }, { status: 500 });
  }
};
