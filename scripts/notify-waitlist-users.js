// Script to notify waitlist users when quota increases
// Usage: node scripts/notify-waitlist-users.js 55
// This will email the first 55 people from waitlist

import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function notifyWaitlistUsers(spotsToOpen) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('🔗 Connected to database');

    // Call the database function to queue emails
    console.log(`📧 Queuing emails for ${spotsToOpen} waitlist users...`);
    const result = await client.query('SELECT notify_waitlist_users($1)', [spotsToOpen]);
    const data = result.rows[0].notify_waitlist_users;

    console.log(`✅ Database function result:`, data);

    if (data.success && data.count > 0) {
      console.log(`\n📧 Now sending emails to ${data.count} users...`);
      
      // Call the Netlify function to send emails
      const emailResponse = await fetch(`${process.env.URL || 'http://localhost:8888'}/.netlify/functions/send-waitlist-emails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const emailData = await emailResponse.json();

      if (emailResponse.ok && emailData.success) {
        console.log(`✅ Emails sent successfully!`);
        console.log(`📊 Stats:`, emailData.stats);
      } else {
        console.error(`❌ Failed to send emails:`, emailData.error);
      }
    } else {
      console.log(`⚠️ No emails to send: ${data.message}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

// Get spots to open from command line argument
const spotsToOpen = parseInt(process.argv[2]);

if (!spotsToOpen || isNaN(spotsToOpen)) {
  console.error('❌ Usage: node scripts/notify-waitlist-users.js <number_of_spots>');
  console.error('Example: node scripts/notify-waitlist-users.js 55');
  process.exit(1);
}

notifyWaitlistUsers(spotsToOpen);
