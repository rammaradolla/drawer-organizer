// Address utility functions for frontend

// US State codes (2-letter abbreviations)
export const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
  { value: 'DC', label: 'District of Columbia' }
];

/**
 * Validate US state code (2-letter abbreviation)
 */
export function isValidState(state) {
  if (!state || typeof state !== 'string') return false;
  return US_STATES.some(s => s.value === state.toUpperCase().trim());
}

/**
 * Validate ZIP code format (5 or 9 digits)
 */
export function isValidZip(zip) {
  if (!zip || typeof zip !== 'string') return false;
  const cleaned = zip.replace(/[\s-]/g, '');
  return /^\d{5}$/.test(cleaned) || /^\d{9}$/.test(cleaned);
}

/**
 * Validate phone number format (US format)
 */
export function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  return /^\d{10}$/.test(cleaned);
}

/**
 * Sanitize address input
 */
export function sanitizeAddress(input) {
  if (!input || typeof input !== 'string') return '';
  return input.trim().replace(/\s+/g, ' ');
}

/**
 * Format phone number for display
 */
export function formatPhone(phone) {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

/**
 * Format ZIP code for display
 */
export function formatZip(zip) {
  if (!zip) return '';
  const cleaned = zip.replace(/\D/g, '');
  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
  }
  return cleaned;
}

/**
 * Format address for display
 */
export function formatAddress(address, type = 'billing') {
  if (!address) return '';
  
  const prefix = type === 'billing' ? 'billing' : 'shipping';
  const parts = [
    address[`${prefix}_street`],
    `${address[`${prefix}_city`]}, ${address[`${prefix}_state`]} ${formatZip(address[`${prefix}_zip`])}`,
    address[`${prefix}_country`]
  ].filter(Boolean);
  
  return parts.join('\n');
}

/**
 * Copy billing address to shipping address
 */
export function copyBillingToShipping(billingAddress) {
  if (!billingAddress) return null;
  
  return {
    shipping_street: billingAddress.billing_street,
    shipping_city: billingAddress.billing_city,
    shipping_state: billingAddress.billing_state,
    shipping_zip: billingAddress.billing_zip,
    shipping_country: billingAddress.billing_country || 'US',
    shipping_phone: billingAddress.billing_phone
  };
}

/**
 * Validate billing address
 */
export function validateBillingAddress(address) {
  const errors = {};

  if (!address.billing_street || !sanitizeAddress(address.billing_street)) {
    errors.billing_street = 'Street address is required';
  }

  if (!address.billing_city || !sanitizeAddress(address.billing_city)) {
    errors.billing_city = 'City is required';
  }

  if (!address.billing_state || !isValidState(address.billing_state)) {
    errors.billing_state = 'Valid state code is required';
  }

  if (!address.billing_zip || !isValidZip(address.billing_zip)) {
    errors.billing_zip = 'Valid ZIP code is required (5 or 9 digits)';
  }

  if (!address.billing_country || !sanitizeAddress(address.billing_country)) {
    errors.billing_country = 'Country is required';
  }

  if (!address.billing_phone || !isValidPhone(address.billing_phone)) {
    errors.billing_phone = 'Valid phone number is required (10 digits)';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validate shipping address
 */
export function validateShippingAddress(address, sameAsBilling = false) {
  if (sameAsBilling) {
    return { valid: true, errors: {} };
  }

  const errors = {};

  if (!address.shipping_street || !sanitizeAddress(address.shipping_street)) {
    errors.shipping_street = 'Street address is required';
  }

  if (!address.shipping_city || !sanitizeAddress(address.shipping_city)) {
    errors.shipping_city = 'City is required';
  }

  if (!address.shipping_state || !isValidState(address.shipping_state)) {
    errors.shipping_state = 'Valid state code is required';
  }

  if (!address.shipping_zip || !isValidZip(address.shipping_zip)) {
    errors.shipping_zip = 'Valid ZIP code is required (5 or 9 digits)';
  }

  if (!address.shipping_country || !sanitizeAddress(address.shipping_country)) {
    errors.shipping_country = 'Country is required';
  }

  if (!address.shipping_phone || !isValidPhone(address.shipping_phone)) {
    errors.shipping_phone = 'Valid phone number is required (10 digits)';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}
