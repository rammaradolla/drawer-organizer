import React, { useState } from 'react';
import axios from 'axios';

const CheckoutButton = ({ cart, quantities, user }) => {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      // Prepare cart items with correct quantity
      const cartWithQuantities = cart.map(item => ({
        ...item,
        quantity: quantities[item.id] || 1
      }));
      const { data: { checkoutUrl } } = await axios.post('/api/stripe/create-checkout-session', { userId: user?.id, cartItems: cartWithQuantities });
      // Redirect to Stripe Checkout
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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