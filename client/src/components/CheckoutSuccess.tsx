import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../config/supabaseClient';
import { Order } from '../types/order';
import { useDispatch } from 'react-redux';
import { clearCart } from '../redux/cartSlice';
import { clearCartInSupabase } from '../utils/supabaseDesigns';
import { useAuth } from '../hooks/useAuth';

export const CheckoutSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dispatch = useDispatch();
  const { user } = useAuth();
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      setError('No session ID found');
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('stripe_checkout_id', sessionId)
          .single();

        if (error) throw error;
        setOrder(data);

        // Always clear Redux cart first
        dispatch(clearCart());
        console.log('Redux cart cleared');

        // Clear Supabase cart if user is present
        if (user) {
          try {
            await clearCartInSupabase(user.id);
            console.log('Supabase cart cleared for user:', user.id);
          } catch (clearError) {
            console.error('Failed to clear Supabase cart:', clearError);
            // Don't fail the entire process if cart clearing fails
          }
        }

        // Set flag to ensure cart stays cleared even after navigation
        sessionStorage.setItem('justCompletedCheckout', 'true');

        setShowConfirmation(true);
      } catch (err) {
        console.error('Error in fetchOrder:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch order');
        
        // Even if order fetch fails, still try to clear the cart
        dispatch(clearCart());
        if (user) {
          try {
            await clearCartInSupabase(user.id);
            console.log('Cart cleared despite order fetch error');
          } catch (clearError) {
            console.error('Failed to clear cart after order fetch error:', clearError);
          }
        }
        
        // Set flag even in error case to ensure cart stays cleared
        sessionStorage.setItem('justCompletedCheckout', 'true');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [searchParams, dispatch, user]);

  useEffect(() => {
    if (showConfirmation) {
      const timer = setTimeout(() => setShowConfirmation(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showConfirmation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/cart')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Return to Cart
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Order Not Found</h2>
          <button
            onClick={() => navigate('/cart')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Return to Cart
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {showConfirmation && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 bg-green-100 border border-green-400 text-green-700 px-6 py-3 rounded shadow-lg text-lg font-semibold flex items-center gap-2 animate-fade-in">
          <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Cart cleared after successful order!
        </div>
      )}
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-8">
            <div className="text-center">
              <svg
                className="mx-auto h-16 w-16 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <h2 className="mt-4 text-3xl font-extrabold text-gray-900">
                Thank you for your order!
              </h2>
              <p className="mt-2 text-lg text-gray-600">
                Your order has been successfully placed.
              </p>
            </div>

            <div className="mt-8 border-t border-gray-200 pt-8">
              <dl className="divide-y divide-gray-200">
                <div className="py-4 flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Order ID</dt>
                  <dd className="text-sm text-gray-900">{order.id}</dd>
                </div>
                <div className="py-4 flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="text-sm text-gray-900 capitalize">{order.status}</dd>
                </div>
                <div className="py-4 flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Total</dt>
                  <dd className="text-sm text-gray-900">
                    ${order.total_price.toFixed(2)}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="mt-8 flex justify-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Continue Shopping
              </button>
              <button
                onClick={() => navigate('/orders')}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                View Orders
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 