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
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import MyOrders from './components/MyOrders';
import Fulfillment from './components/Fulfillment';

const BASE_RATE = 2.50; // $2.50 per square inch (updated from cm)
const MATERIAL_MULTIPLIER = 1.5; // 50% markup for material and labor

const DEFAULT_DIMENSIONS = {
  width: 30,
  depth: 20,
  height: 6
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

  // User context
  const { user, loading } = useUser();
  console.log('DEBUG USER:', user);

  // Sync cart from Supabase on user login/change
  React.useEffect(() => {
    // Don't sync cart if on the checkout success page
    if (location.pathname.startsWith('/checkout/success')) return;

    const syncCart = async () => {
      if (user) {
        try {
          const items = await fetchCartItems(user.id);
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
              createdAt: design.created_at
            });
          });
          dispatch(setCart(mapped));
        } catch (e) {
          console.error('Failed to sync cart:', e);
        }
      } else {
        dispatch(setCart([]));
      }
    };
    syncCart();
    // eslint-disable-next-line
  }, [user, location.pathname]);

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

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="w-full px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Drawer Organizer Designer
          </h1>
          <div className="flex items-center gap-6">
            <Link to="/" className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 font-semibold">Home</Link>
            <Link to="/orders" className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 font-semibold">My Orders</Link>
            {/* Fulfillment link for operations and admin */}
            {user && (user.role === 'operations' || user.role === 'admin') && (
              <Link to="/fulfillment" className="px-4 py-2 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 font-semibold">
                Fulfillment
              </Link>
            )}
            {/* Admin-only link example */}
            {user && user.role === 'admin' && (
              <Link to="/admin" className="px-4 py-2 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 font-semibold">
                Admin Panel
              </Link>
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
        <InfoBanner />
        <Routes>
          <Route path="/orders" element={<MyOrders />} />
          <Route path="/fulfillment" element={<Fulfillment />} />
          <Route path="*" element={
            <div className="flex flex-row w-full h-full">
              {/* Main Editor (CanvasEditor now manages dimensions and DrawerSetup) */}
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
              {/* Cart Sidebar - Protected */}
              <div className="flex-[1_1_0%] min-w-[320px] bg-gray-50 border-l border-gray-200 flex flex-col ml-6">
                {loading ? (
                  <div className="flex items-center justify-center h-full">Loading...</div>
                ) : user ? (
                  <Cart />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-4">
                    <div className="text-lg font-semibold text-gray-700">Sign in to access your cart</div>
                    <LoginButton id="login-btn" />
                  </div>
                )}
              </div>
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
