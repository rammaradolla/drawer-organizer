#!/usr/bin/env node

/**
 * Environment Sync Script
 * 
 * Synchronizes environment files based on ENV_MODE in root .env
 * Reads ENV_MODE and creates/updates .env files in server/ and client/
 * 
 * Usage:
 *   node scripts/sync-env.js
 *   npm run env:sync
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const ROOT_ENV_PATH = path.join(ROOT_DIR, '.env');
const SERVER_DIR = path.join(ROOT_DIR, 'server');
const CLIENT_DIR = path.join(ROOT_DIR, 'client');

/**
 * Get ENV_MODE from root .env file
 */
function getEnvMode() {
  try {
    if (fs.existsSync(ROOT_ENV_PATH)) {
      const content = fs.readFileSync(ROOT_ENV_PATH, 'utf8');
      const match = content.match(/ENV_MODE\s*=\s*(\w+)/);
      if (match && match[1]) {
        return match[1].toLowerCase();
      }
    }
  } catch (error) {
    console.warn('[sync-env] Could not read root .env:', error.message);
  }
  
  // Default to development
  return 'development';
}

/**
 * Sync environment file for a directory
 * @param {string} dir - Directory path (server or client)
 * @param {string} envMode - Environment mode (development or production)
 */
function syncEnvFile(dir, envMode) {
  const envFileName = `.env.${envMode}`;
  const envFilePath = path.join(dir, envFileName);
  const activeEnvPath = path.join(dir, '.env');
  
  try {
    // Check if environment-specific file exists
    if (fs.existsSync(envFilePath)) {
      // Read the environment-specific file
      const envContent = fs.readFileSync(envFilePath, 'utf8');
      
      // Write to active .env file
      fs.writeFileSync(activeEnvPath, envContent, 'utf8');
      
      console.log(`✅ Synced ${path.basename(dir)}/.env from ${envFileName}`);
      return true;
    } else {
      console.warn(`⚠️  ${path.basename(dir)}/${envFileName} not found, skipping...`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error syncing ${path.basename(dir)}/.env:`, error.message);
    return false;
  }
}

/**
 * Create root .env file if it doesn't exist
 */
function ensureRootEnv() {
  if (!fs.existsSync(ROOT_ENV_PATH)) {
    const defaultContent = '# Root Environment Toggle\nENV_MODE=development\n';
    fs.writeFileSync(ROOT_ENV_PATH, defaultContent, 'utf8');
    console.log('📝 Created root .env file with ENV_MODE=development');
  }
}

/**
 * Main sync function
 */
function main() {
  console.log('🔄 Syncing environment files...\n');
  
  // Ensure root .env exists
  ensureRootEnv();
  
  // Get current environment mode
  const envMode = getEnvMode();
  console.log(`📍 Current ENV_MODE: ${envMode}\n`);
  
  // Validate environment mode
  if (envMode !== 'development' && envMode !== 'production') {
    console.error(`❌ Invalid ENV_MODE: ${envMode}. Must be 'development' or 'production'`);
    process.exit(1);
  }
  
  // Sync server and client .env files
  const serverSynced = syncEnvFile(SERVER_DIR, envMode);
  const clientSynced = syncEnvFile(CLIENT_DIR, envMode);
  
  // Set NODE_ENV based on ENV_MODE
  process.env.NODE_ENV = envMode === 'production' ? 'production' : 'development';
  
  console.log(`\n✅ Environment sync complete!`);
  console.log(`   Mode: ${envMode}`);
  console.log(`   Server: ${serverSynced ? '✅' : '❌'}`);
  console.log(`   Client: ${clientSynced ? '✅' : '❌'}`);
  
  if (!serverSynced || !clientSynced) {
    console.log(`\n💡 Tip: Create .env.${envMode} files in server/ and client/ directories`);
    console.log(`   Copy from .env.example and fill in your values`);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { syncEnvFile, getEnvMode };
