import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCheckoutSession, redirectToCheckout } from '../utils/stripe';
import { CartItem } from '../types/order';
import { useAuth } from '../hooks/useAuth'; // Assuming you have an auth hook

interface CheckoutButtonProps {
  cartItems: CartItem[];
  className?: string;
  disabled?: boolean;
}

export const CheckoutButton: React.FC<CheckoutButtonProps> = ({
  cartItems,
  className = '',
  disabled = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleCheckout = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (cartItems.length === 0) {
      setError('Your cart is empty');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { checkoutUrl } = await createCheckoutSession({
        userId: user.id,
        cartItems,
      });
      redirectToCheckout(checkoutUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
      console.error('Checkout error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleCheckout}
        disabled={disabled || isLoading || cartItems.length === 0}
        className={`
          px-6 py-3 rounded-lg font-semibold text-white
          bg-blue-600 hover:bg-blue-700 
          disabled:bg-gray-400 disabled:cursor-not-allowed
          transition-colors duration-200
          ${className}
        `}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Processing...
          </span>
        ) : (
          'Place Order'
        )}
      </button>
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  );
}; 