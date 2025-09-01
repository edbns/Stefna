// scripts/fix-user-credits.js
// This script ensures all users have credit records

import pg from 'pg';
import dotenv from 'dotenv';

const { Client } = pg;
dotenv.config();

async function fixUserCredits() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  
  try {
    await client.connect();
    console.log('🔧 Fixing user credits...\n');

    // Check current state
    const usersWithoutCredits = await client.query(`
      SELECT u.id, u.email, u.created_at
      FROM users u
      LEFT JOIN user_credits uc ON u.id = uc.user_id
      WHERE uc.user_id IS NULL
      ORDER BY u.created_at
    `);

    console.log(`Found ${usersWithoutCredits.rows.length} users without credit records:`);
    usersWithoutCredits.rows.forEach(user => {
      console.log(`  - ${user.email} (id: ${user.id})`);
    });

    if (usersWithoutCredits.rows.length === 0) {
      console.log('\n✅ All users already have credit records!');
      
      // Show current credit status
      const allCredits = await client.query(`
        SELECT u.email, uc.credits, uc.balance, uc.created_at
        FROM users u
        JOIN user_credits uc ON u.id = uc.user_id
        ORDER BY u.created_at
      `);
      
      console.log('\nCurrent credit status:');
      allCredits.rows.forEach(user => {
        console.log(`  - ${user.email}: ${user.credits} daily credits, ${user.balance} balance`);
      });
      
      return;
    }

    console.log('\n📝 Creating credit records...');

    // Begin transaction
    await client.query('BEGIN');

    // Insert credit records for users without them
    for (const user of usersWithoutCredits.rows) {
      await client.query(`
        INSERT INTO user_credits (user_id, credits, balance, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        ON CONFLICT (user_id) DO NOTHING
      `, [user.id, 30, 0]); // 30 daily credits, 0 balance (can be earned through referrals)
      
      console.log(`  ✓ Created credits for ${user.email}`);
    }

    // Also ensure all users have settings (with privacy-first defaults)
    const usersWithoutSettings = await client.query(`
      SELECT u.id, u.email
      FROM users u
      LEFT JOIN user_settings us ON u.id = us.user_id
      WHERE us.user_id IS NULL
    `);

    if (usersWithoutSettings.rows.length > 0) {
      console.log(`\n📝 Creating settings for ${usersWithoutSettings.rows.length} users...`);
      
      for (const user of usersWithoutSettings.rows) {
        await client.query(`
          INSERT INTO user_settings (user_id, media_upload_agreed, share_to_feed, created_at, updated_at)
          VALUES ($1, $2, $3, NOW(), NOW())
          ON CONFLICT (user_id) DO NOTHING
        `, [user.id, false, false]); // Privacy-first defaults
        
        console.log(`  ✓ Created settings for ${user.email}`);
      }
    }

    // Commit transaction
    await client.query('COMMIT');

    // Show final state
    const finalCredits = await client.query(`
      SELECT u.email, uc.credits, uc.balance, uc.created_at
      FROM users u
      JOIN user_credits uc ON u.id = uc.user_id
      ORDER BY u.created_at
    `);

    console.log('\n✅ All users now have credit records:');
    finalCredits.rows.forEach(user => {
      console.log(`  - ${user.email}: ${user.credits} daily credits, ${user.balance} balance`);
    });

    // Check for any referral bonuses that might have been missed
    const referralData = await client.query(`
      SELECT 
        r.referrer_user_id,
        r.new_user_id,
        u1.email as referrer_email,
        u2.email as new_user_email
      FROM referral_signups r
      JOIN users u1 ON r.referrer_user_id = u1.id
      JOIN users u2 ON r.new_user_id = u2.id
    `);

    if (referralData.rows.length > 0) {
      console.log('\n📊 Referral relationships found:');
      referralData.rows.forEach(ref => {
        console.log(`  - ${ref.referrer_email} referred ${ref.new_user_email}`);
      });
      console.log('\nNote: Referral bonuses should be processed separately if not already applied.');
    }

    console.log('\n✅ User credits fixed successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Error fixing credits:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the fix
fixUserCredits().catch(console.error);
