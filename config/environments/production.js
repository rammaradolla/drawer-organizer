/**
 * Production Environment Configuration
 * 
 * Production settings:
 * - Production URLs
 * - Real credentials (from environment variables)
 * - Optimized settings
 * - Restricted CORS
 */

module.exports = {
  // Environment
  NODE_ENV: 'production',
  
  // Server Configuration
  PORT: process.env.PORT || 3000,
  HOST: process.env.HOST || '0.0.0.0',
  
  // Client Configuration
  CLIENT_URL: process.env.CLIENT_URL || process.env.DOMAIN_URL || 'https://design2organize.net',
  CLIENT_PORT: process.env.CLIENT_PORT || 5173,
  
  // CORS Configuration
  CORS_ORIGINS: [
    process.env.CLIENT_URL,
    process.env.DOMAIN_URL,
    process.env.CORS_ORIGIN,
    'https://design2organize.net',
    'http://design2organize.net',
  ].filter(Boolean),
  ALLOW_ALL_ORIGINS: false,
  
  // Domain Configuration
  DOMAIN_URL: process.env.DOMAIN_URL || 'https://design2organize.net',
  
  // Supabase Configuration
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  SUPABASE_JWT_SECRET: process.env.SUPABASE_JWT_SECRET || '',
  
  // Stripe Configuration
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
  STRIPE_PUBLIC_KEY: process.env.STRIPE_PUBLIC_KEY || '',
  
  // Email Configuration
  EMAIL_SERVICE: process.env.EMAIL_SERVICE || '',
  EMAIL_HOST: process.env.EMAIL_HOST || 'mail.design2organize.net',
  EMAIL_PORT: process.env.EMAIL_PORT || '465',
  EMAIL_SECURE: process.env.EMAIL_SECURE === 'true' || process.env.EMAIL_PORT === '465',
  EMAIL_USER: process.env.EMAIL_USER || 'support@design2organize.net',
  EMAIL_PASS: process.env.EMAIL_PASS || '',
  EMAIL_DISPLAY_NAME: process.env.EMAIL_DISPLAY_NAME || 'Design2Organize Support',
  
  // Client Environment Variables (VITE_ prefix)
  VITE_API_TARGET: process.env.VITE_API_TARGET || process.env.DOMAIN_URL || 'https://design2organize.net',
  VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '',
  VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || '',
  VITE_STRIPE_PUBLIC_KEY: process.env.VITE_STRIPE_PUBLIC_KEY || process.env.STRIPE_PUBLIC_KEY || '',
};
