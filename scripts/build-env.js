import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Environment variables that should be exposed to the client
const clientEnvVars = [
  // No auth environment variables needed for frontend
  'VITE_APP_ENV',
  'VITE_DEBUG_MODE'
];

// Create .env file for Vite
const envContent = clientEnvVars
  .map(varName => {
    const value = process.env[varName];
    return value ? `${varName}=${value}` : `# ${varName} not set`;
  })
  .join('\n');

// Write to .env file in project root
fs.writeFileSync(path.join(__dirname, '../.env'), envContent);

console.log('✅ Environment variables exposed to client:');
clientEnvVars.forEach(varName => {
  const value = process.env[varName];
  console.log(`  ${varName}: ${value ? '✅ Set' : '❌ Not set'}`);
}); 