import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file manually since Node.js doesn't auto-load it
function loadEnvFile() {
  const envPath = path.join(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          envVars[key] = valueParts.join('=');
        }
      }
    });
    
    return envVars;
  }
  return {};
}

// Load existing environment variables
const existingEnvVars = loadEnvFile();

// Environment variables that should be exposed to the client
const clientEnvVars = [
  // No auth environment variables needed for frontend
  'VITE_APP_ENV',
  'VITE_DEBUG_MODE',
  // Add FUNCTION_APP_KEY for AIML API authentication
  'VITE_FUNCTION_APP_KEY'
];

// DON'T overwrite .env file - just read and display
console.log('✅ Environment variables exposed to client:');
clientEnvVars.forEach(varName => {
  // Check existing .env file first, then process.env
  const value = existingEnvVars[varName] || process.env[varName];
  console.log(`  ${varName}: ${value ? '✅ Set' : '❌ Not set'}`);
});

// Only create .env if it doesn't exist
const envPath = path.join(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
  console.log('📝 Creating new .env file...');
  const envContent = clientEnvVars
    .map(varName => {
      const value = existingEnvVars[varName] || process.env[varName];
      return value ? `${varName}=${value}` : `# ${varName} not set`;
    })
    .join('\n');
  
  fs.writeFileSync(envPath, envContent);
} else {
  console.log('📝 .env file already exists - not overwriting');
} 