import React, { useState, useEffect } from 'react';
import { useUser } from './UserProvider';
import AddressForm from './AddressForm';
import { validateBillingAddress, validateShippingAddress, copyBillingToShipping } from '../utils/addressUtils';

export default function CheckoutAddressForm({ onAddressesReady, onCancel }) {
  const { user, loading: userLoading } = useUser();
  const [errors, setErrors] = useState({});
  const [sameAsBilling, setSameAsBilling] = useState(false);
  
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

  // Auto-populate addresses from user profile when user data is available
  useEffect(() => {
    if (userLoading || !user) {
      return;
    }

    // Auto-populate from user profile data that's already loaded in context
    const populatedAddresses = {
      billing_street: user.billing_street || '',
      billing_city: user.billing_city || '',
      billing_state: user.billing_state || '',
      billing_zip: user.billing_zip || '',
      billing_country: user.billing_country || 'US',
      billing_phone: user.billing_phone || '',
      shipping_street: user.shipping_street || '',
      shipping_city: user.shipping_city || '',
      shipping_state: user.shipping_state || '',
      shipping_zip: user.shipping_zip || '',
      shipping_country: user.shipping_country || 'US',
      shipping_phone: user.shipping_phone || ''
    };

    // Check if shipping is same as billing based on profile data
    // Only mark as same if all key fields match and they're not empty
    const hasBillingData = user.billing_street && user.billing_city && user.billing_state;
    const hasShippingData = user.shipping_street && user.shipping_city && user.shipping_state;
    
    let shouldBeSame = false;
    if (hasBillingData && hasShippingData) {
      shouldBeSame = 
        user.shipping_street === user.billing_street &&
        user.shipping_city === user.billing_city &&
        user.shipping_state === user.billing_state &&
        user.shipping_zip === user.billing_zip;
    } else if (hasBillingData && !hasShippingData) {
      // If only billing is populated, default to same as billing
      shouldBeSame = true;
    }

    // If addresses are the same, ensure shipping matches billing
    if (shouldBeSame && hasBillingData) {
      const shipping = copyBillingToShipping(populatedAddresses);
      Object.assign(populatedAddresses, shipping);
    }

    setAddresses(populatedAddresses);
    setSameAsBilling(shouldBeSame);
  }, [user, userLoading]);

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

  const handleContinue = () => {
    setErrors({});

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

    if (onAddressesReady) {
      onAddressesReady({
        ...addresses,
        same_as_billing: sameAsBilling
      });
    }
  };

  if (userLoading) {
    return (
      <div className="text-center py-4">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-sm text-gray-600">Loading your address information...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900">Shipping & Billing Information</h3>
      <p className="text-sm text-gray-600">Review and confirm your addresses for this order.</p>

      <form onSubmit={(e) => { e.preventDefault(); handleContinue(); }} className="space-y-6">
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

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Continue to Payment
          </button>
        </div>
      </form>
    </div>
  );
}
