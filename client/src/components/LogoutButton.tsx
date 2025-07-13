import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { clearCart } from '../redux/cartSlice';
import { signOut } from '../utils/auth';
import { supabase } from '../utils/supabaseClient';

const LogoutButton: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const handleLogout = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      // Clear the cart when user signs out
      dispatch(clearCart());
      // Clear checkout completion flag
      sessionStorage.removeItem('justCompletedCheckout');
      console.log('Cart cleared on logout');
    } catch (e) {
      // If session is missing or logout fails, just clear local state and redirect
      localStorage.clear();
      window.location.href = '/login';
      return;
    }
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <button
      onClick={handleLogout}
      className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded flex items-center justify-center gap-2 min-w-[120px]"
      disabled={loading}
    >
      {loading ? (
        <svg className="animate-spin h-5 w-5 text-gray-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      ) : (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1" /></svg>
      )}
      <span>Sign out</span>
    </button>
  );
};

export default LogoutButton; 