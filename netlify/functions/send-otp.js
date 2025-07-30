const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

exports.handler = async (event) => {
  const { email, otp } = JSON.parse(event.body || '{}');

  if (!email || !otp) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Missing email or OTP' }),
    };
  }

  try {
    await resend.emails.send({
      from: 'hello@stefna.xyz',
      to: email,
      subject: 'Your Stefna Login Code',
      html: `
        <h2>Welcome to Stefna 👋</h2>
        <p>Your login code is:</p>
        <h1>${otp}</h1>
        <p>This code will expire in 10 minutes.</p>
      `,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'OTP sent successfully' }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to send OTP', error }),
    };
  }
}; 