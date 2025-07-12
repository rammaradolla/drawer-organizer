import React, { useState, useRef } from 'react';
import DrawerSetup from './components/DrawerSetup';
import CanvasEditor from './components/CanvasEditor';
import OrderForm from './components/OrderForm';
import Cart from './components/Cart';
import { useSelector, useDispatch } from 'react-redux';
import InfoBanner from './components/InfoBanner';
import { UserProvider, useUser } from './components/UserProvider';
import LoginButton from './components/LoginButton';
import UserInfo from './components/UserInfo';
import { setCart } from './redux/cartSlice';
import { fetchCartItems } from './utils/supabaseDesigns';
import { createCartItem } from './utils/createCartItem';
import CheckoutButton from './components/CheckoutButton';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import MyOrders from './components/MyOrders';
import Fulfillment from './components/Fulfillment';
import { CheckoutSuccess } from './components/CheckoutSuccess';
import AdminDashboard from './components/AdminDashboard';
import { supabase } from './utils/supabaseClient';
import { startImpersonation, stopImpersonation } from './utils/auth';

const BASE_RATE = 2.50; // $2.50 per square inch (updated from cm)
const MATERIAL_MULTIPLIER = 1.5; // 50% markup for material and labor

const DEFAULT_DIMENSIONS = {
  width: 30,
  depth: 20,
  height: 3
};

