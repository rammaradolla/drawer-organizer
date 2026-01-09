import React, { useState, useEffect } from 'react';
import { useUser } from './UserProvider';
import AddressForm from './AddressForm';
import { validateBillingAddress, validateShippingAddress, copyBillingToShipping } from '../utils/addressUtils';
import axios from 'axios';

export default function ProfileSettings() {
  const { user, refreshUser } = useUser();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [sameAsBilling, setSameAsBilling] = useState(false);
  const [message, setMessage] = useState('');
  
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

  const [name, setName] = useState('');

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { supabase } = await import('../utils/supabaseClient');
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      const response = await axios.get('/api/profile', {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
      });

      if (response.data.success && response.data.profile) {
        const profile = response.data.profile;
        setName(profile.name || '');
        setAddresses({
          billing_street: profile.billing_street || '',
          billing_city: profile.billing_city || '',
          billing_state: profile.billing_state || '',
          billing_zip: profile.billing_zip || '',
          billing_country: profile.billing_country || 'US',
          billing_phone: profile.billing_phone || '',
          shipping_street: profile.shipping_street || '',
          shipping_city: profile.shipping_city || '',
          shipping_state: profile.shipping_state || '',
          shipping_zip: profile.shipping_zip || '',
          shipping_country: profile.shipping_country || 'US',
          shipping_phone: profile.shipping_phone || ''
        });

        // Check if shipping is same as billing
        const isSame = 
          profile.shipping_street === profile.billing_street &&
          profile.shipping_city === profile.billing_city &&
          profile.shipping_state === profile.billing_state;
        setSameAsBilling(isSame);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      alert('Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBillingChange = (newAddress) => {
    setAddresses(prev => ({
      ...prev,
      ...newAddress
    }));

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
    setMessage('');

    const billingValidation = validateBillingAddress(addresses);
    if (!billingValidation.valid) {
      setErrors(billingValidation.errors);
      return;
    }

    const shippingValidation = validateShippingAddress(addresses, sameAsBilling);
    if (!shippingValidation.valid) {
      setErrors(shippingValidation.errors);
      return;
    }

    setSaving(true);

    try {
      const { supabase } = await import('../utils/supabaseClient');
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      await axios.put('/api/profile', {
        name,
        ...addresses,
        same_as_billing: sameAsBilling
      }, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
      });

      setMessage('Profile updated successfully!');
      if (refreshUser) {
        await refreshUser();
      }

      // Clear message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="text-center">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Settings</h2>

        {message && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your full name"
            />
          </div>

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
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
