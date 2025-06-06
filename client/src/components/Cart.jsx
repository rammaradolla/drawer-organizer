import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { removeCartItem, clearCart } from '../redux/cartSlice';

export default function Cart() {
  const cart = useSelector(state => state.cart);
  const dispatch = useDispatch();

  if (!cart.length) {
    return (
      <div className="p-6 text-center text-slate-600 flex flex-col items-center justify-center h-full">
        <img src="/images/how-to-measure.jpg" alt="How to Measure Inside Drawer Dimensions" className="w-full max-w-md mb-4 rounded shadow border bg-white" />
        <div className="mb-3 text-base max-w-lg mx-auto text-blue-900 font-semibold">
          Not sure what size you need? Use the guide above to measure your drawer's inner dimensions—width, depth, and height—for a perfect custom fit!
        </div>
        <div className="text-2xl font-bold mb-4 text-blue-700">🛠️ Custom Drawer Organizers, Made for You!</div>
        <div className="flex flex-row gap-4 justify-center mb-4">
          <div className="flex flex-col items-center">
            <img src="/images/organizer1.jpg" alt="Hardwood Organizer" className="w-28 h-24 object-cover rounded shadow border bg-white" />
            <span className="mt-2 text-sm font-medium">Hardwood Organizer</span>
          </div>
          <div className="flex flex-col items-center">
            <img src="/images/organizer2.jpg" alt="Birch Plywood Organizer" className="w-28 h-24 object-cover rounded shadow border bg-white" />
            <span className="mt-2 text-sm font-medium">Birch Plywood Organizer</span>
          </div>
          <div className="flex flex-col items-center">
            <img src="/images/organizer3.jpg" alt="Multi-Compartment Organizer" className="w-28 h-24 object-cover rounded shadow border bg-white" />
            <span className="mt-2 text-sm font-medium">Multi-Compartment Organizer</span>
          </div>
        </div>
        <div className="mb-3 text-base max-w-xs mx-auto">
          Transform your drawers with premium, made-to-order organizers. Choose your wood, layout, and size—see it in 3D before you buy!
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-blue-800 text-sm font-medium shadow-sm mb-2">
          <span>✨ Free shipping on all custom drawer organizers this month! ✨</span>
        </div>
        <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold shadow" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
          Start Designing Now
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Cart</h2>
        <button
          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
          onClick={() => dispatch(clearCart())}
        >
          Clear Cart
        </button>
      </div>
      <div className="grid gap-6">
        {cart.map(item => (
          <div key={item.id} className="border rounded-lg p-4 flex gap-4 items-center bg-white shadow-sm">
            <div>
              <img src={item.image2D} alt="2D Design" className="w-32 h-24 object-contain border mb-2" />
              <img src={item.image3D} alt="3D Preview" className="w-32 h-24 object-contain border" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-slate-800 mb-1">
                {item.dimensions.width}" × {item.dimensions.depth}" × {item.dimensions.height}"
              </div>
              <div className="text-xs text-slate-500 mb-1">Added: {new Date(item.createdAt).toLocaleString()}</div>
              <div className="text-xs text-slate-600">Wood: {item.layout.selectedWoodType}</div>
            </div>
            <button
              className="px-2 py-1 bg-red-400 text-white rounded hover:bg-red-600"
              onClick={() => dispatch(removeCartItem(item.id))}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
} 