function App() {
  const [dimensions, setDimensions] = useState(DEFAULT_DIMENSIONS);
  const [compartments, setCompartments] = useState([]);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const canvasEditorRef = useRef();
  const cart = useSelector(state => state.cart);
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const [showImpersonateModal, setShowImpersonateModal] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [toast, setToast] = useState({ message: '', type: '' });

  // Helper to show toast
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 3000);
  };

  // User context
  const { user, loading, refreshUser } = useUser();
  // Sync cart from Supabase on user login/change
  React.useEffect(() => {
    // Don't sync cart if on the checkout success page
    if (location.pathname.startsWith('/checkout/success')) return;

    const syncCart = async () => {
      if (user) {
        try {
          console.log('Syncing cart for user:', user.id);
          const items = await fetchCartItems(user.id);
          console.log('Fetched cart items:', items.length);
          
          const mapped = items.map(item => {
            const design = item.designs;
            const layout = JSON.parse(design.json_layout);
            // Rebuild dividers from splitLines
            const dividers = (layout.splitLines || []).map(line => {
              if (line.isHorizontal) {
                return {
                  length: Math.abs(line.x2 - line.x1) / 10,
                  height: parseFloat(design.dimensions.split('x')[2]) || 6
                };
              } else {
                return {
                  length: Math.abs(line.y2 - line.y1) / 10,
                  height: parseFloat(design.dimensions.split('x')[2]) || 6
                };
              }
            });
            return createCartItem({
              dimensions: parseDimensions(design.dimensions),
              layout: { ...layout, dividers },
              image2D: design.preview2d_url || null,
              image3D: design.preview_url,
              createdAt: design.created_at,
              customerNotes: design.customer_notes || '',
              drawerPhotoUrl: design.drawer_photo_url || '',
              designId: design.id
            });
          });
          dispatch(setCart(mapped));
          console.log('Cart synced successfully, items:', mapped.length);
        } catch (e) {
          console.error('Failed to sync cart:', e);
          // If sync fails, clear the cart to avoid showing stale data
          dispatch(setCart([]));
        }
      } else {
        console.log('No user, clearing cart');
        dispatch(setCart([]));
      }
    };
    syncCart();
    // eslint-disable-next-line
  }, [user, location.pathname]);

  // Clear cart when user changes (sign out/in)
  React.useEffect(() => {
    if (!user) {
      console.log('User signed out, clearing cart');
      dispatch(setCart([]));
    }
  }, [user, dispatch]);

  // Check if user just completed checkout and clear cart if needed
  React.useEffect(() => {
    const justCompletedCheckout = sessionStorage.getItem('justCompletedCheckout');
    if (justCompletedCheckout === 'true' && user) {
      console.log('User just completed checkout, ensuring cart is cleared');
      dispatch(setCart([]));
      sessionStorage.removeItem('justCompletedCheckout');
    }
  }, [user, dispatch]);

  // Redirect operations users to fulfillment dashboard
  React.useEffect(() => {
    if (user && user.role === 'operations' && location.pathname === '/') {
      console.log('Operations user detected, redirecting to fulfillment');
      navigate('/fulfillment', { replace: true });
    }
  }, [user, location.pathname, navigate]);

  // Redirect admin users to admin dashboard
  React.useEffect(() => {
    if (user && user.role === 'admin' && location.pathname === '/') {
      console.log('Admin user detected, redirecting to admin dashboard');
      navigate('/admin', { replace: true });
    }
  }, [user, location.pathname, navigate]);

  // Prevent operations users from accessing the main designer page
  React.useEffect(() => {
    if (user && user.role === 'operations' && location.pathname === '/' && !loading) {
      console.log('Operations user trying to access main page, redirecting to fulfillment');
      navigate('/fulfillment', { replace: true });
    }
  }, [user, location.pathname, loading, navigate]);

  // Prevent operations users from accessing the orders page
  React.useEffect(() => {
    if (user && user.role === 'operations' && location.pathname === '/orders' && !loading) {
      console.log('Operations user trying to access orders page, redirecting to fulfillment');
      navigate('/fulfillment', { replace: true });
    }
  }, [user, location.pathname, loading, navigate]);

  // Redirect department head users to fulfillment dashboard
  React.useEffect(() => {
    if (user && user.role === 'department_head' && location.pathname === '/') {
      navigate('/fulfillment', { replace: true });
    }
  }, [user, location.pathname, navigate]);

  // Redirect department member users to fulfillment dashboard
  React.useEffect(() => {
    if (user && user.role === 'department_member' && location.pathname === '/') {
      navigate('/fulfillment', { replace: true });
    }
  }, [user, location.pathname, navigate]);

  // Update page title based on user role and current page
  React.useEffect(() => {
    const getTitle = () => {
      if (location.pathname.startsWith('/fulfillment')) {
        return 'Fulfillment Dashboard - Drawer Organizer';
      }
      if (location.pathname.startsWith('/admin')) {
        return 'Admin Dashboard - Drawer Organizer';
      }
      if (location.pathname.startsWith('/orders')) {
        return 'My Orders - Drawer Organizer';
      }
      // Default title for customers on the main page
      return 'Drawer Organizer Designer';
    };
    document.title = getTitle();
  }, [user, location.pathname]);

  // Fetch all users for impersonation modal (real API)
  React.useEffect(() => {
    async function fetchImpersonatableUsers() {
      if ((user?.role === 'admin' || user?.role === 'operations') && showImpersonateModal) {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const accessToken = sessionData?.session?.access_token;
          const res = await fetch('/api/admin/users/impersonatable', {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          const data = await res.json();
          if (data.success) {
            setAllUsers(data.users);
          } else {
            setAllUsers([]);
          }
        } catch (e) {
          setAllUsers([]);
        }
      } else if (!showImpersonateModal) {
        setAllUsers([]);
      }
    }
    fetchImpersonatableUsers();
    // eslint-disable-next-line
  }, [showImpersonateModal, user]);

  const filteredUsers = allUsers.filter(u => {
    const search = userSearch.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(search)) ||
      (u.email && u.email.toLowerCase().includes(search)) ||
      (u.role && u.role.toLowerCase().includes(search))
    );
  });

  // Helper to parse dimensions string (e.g., "30x20x6")
  function parseDimensions(dimStr) {
    if (!dimStr) return { width: 0, depth: 0, height: 0 };
    const [width, depth, height] = dimStr.split('x').map(Number);
    return { width, depth, height };
  }

  const calculatePrice = () => {
    // Calculate total area of compartments in square inches
    const totalArea = compartments.reduce((sum, comp) => {
      // Convert from pixels to inches
      const width = comp.width / 10; // PIXELS_PER_INCH = 10
      const height = comp.height / 10;
      return sum + (width * height);
    }, 0);

    return totalArea * BASE_RATE * MATERIAL_MULTIPLIER;
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('http://localhost:3000/api/design/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          design: {
            width: dimensions.width,
            depth: dimensions.depth,
            height: dimensions.height,
            compartments: compartments.map(comp => ({
              ...comp,
              // Convert pixels to inches
              x: comp.x / 10,
              y: comp.y / 10,
              width: comp.width / 10,
              height: comp.height / 10,
            })),
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to export design');
      }

      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'drawer-design.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export design. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleOrderSubmit = async (orderData) => {
    const response = await fetch('http://localhost:3000/api/order/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      throw new Error('Failed to submit order');
    }

    alert('Order submitted successfully!');
    setShowOrderForm(false);
  };

  const handleEditorClear = () => {
    if (canvasEditorRef.current) {
      canvasEditorRef.current.handleClear();
    }
  };

  // Calculate total price from cart items
  const totalPrice = cart.reduce((sum, item) => sum + (item.price || 0), 0);

  console.log('Current user context:', user);
  // Redirect based on impersonated user role
  React.useEffect(() => {
    if (!user || loading) return;
    // Admin route guard
    if (location.pathname.startsWith('/admin') && user.role !== 'admin') {
      if (user.role === 'customer') navigate('/', { replace: true });
      else if (user.role === 'operations') navigate('/fulfillment', { replace: true });
      else navigate('/', { replace: true });
    }
    // Fulfillment route guard
    if (location.pathname.startsWith('/fulfillment') && user.role !== 'operations' && user.role !== 'admin' && user.role !== 'department_head' && user.role !== 'department_member') {
      navigate('/', { replace: true });
    }
    // Customer route guard (main page)
    if (location.pathname === '/' && user.role !== 'customer') {
      if (user.role === 'admin') navigate('/admin', { replace: true });
      else if (user.role === 'operations') navigate('/fulfillment', { replace: true });
    }
  }, [user, location.pathname, loading, navigate]);

  // Add a useEffect to handle user context changes from impersonation to admin
  React.useEffect(() => {
    if (user && user.role === 'admin' && location.pathname !== '/admin' && location.pathname !== '/fulfillment' && !user.isImpersonating) {
      navigate('/admin', { replace: true });
    }
    // eslint-disable-next-line
  }, [user, location.pathname]);

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      {/* Impersonation Banner */}
      {user && user.isImpersonating && (
        <div className="w-full bg-yellow-100 border-b-2 border-yellow-400 text-yellow-900 px-6 py-3 flex items-center justify-between z-50 fixed top-0 left-0" style={{minHeight: 56}}>
          <div>
            <b>Impersonation Mode:</b> You are impersonating <b>{user.name}</b> ({user.role})
            {user.impersonator && (
              <span className="ml-2 text-xs text-gray-600">(as {user.impersonator.role})</span>
            )}
          </div>
          <button
            className="ml-4 px-4 py-2 bg-yellow-300 text-yellow-900 rounded hover:bg-yellow-400 font-semibold"
            onClick={() => {
              stopImpersonation();
              if (typeof refreshUser === 'function') {
                refreshUser().then(() => {
                  // After user context refresh, if admin and not on /admin, redirect
                  if (user && user.role === 'admin' && location.pathname !== '/admin') {
                    navigate('/admin', { replace: true });
                  }
                });
              }
              showToast('Impersonation ended.', 'info');
            }}
          >
            Stop Impersonation
          </button>
        </div>
      )}
      {toast.message && (
        <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded shadow-lg text-lg font-semibold flex items-center gap-2 animate-fade-in ${toast.type === 'success' ? 'bg-green-100 border border-green-400 text-green-700' : toast.type === 'error' ? 'bg-red-100 border border-red-400 text-red-700' : 'bg-blue-100 border border-blue-400 text-blue-700'}`}> 
          {toast.message}
        </div>
      )}
      <div className="w-full px-4" style={{paddingTop: user && user.isImpersonating ? 72 : 0}}>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Drawer Organizer Designer
          </h1>
          <div className="flex items-center gap-6">
            {/* Show Home link for customers only */}
            {(!user || user.role === 'customer') && (
              <Link to="/" className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 font-semibold">Home</Link>
            )}
            {/* Show My Orders link for customers only */}
            {(!user || user.role === 'customer') && (
              <Link to="/orders" className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 font-semibold">My Orders</Link>
            )}
            {/* Fulfillment link - only for operations users */}
            {user && user.role === 'operations' && (
              <Link to="/fulfillment" className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 font-semibold rounded">
                Dashboard
              </Link>
            )}
            {/* Admin-only links: Admin Panel and Fulfillment */}
            {user && user.role === 'admin' && (
              <>
                <Link to="/admin" className="px-4 py-2 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 font-semibold">
                  Admin Panel
                </Link>
                <Link to="/fulfillment" className="px-4 py-2 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 font-semibold ml-4">
                  Fulfillment
                </Link>
              </>
            )}
            {/* Impersonate Button for admin/operations */}
            {(user && (user.role === 'admin' || user.role === 'operations')) && (
              <button
                className="px-4 py-2 bg-yellow-200 text-yellow-900 rounded font-semibold ml-2 disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={() => setShowImpersonateModal(true)}
                disabled={user.isImpersonating}
                title={user.isImpersonating ? 'You cannot impersonate another user while already impersonating.' : ''}
              >
                Impersonate User
              </button>
            )}
            <div className="ml-6">
              {user ? (
                <UserInfo />
              ) : (
                <LoginButton variant="header" />
              )}
            </div>
          </div>
        </div>
        {/* Impersonate Modal */}
        {showImpersonateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg p-8 min-w-[400px] max-w-[98vw] relative">
              <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl" onClick={() => setShowImpersonateModal(false)}>&times;</button>
              <h2 className="text-xl font-bold mb-4">Impersonate User</h2>
              <input
                type="text"
                placeholder="Search by name, email, or role..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                className="mb-4 px-3 py-2 border rounded w-full"
              />
              <div className="overflow-y-auto" style={{ minHeight: 200, maxHeight: 256 }}>
                {filteredUsers.length === 0 ? (
                  <div className="text-gray-500">No users found.</div>
                ) : (
                  <ul>
                    {filteredUsers.map(u => (
                      <li key={u.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                        <div>
                          <b>{u.name}</b> <span className="text-xs text-gray-500">({u.email})</span> <span className="text-xs text-gray-400">[{u.role}]</span>
                        </div>
                        <button
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold"
                          onClick={async () => {
                            try {
                              const { data: sessionData } = await supabase.auth.getSession();
                              const accessToken = sessionData?.session?.access_token;
                              const res = await fetch('/api/admin/impersonate', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                  Authorization: `Bearer ${accessToken}`
                                },
                                body: JSON.stringify({ targetUserId: u.id })
                              });
                              const data = await res.json();
                              if (data.success && data.token) {
                                startImpersonation(data.token);
                                setShowImpersonateModal(false);
                                if (typeof refreshUser === 'function') refreshUser();
                                showToast('Impersonation started!', 'success');
                              } else {
                                showToast(data.message || 'Failed to impersonate user.', 'error');
                              }
                            } catch (err) {
                              showToast('Failed to impersonate user.', 'error');
                            }
                          }}
                        >
                          Impersonate
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
        {/* Hide InfoBanner for operations and admin users */}
        {(!user || user.role === 'customer') && <InfoBanner />}
        <Routes>
          <Route path="/orders" element={<MyOrders />} />
          <Route path="/fulfillment" element={<Fulfillment />} />
          <Route path="/checkout/success" element={<CheckoutSuccess />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="*" element={
            <div className="flex flex-row w-full h-full">
              {/* Main Editor - Show only for customers */}
              {(!user || user.role === 'customer') ? (
                <>
                  <div className="flex-[2_2_0%] min-w-0">
                    <CanvasEditor
                      key={resetKey}
                      ref={canvasEditorRef}
                      onCompartmentsChange={setCompartments}
                      onClear={handleEditorClear}
                      addToCartButtonProps={{
                        onReset: handleEditorClear
                      }}
                    />
                  </div>
                  {/* Cart Sidebar - Always show Cart, let Cart handle sign-in prompt */}
                  <div className="flex-[1_1_0%] min-w-[320px] bg-gray-50 border-l border-gray-200 flex flex-col ml-6">
                    {loading ? (
                      <div className="flex items-center justify-center h-full">Loading...</div>
                    ) : (
                      <Cart />
                    )}
                  </div>
                </>
              ) : (
                /* Operations and Admin users see a message here if they navigate to the root path */
                <div className="w-full flex items-center justify-center">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Welcome</h2>
                    <p className="text-gray-600 mb-4">Please use the navigation links above to manage the platform.</p>
                    {user && user.role === 'operations' && (
                       <Link to="/fulfillment" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                         Go to Fulfillment Dashboard
                       </Link>
                    )}
                     {user && user.role === 'admin' && (
                       <Link to="/fulfillment" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mr-2">
                         Go to Fulfillment
                       </Link>
                    )}
                     {user && user.role === 'admin' && (
                       <Link to="/admin" className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                         Go to Admin Panel
                       </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          } />
        </Routes>
      </div>
    </div>
  );
}

// Wrap App in UserProvider
const AppWithProvider = () => (
  <UserProvider>
    <App />
  </UserProvider>
);

export default AppWithProvider;
