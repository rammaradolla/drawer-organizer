import React, { useState, useRef } from 'react';
import DrawerSetup from './components/DrawerSetup';
import CanvasEditor from './components/CanvasEditor';
import OrderForm from './components/OrderForm';
import Cart from './components/Cart';
import { useSelector } from 'react-redux';
import InfoBanner from './components/InfoBanner';

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

  const totalPrice = calculatePrice();

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="w-full px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Drawer Organizer Designer
        </h1>

        <InfoBanner />

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
          {/* Cart Sidebar */}
          <div className="flex-[1_1_0%] min-w-[320px] bg-gray-50 border-l border-gray-200 flex flex-col ml-6">
            <Cart />
            {cart.length > 0 && (
              <div className="p-4 mt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-lg font-semibold">
                    Total Price: ${totalPrice.toFixed(2)}
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowOrderForm(true)}
                    disabled={compartments.length === 0}
                  >
                    Place Order
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        {showOrderForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4">
                <button
                  className="float-right text-gray-500 hover:text-gray-700"
                  onClick={() => setShowOrderForm(false)}
                >
                  ✕
                </button>
                <OrderForm
                  design={{
                    ...dimensions,
                    compartments: compartments.map(comp => ({
                      ...comp,
                      x: comp.x / 10,
                      y: comp.y / 10,
                      width: comp.width / 10,
                      height: comp.height / 10,
                    })),
                  }}
                  totalPrice={totalPrice}
                  onSubmit={handleOrderSubmit}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
