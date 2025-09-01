// scripts/analyze-business-tables.js
// Comprehensive analysis of business-critical tables and their relationships

import pg from 'pg';
import dotenv from 'dotenv';

const { Client } = pg;
dotenv.config();

async function analyzeBusinessTables() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  
  try {
    await client.connect();
    console.log('🔍 COMPREHENSIVE BUSINESS TABLE ANALYSIS\n');
    console.log('=' . repeat(60));

    // 1. USERS TABLE ANALYSIS
    console.log('\n📊 1. USERS TABLE ANALYSIS');
    console.log('-'.repeat(40));
    
    const users = await client.query(`
      SELECT 
        id, 
        email, 
        name, 
        created_at,
        updated_at
      FROM users 
      ORDER BY created_at
    `);
    
    console.log(`Total users: ${users.rows.length}`);
    users.rows.forEach((user, idx) => {
      console.log(`\nUser ${idx + 1}:`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Name: ${user.name || 'NOT SET'}`);
      console.log(`  Created: ${new Date(user.created_at).toLocaleString()}`);
      console.log(`  Updated: ${user.updated_at ? new Date(user.updated_at).toLocaleString() : 'N/A'}`);
    });

    // 2. USER_CREDITS ANALYSIS
    console.log('\n\n📊 2. USER_CREDITS TABLE ANALYSIS');
    console.log('-'.repeat(40));
    
    const credits = await client.query(`
      SELECT 
        uc.user_id,
        u.email,
        uc.credits,
        uc.balance,
        uc.created_at,
        uc.updated_at
      FROM user_credits uc
      JOIN users u ON uc.user_id = u.id
      ORDER BY u.created_at
    `);
    
    console.log(`Total credit records: ${credits.rows.length}`);
    credits.rows.forEach((credit, idx) => {
      console.log(`\nCredit Record ${idx + 1}:`);
      console.log(`  User: ${credit.email}`);
      console.log(`  Daily Credits: ${credit.credits} (resets daily)`);
      console.log(`  Balance: ${credit.balance} (lifetime, for bonuses)`);
      console.log(`  Created: ${new Date(credit.created_at).toLocaleString()}`);
      console.log(`  Updated: ${new Date(credit.updated_at).toLocaleString()}`);
    });

    // Check for users without credits
    const usersWithoutCredits = await client.query(`
      SELECT u.id, u.email 
      FROM users u 
      LEFT JOIN user_credits uc ON u.id = uc.user_id 
      WHERE uc.user_id IS NULL
    `);
    
    if (usersWithoutCredits.rows.length > 0) {
      console.log('\n⚠️  USERS WITHOUT CREDITS:');
      usersWithoutCredits.rows.forEach(user => {
        console.log(`  - ${user.email} (${user.id})`);
      });
    } else {
      console.log('\n✅ All users have credit records');
    }

    // 3. USER_SETTINGS ANALYSIS
    console.log('\n\n📊 3. USER_SETTINGS TABLE ANALYSIS');
    console.log('-'.repeat(40));
    
    const settings = await client.query(`
      SELECT 
        us.user_id,
        u.email,
        us.media_upload_agreed,
        us.share_to_feed,
        us.created_at,
        us.updated_at
      FROM user_settings us
      JOIN users u ON us.user_id = u.id
      ORDER BY u.created_at
    `);
    
    console.log(`Total settings records: ${settings.rows.length}`);
    settings.rows.forEach((setting, idx) => {
      console.log(`\nSettings Record ${idx + 1}:`);
      console.log(`  User: ${setting.email}`);
      console.log(`  Media Upload Agreed: ${setting.media_upload_agreed}`);
      console.log(`  Share to Feed: ${setting.share_to_feed}`);
      console.log(`  Privacy Status: ${setting.share_to_feed ? '⚠️  PUBLIC' : '✅ PRIVATE'}`);
    });

    // Check for users without settings
    const usersWithoutSettings = await client.query(`
      SELECT u.id, u.email 
      FROM users u 
      LEFT JOIN user_settings us ON u.id = us.user_id 
      WHERE us.user_id IS NULL
    `);
    
    if (usersWithoutSettings.rows.length > 0) {
      console.log('\n⚠️  USERS WITHOUT SETTINGS:');
      usersWithoutSettings.rows.forEach(user => {
        console.log(`  - ${user.email} (${user.id})`);
      });
    } else {
      console.log('\n✅ All users have settings records');
    }

    // 4. CREDITS_LEDGER ANALYSIS
    console.log('\n\n📊 4. CREDITS_LEDGER ANALYSIS');
    console.log('-'.repeat(40));
    
    const ledgerStats = await client.query(`
      SELECT 
        cl.user_id,
        u.email,
        COUNT(*) as transaction_count,
        SUM(CASE WHEN cl.action = 'reserve' THEN cl.amount ELSE 0 END) as total_reserved,
        SUM(CASE WHEN cl.action = 'finalize' THEN cl.amount ELSE 0 END) as total_finalized,
        SUM(CASE WHEN cl.action = 'refund' THEN cl.amount ELSE 0 END) as total_refunded,
        SUM(cl.amount) as net_credits_used
      FROM credits_ledger cl
      JOIN users u ON cl.user_id = u.id
      GROUP BY cl.user_id, u.email
      ORDER BY u.email
    `);
    
    if (ledgerStats.rows.length > 0) {
      console.log(`Users with credit transactions: ${ledgerStats.rows.length}`);
      ledgerStats.rows.forEach(stat => {
        console.log(`\n${stat.email}:`);
        console.log(`  Transactions: ${stat.transaction_count}`);
        console.log(`  Reserved: ${Math.abs(stat.total_reserved)}`);
        console.log(`  Finalized: ${Math.abs(stat.total_finalized)}`);
        console.log(`  Refunded: ${stat.total_refunded}`);
        console.log(`  Net Used: ${Math.abs(stat.net_credits_used)}`);
      });
    } else {
      console.log('No credit transactions found');
    }

    // Recent transactions
    const recentTransactions = await client.query(`
      SELECT 
        cl.request_id,
        u.email,
        cl.action,
        cl.amount,
        cl.status,
        cl.reason,
        cl.created_at
      FROM credits_ledger cl
      JOIN users u ON cl.user_id = u.id
      ORDER BY cl.created_at DESC
      LIMIT 10
    `);
    
    if (recentTransactions.rows.length > 0) {
      console.log('\n\nRecent Credit Transactions (last 10):');
      recentTransactions.rows.forEach(tx => {
        console.log(`  ${new Date(tx.created_at).toLocaleString()} - ${tx.email}: ${tx.action} ${Math.abs(tx.amount)} (${tx.status})`);
      });
    }

    // 5. APP_CONFIG ANALYSIS
    console.log('\n\n📊 5. APP_CONFIG TABLE ANALYSIS');
    console.log('-'.repeat(40));
    
    const appConfig = await client.query(`
      SELECT key, value 
      FROM app_config 
      ORDER BY key
    `);
    
    console.log(`Configuration entries: ${appConfig.rows.length}`);
    appConfig.rows.forEach(config => {
      console.log(`  ${config.key}: ${JSON.stringify(config.value)}`);
    });

    // Check expected configs
    const expectedConfigs = ['starter_grant', 'referral_referrer_bonus', 'referral_new_bonus'];
    const existingKeys = appConfig.rows.map(c => c.key);
    const missingConfigs = expectedConfigs.filter(key => !existingKeys.includes(key));
    
    if (missingConfigs.length > 0) {
      console.log('\n⚠️  MISSING CONFIGURATIONS:');
      missingConfigs.forEach(key => {
        console.log(`  - ${key}`);
      });
    } else {
      console.log('\n✅ All expected configurations present');
    }

    // 6. REFERRAL ANALYSIS
    console.log('\n\n📊 6. REFERRAL_SIGNUPS ANALYSIS');
    console.log('-'.repeat(40));
    
    const referrals = await client.query(`
      SELECT 
        r.id,
        u1.email as referrer,
        u2.email as new_user,
        r.created_at
      FROM referral_signups r
      JOIN users u1 ON r.referrer_user_id = u1.id
      JOIN users u2 ON r.new_user_id = u2.id
      ORDER BY r.created_at DESC
    `);
    
    if (referrals.rows.length > 0) {
      console.log(`Total referrals: ${referrals.rows.length}`);
      referrals.rows.forEach(ref => {
        console.log(`  ${ref.referrer} referred ${ref.new_user} on ${new Date(ref.created_at).toLocaleDateString()}`);
      });
    } else {
      console.log('No referral relationships found');
    }

    // 7. INTEGRITY CHECKS
    console.log('\n\n🔧 7. INTEGRITY CHECKS');
    console.log('-'.repeat(40));
    
    // Check for orphaned credits_ledger entries
    const orphanedLedger = await client.query(`
      SELECT COUNT(*) as count 
      FROM credits_ledger cl 
      WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = cl.user_id)
    `);
    
    console.log(`Orphaned credit ledger entries: ${orphanedLedger.rows[0].count}`);

    // Check for negative credits
    const negativeCredits = await client.query(`
      SELECT u.email, uc.credits, uc.balance 
      FROM user_credits uc
      JOIN users u ON uc.user_id = u.id
      WHERE uc.credits < 0 OR uc.balance < 0
    `);
    
    if (negativeCredits.rows.length > 0) {
      console.log('\n⚠️  USERS WITH NEGATIVE CREDITS:');
      negativeCredits.rows.forEach(user => {
        console.log(`  - ${user.email}: credits=${user.credits}, balance=${user.balance}`);
      });
    } else {
      console.log('✅ No users with negative credits');
    }

    // 8. RECOMMENDATIONS
    console.log('\n\n💡 8. RECOMMENDATIONS');
    console.log('-'.repeat(40));
    
    const issues = [];
    
    if (usersWithoutCredits.rows.length > 0) {
      issues.push('Some users lack credit records - run fix-user-credits.js');
    }
    
    if (usersWithoutSettings.rows.length > 0) {
      issues.push('Some users lack settings records - need to create them');
    }
    
    if (missingConfigs.length > 0) {
      issues.push('Missing app configurations - need to insert default values');
    }
    
    if (orphanedLedger.rows[0].count > 0) {
      issues.push('Orphaned ledger entries exist - need cleanup');
    }
    
    const publicUsers = settings.rows.filter(s => s.share_to_feed).length;
    if (publicUsers > 0) {
      issues.push(`${publicUsers} users have public sharing enabled - verify if intentional`);
    }
    
    if (issues.length > 0) {
      console.log('Issues found:');
      issues.forEach((issue, idx) => {
        console.log(`  ${idx + 1}. ${issue}`);
      });
    } else {
      console.log('✅ All business tables are properly synced and configured!');
    }

    console.log('\n' + '='.repeat(60));
    console.log('Analysis complete!');
    
  } catch (error) {
    console.error('\n❌ Analysis failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the analysis
analyzeBusinessTables().catch(console.error);
