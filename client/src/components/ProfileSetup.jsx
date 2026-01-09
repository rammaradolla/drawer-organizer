import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from './UserProvider';
import AddressForm from './AddressForm';
import { validateBillingAddress, validateShippingAddress, copyBillingToShipping } from '../utils/addressUtils';
import axios from 'axios';

export default function ProfileSetup() {
  const { user, refreshUser } = useUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [sameAsBilling, setSameAsBilling] = useState(true);
  
  const [addresses, setAddresses] = useState({
    billing_street: '',
    billing_city: '',
    billing_state: '',
    billing_zip: '',
    billing_country: 'US',
    billing_phone: '',
    shipping_street: '',
    shipping_city: '',
    shipping_state: '',
    shipping_zip: '',
    shipping_country: 'US',
    shipping_phone: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    // If profile is already complete, redirect
    if (user.profile_complete) {
      navigate('/');
      return;
    }
  }, [user, navigate]);

  const handleBillingChange = (newAddress) => {
    setAddresses(prev => ({
      ...prev,
      ...newAddress
    }));

    // If same as billing is checked, update shipping too
    if (sameAsBilling) {
      const shipping = copyBillingToShipping(newAddress);
      setAddresses(prev => ({
        ...prev,
        ...shipping
      }));
    }
  };

  const handleShippingChange = (newAddress) => {
    setAddresses(prev => ({
      ...prev,
      ...newAddress
    }));
  };

  const handleSameAsBillingChange = (checked) => {
    setSameAsBilling(checked);
    if (checked) {
      const shipping = copyBillingToShipping(addresses);
      setAddresses(prev => ({
        ...prev,
        ...shipping
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Validate billing address
    const billingValidation = validateBillingAddress(addresses);
    if (!billingValidation.valid) {
      setErrors(billingValidation.errors);
      return;
    }

    // Validate shipping address
    const shippingValidation = validateShippingAddress(addresses, sameAsBilling);
    if (!shippingValidation.valid) {
      setErrors(shippingValidation.errors);
      return;
    }

    setLoading(true);

    try {
      // Get session for authentication
      const { supabase } = await import('../utils/supabaseClient');
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      // Update profile with addresses
      await axios.put('/api/profile', {
        ...addresses,
        same_as_billing: sameAsBilling
      }, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
      });

      // Mark profile as complete
      await axios.post('/api/profile/complete', {}, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
      });

      // Refresh user data
      if (refreshUser) {
        await refreshUser();
      }

      // Redirect to home
      navigate('/');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Complete Your Profile</h2>
        <p className="text-gray-600 mb-6">
          Please provide your billing and shipping addresses to continue. This information will be saved to your profile for future orders.
        </p>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Billing Address */}
          <div className="border-b pb-6">
            <AddressForm
              type="billing"
              address={addresses}
              onChange={handleBillingChange}
              errors={errors}
            />
          </div>

          {/* Shipping Address */}
          <div>
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={sameAsBilling}
                  onChange={(e) => handleSameAsBillingChange(e.target.checked)}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  Shipping address is the same as billing address
                </span>
              </label>
            </div>

            {!sameAsBilling && (
              <AddressForm
                type="shipping"
                address={addresses}
                onChange={handleShippingChange}
                errors={errors}
              />
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Skip for Now
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
