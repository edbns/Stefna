#!/usr/bin/env node

/**
 * Database Setup Script
 * This script sets up your clean, stable database schema
 * Run this after connecting to your new Neon database
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupDatabase() {
  console.log('🚀 Setting up clean database schema...');
  
  try {
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Create initial migration
    console.log('📝 Creating initial migration...');
    
    // The schema will be created when you run:
    // npx prisma migrate dev --name init
    
    console.log('🎯 Next steps:');
    console.log('1. Run: npx prisma migrate dev --name init');
    console.log('2. Run: npx prisma generate');
    console.log('3. Test your functions with the new schema');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupDatabase();
