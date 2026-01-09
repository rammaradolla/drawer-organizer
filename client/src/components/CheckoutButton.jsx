import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from './UserProvider';
import axios from 'axios';
import CheckoutAddressForm from './CheckoutAddressForm';

const CheckoutButton = ({ cart, quantities, user }) => {
  const { user: contextUser } = useUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addresses, setAddresses] = useState(null);

  const handleCheckout = async () => {
    // Check if user profile is complete
    const currentUser = contextUser || user;
    if (!currentUser) {
      alert('Please log in to continue.');
      return;
    }

    if (!currentUser.profile_complete) {
      // Redirect to profile setup
      if (window.confirm('Please complete your profile with billing and shipping addresses before placing an order.')) {
        navigate('/profile/setup');
      }
      return;
    }

    // Show address form for review/edit
    setShowAddressForm(true);
  };

  const handleAddressesReady = async (addressData) => {
    setAddresses(addressData);
    setShowAddressForm(false);
    await proceedToCheckout(addressData);
  };

  const proceedToCheckout = async (addressData) => {
    setLoading(true);
    try {
      const currentUser = contextUser || user;
      if (!currentUser?.id) {
        alert('User ID not found. Please log in again.');
        setLoading(false);
        return;
      }

      // Prepare cart items with correct quantity
      const cartWithQuantities = cart.map(item => ({
        ...item,
        quantity: quantities[item.id] || 1
      }));

      const { data: { checkoutUrl } } = await axios.post('/api/stripe/create-checkout-session', {
        userId: currentUser.id,
        cartItems: cartWithQuantities,
        addresses: addressData
      });

      // Redirect to Stripe Checkout
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      console.error('Error details:', error.response?.data);
      
      if (error.response?.data?.errors) {
        alert('Address validation failed: ' + error.response.data.errors.join(', '));
      } else if (error.response?.data?.error) {
        alert(`Checkout failed: ${error.response.data.error}`);
      } else if (error.response?.status === 500) {
        alert('Server error occurred. Please check the console for details and contact support if the issue persists.');
      } else {
        alert(`Failed to start checkout: ${error.message || 'Please try again.'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (showAddressForm) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
          <CheckoutAddressForm
            onAddressesReady={handleAddressesReady}
            onCancel={() => setShowAddressForm(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleCheckout}
      disabled={loading || !cart.length}
      className="px-6 py-3 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
    >
      {loading ? 'Processing...' : 'Place Order'}
    </button>
  );
};

export default CheckoutButton; 