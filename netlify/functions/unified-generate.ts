import type { Handler } from "@netlify/functions";
import { requireAuth } from "./_lib/auth";

// Synchronous wrapper around background generator with upfront credit validation.
// Returns 4xx immediately on insufficient credits to prevent frontend polling loops.

const CORS_JSON_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json'
};

export const handler: Handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: CORS_JSON_HEADERS,
      body: JSON.stringify({ ok: false, error: 'Method not allowed' })
    };
  }

  try {
    const { userId } = requireAuth(event.headers.authorization);

    // Parse body as pass-through payload
    const body = event.body ? JSON.parse(event.body) : {};
    const action = `${body?.mode || 'custom'}_generation`;

    // 1) Upfront quota check
    const quotaResp = await fetch(`${process.env.URL || 'http://localhost:8888'}/.netlify/functions/getQuota`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': event.headers.authorization || ''
      }
    });

    if (!quotaResp.ok) {
      const errPayload = await quotaResp.text();
      console.warn('[unified-generate] Quota check failed, proceeding cautiously:', errPayload);
    } else {
      const quota = await quotaResp.json();
      const remaining = typeof quota.remaining === 'number' ? quota.remaining : 0;
      if (remaining < 2) {
        return {
          statusCode: 402,
          headers: CORS_JSON_HEADERS,
          body: JSON.stringify({ success: false, status: 'failed', error: 'INSUFFICIENT_CREDITS' })
        };
      }
    }

    // 2) Do not reserve credits here to avoid double-reserving; rely on background function reservation

    // 3) Forward to background function (which will do the heavy work)
    const bgResp = await fetch(`${process.env.URL || 'http://localhost:8888'}/.netlify/functions/unified-generate-background`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': event.headers.authorization || ''
      },
      body: JSON.stringify(body)
    });

    // If background accepted (202), return 202 as well to keep existing client flow
    if (bgResp.status === 202) {
      return {
        statusCode: 202,
        headers: CORS_JSON_HEADERS,
        body: ''
      };
    }

    // If background returns JSON (e.g., edit mode), proxy it
    const text = await bgResp.text();
    return {
      statusCode: bgResp.status,
      headers: CORS_JSON_HEADERS,
      body: text
    };

  } catch (error: any) {
    console.error('[unified-generate] Error:', error);
    const msg = error?.message || 'Internal error';
    const status = msg.includes('INSUFFICIENT_CREDITS') ? 402 : (error?.statusCode || 500);
    return {
      statusCode: status,
      headers: CORS_JSON_HEADERS,
      body: JSON.stringify({ success: false, status: 'failed', error: msg })
    };
  }
};


