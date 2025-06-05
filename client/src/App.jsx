import React, { useState, useRef } from 'react';
import DrawerSetup from './components/DrawerSetup';
import CanvasEditor from './components/CanvasEditor';
import OrderForm from './components/OrderForm';
import Cart from './components/Cart';

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
      <div className="max-w-[1600px] mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Drawer Organizer Designer
        </h1>

        <div className="flex flex-col md:flex-row w-full h-full">
          {/* Dimensions Sidebar */}
          <div className="w-full md:w-1/5 lg:w-1/6 bg-white rounded-lg shadow-md p-4 mr-4 mb-4 md:mb-0">
            <DrawerSetup
              dimensions={dimensions}
              onDimensionsSet={setDimensions}
            />
          </div>
          {/* Main Editor */}
          <div className="flex-1">
            <CanvasEditor
              key={resetKey}
              ref={canvasEditorRef}
              dimensions={dimensions}
              onCompartmentsChange={setCompartments}
              onClear={handleEditorClear}
              addToCartButtonProps={{
                onReset: handleEditorClear
              }}
            />
          </div>
          {/* Cart Sidebar */}
          <div className="w-full md:w-1/3 bg-gray-50 border-l border-gray-200">
            <Cart />
          </div>
        </div>

        <div className="flex justify-between items-center mt-8">
          <div className="flex items-center space-x-4">
            <div className="text-lg font-semibold">
              Total Price: ${totalPrice.toFixed(2)}
            </div>
            <button
              className="btn btn-secondary"
              onClick={handleExport}
              disabled={isExporting || compartments.length === 0}
            >
              {isExporting ? 'Exporting...' : 'Export Design'}
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setShowOrderForm(true)}
              disabled={compartments.length === 0}
            >
              Place Order
            </button>
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
