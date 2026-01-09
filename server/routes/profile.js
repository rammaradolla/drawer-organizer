const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { authenticateToken } = require('../middleware/auth');
const { validateBillingAddress, validateShippingAddress, sanitizeAddress } = require('../utils/addressValidation');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Get current user's profile
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, role, billing_street, billing_city, billing_state, billing_zip, billing_country, billing_phone, shipping_street, shipping_city, shipping_state, shipping_zip, shipping_country, shipping_phone, profile_complete')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch profile'
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      profile: user
    });
  } catch (error) {
    console.error('Error in GET /api/profile:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update user profile including addresses
router.put('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      name,
      billing_street,
      billing_city,
      billing_state,
      billing_zip,
      billing_country,
      billing_phone,
      shipping_street,
      shipping_city,
      shipping_state,
      shipping_zip,
      shipping_country,
      shipping_phone,
      same_as_billing
    } = req.body;

    // Validate billing address
    const billingValidation = validateBillingAddress({
      billing_street,
      billing_city,
      billing_state,
      billing_zip,
      billing_country,
      billing_phone
    });

    if (!billingValidation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Billing address validation failed',
        errors: billingValidation.errors
      });
    }

    // Prepare update data
    const updateData = {
      name: name || undefined,
      billing_street: sanitizeAddress(billing_street),
      billing_city: sanitizeAddress(billing_city),
      billing_state: billing_state.toUpperCase().trim(),
      billing_zip: billing_zip.replace(/\D/g, ''), // Remove non-digits
      billing_country: sanitizeAddress(billing_country || 'US'),
      billing_phone: billing_phone.replace(/\D/g, ''), // Remove non-digits
      updated_at: new Date().toISOString()
    };

    // Handle shipping address
    if (same_as_billing) {
      // Copy billing to shipping
      updateData.shipping_street = updateData.billing_street;
      updateData.shipping_city = updateData.billing_city;
      updateData.shipping_state = updateData.billing_state;
      updateData.shipping_zip = updateData.billing_zip;
      updateData.shipping_country = updateData.billing_country;
      updateData.shipping_phone = updateData.billing_phone;
    } else {
      // Validate shipping address
      const shippingValidation = validateShippingAddress({
        shipping_street,
        shipping_city,
        shipping_state,
        shipping_zip,
        shipping_country,
        shipping_phone
      }, false);

      if (!shippingValidation.valid) {
        return res.status(400).json({
          success: false,
          message: 'Shipping address validation failed',
          errors: shippingValidation.errors
        });
      }

      updateData.shipping_street = sanitizeAddress(shipping_street);
      updateData.shipping_city = sanitizeAddress(shipping_city);
      updateData.shipping_state = shipping_state.toUpperCase().trim();
      updateData.shipping_zip = shipping_zip.replace(/\D/g, '');
      updateData.shipping_country = sanitizeAddress(shipping_country || 'US');
      updateData.shipping_phone = shipping_phone.replace(/\D/g, '');
    }

    // Update user profile
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select('id, email, name, role, billing_street, billing_city, billing_state, billing_zip, billing_country, billing_phone, shipping_street, shipping_city, shipping_state, shipping_zip, shipping_country, shipping_phone, profile_complete')
      .single();

    if (error) {
      console.error('Error updating user profile:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update profile'
      });
    }

    res.json({
      success: true,
      profile: updatedUser,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Error in PUT /api/profile:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Mark profile as complete
router.post('/complete', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // First verify that addresses are complete
    const { data: user } = await supabase
      .from('users')
      .select('billing_street, billing_city, billing_state, billing_zip, billing_country, billing_phone')
      .eq('id', userId)
      .single();

    if (!user || !user.billing_street) {
      return res.status(400).json({
        success: false,
        message: 'Billing address must be completed before marking profile as complete'
      });
    }

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({ profile_complete: true, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select('id, profile_complete')
      .single();

    if (error) {
      console.error('Error marking profile as complete:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to mark profile as complete'
      });
    }

    res.json({
      success: true,
      profile_complete: updatedUser.profile_complete,
      message: 'Profile marked as complete'
    });
  } catch (error) {
    console.error('Error in POST /api/profile/complete:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
