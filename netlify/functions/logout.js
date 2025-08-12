exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }
  // Clear cookie by setting Max-Age=0
  const cookie = `stefna_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0; ${process.env.NODE_ENV === 'production' ? 'Secure;' : ''}`
  return {
    statusCode: 200,
    headers: {
      'Set-Cookie': cookie,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ success: true })
  }
}


