import { sql } from "./_db";

export const handler = async () => {
  try {
    const [{ now }] = await sql`select now()`;
    return { 
      statusCode: 200, 
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: true, now }) 
    };
  } catch (error: any) {
    return { 
      statusCode: 500, 
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: false, error: error.message }) 
    };
  }
};
