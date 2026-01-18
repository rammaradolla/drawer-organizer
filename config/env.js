/**
 * Centralized Environment Configuration Loader
 * 
 * Reads ENV_MODE from root .env file and loads appropriate environment configuration
 * Provides consistent API for accessing environment variables across the application
 */

const fs = require('fs');
const path = require('path');

// Default environment mode
const DEFAULT_ENV_MODE = 'development';

/**
 * Get the current environment mode from root .env file
 * @returns {string} 'development' | 'production'
 */
function getEnvMode() {
  const rootEnvPath = path.join(__dirname, '..', '.env');
  
  try {
    if (fs.existsSync(rootEnvPath)) {
      const envContent = fs.readFileSync(rootEnvPath, 'utf8');
      const match = envContent.match(/ENV_MODE\s*=\s*(\w+)/);
      if (match && match[1]) {
        return match[1].toLowerCase();
      }
    }
  } catch (error) {
    console.warn('[Config] Could not read root .env file:', error.message);
  }
  
  // Fallback to NODE_ENV or default
  return process.env.NODE_ENV === 'production' ? 'production' : DEFAULT_ENV_MODE;
}

/**
 * Load environment configuration
 * @returns {object} Environment configuration object
 */
function loadEnvConfig() {
  const envMode = getEnvMode();
  
  try {
    const envConfigPath = path.join(__dirname, 'environments', `${envMode}.js`);
    
    if (fs.existsSync(envConfigPath)) {
      // Clear require cache to allow hot-reloading in development
      delete require.cache[require.resolve(envConfigPath)];
      return require(envConfigPath);
    } else {
      console.warn(`[Config] Environment config file not found: ${envConfigPath}, using default`);
      return require('./environments/development.js');
    }
  } catch (error) {
    console.error(`[Config] Error loading environment config:`, error);
    throw error;
  }
}

// Load configuration based on ENV_MODE
const config = loadEnvConfig();

module.exports = {
  getEnvMode,
  loadEnvConfig,
  config,
  // Export common config values for convenience
  NODE_ENV: config.NODE_ENV || getEnvMode(),
  isDevelopment: getEnvMode() === 'development',
  isProduction: getEnvMode() === 'production',
};
