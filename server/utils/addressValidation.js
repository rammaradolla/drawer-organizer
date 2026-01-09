// Address validation utilities

// US State codes (2-letter abbreviations)
const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  'DC'
];

/**
 * Validate US state code (2-letter abbreviation)
 * @param {string} state - State code to validate
 * @returns {boolean} - True if valid
 */
function isValidState(state) {
  if (!state || typeof state !== 'string') return false;
  return US_STATES.includes(state.toUpperCase().trim());
}

/**
 * Validate ZIP code format (5 or 9 digits)
 * @param {string} zip - ZIP code to validate
 * @returns {boolean} - True if valid
 */
function isValidZip(zip) {
  if (!zip || typeof zip !== 'string') return false;
  // Remove dashes and spaces
  const cleaned = zip.replace(/[\s-]/g, '');
  // Check for 5 digits or 9 digits (ZIP+4)
  return /^\d{5}$/.test(cleaned) || /^\d{9}$/.test(cleaned);
}

/**
 * Validate phone number format (US format)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid
 */
function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  // Remove common formatting characters
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  // Check for 10 digits (US phone number)
  return /^\d{10}$/.test(cleaned);
}

/**
 * Sanitize address input
 * @param {string} input - Input to sanitize
 * @returns {string} - Sanitized string
 */
function sanitizeAddress(input) {
  if (!input || typeof input !== 'string') return '';
  // Trim whitespace and remove excessive spaces
  return input.trim().replace(/\s+/g, ' ');
}

/**
 * Validate complete billing address
 * @param {object} address - Address object with street, city, state, zip, country, phone
 * @returns {object} - { valid: boolean, errors: string[] }
 */
function validateBillingAddress(address) {
  const errors = [];

  if (!address.billing_street || !sanitizeAddress(address.billing_street)) {
    errors.push('Street address is required');
  }

  if (!address.billing_city || !sanitizeAddress(address.billing_city)) {
    errors.push('City is required');
  }

  if (!address.billing_state || !isValidState(address.billing_state)) {
    errors.push('Valid state code is required (2-letter abbreviation)');
  }

  if (!address.billing_zip || !isValidZip(address.billing_zip)) {
    errors.push('Valid ZIP code is required (5 or 9 digits)');
  }

  if (!address.billing_country || !sanitizeAddress(address.billing_country)) {
    errors.push('Country is required');
  }

  if (!address.billing_phone || !isValidPhone(address.billing_phone)) {
    errors.push('Valid phone number is required (10 digits)');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate shipping address (can be same as billing)
 * @param {object} address - Address object with shipping fields
 * @param {boolean} sameAsBilling - Whether shipping is same as billing
 * @param {object} billingAddress - Billing address for reference
 * @returns {object} - { valid: boolean, errors: string[] }
 */
function validateShippingAddress(address, sameAsBilling = false, billingAddress = null) {
  if (sameAsBilling && billingAddress) {
    // If same as billing, validate billing address instead
    return validateBillingAddress(billingAddress);
  }

  const errors = [];

  if (!address.shipping_street || !sanitizeAddress(address.shipping_street)) {
    errors.push('Shipping street address is required');
  }

  if (!address.shipping_city || !sanitizeAddress(address.shipping_city)) {
    errors.push('Shipping city is required');
  }

  if (!address.shipping_state || !isValidState(address.shipping_state)) {
    errors.push('Valid shipping state code is required (2-letter abbreviation)');
  }

  if (!address.shipping_zip || !isValidZip(address.shipping_zip)) {
    errors.push('Valid shipping ZIP code is required (5 or 9 digits)');
  }

  if (!address.shipping_country || !sanitizeAddress(address.shipping_country)) {
    errors.push('Shipping country is required');
  }

  if (!address.shipping_phone || !isValidPhone(address.shipping_phone)) {
    errors.push('Valid shipping phone number is required (10 digits)');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Format phone number for display
 * @param {string} phone - Phone number to format
 * @returns {string} - Formatted phone number (XXX) XXX-XXXX
 */
function formatPhone(phone) {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

/**
 * Format ZIP code for display
 * @param {string} zip - ZIP code to format
 * @returns {string} - Formatted ZIP code
 */
function formatZip(zip) {
  if (!zip) return '';
  const cleaned = zip.replace(/\D/g, '');
  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
  }
  return cleaned;
}

module.exports = {
  isValidState,
  isValidZip,
  isValidPhone,
  sanitizeAddress,
  validateBillingAddress,
  validateShippingAddress,
  formatPhone,
  formatZip,
  US_STATES
};
