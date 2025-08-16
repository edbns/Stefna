"use strict";

// netlify/functions/sendEmail.js
exports.handler = async (event, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }
  try {
    console.log("\u{1F4E7} Netlify function called with event:", JSON.stringify(event.body));
    const { to, subject, html, from = "Stefna <hello@stefna.xyz>" } = JSON.parse(event.body);
    if (!to || !subject || !html) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing required fields" })
      };
    }
    const apiKey = process.env.RESEND_API_KEY;
    console.log("\u{1F4E7} RESEND_API_KEY present:", !!apiKey);
    if (!apiKey) {
      console.log("\u{1F4E7} ERROR: RESEND_API_KEY not configured");
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "API key not configured" })
      };
    }
    console.log("\u{1F4E7} Calling Resend API with:", { from, to, subject });
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ from, to, subject, html })
    });
    console.log("\u{1F4E7} Resend API response status:", response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.log("\u{1F4E7} Resend API error:", errorText);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Failed to send email", details: errorText })
      };
    }
    const result = await response.json();
    console.log("\u{1F4E7} Email sent successfully:", result);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, message: "Email sent", result })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal server error" })
    };
  }
};
//# sourceMappingURL=sendEmail.js.map
