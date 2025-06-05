import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { removeCartItem, clearCart } from '../redux/cartSlice';

export default function Cart() {
  const cart = useSelector(state => state.cart);
  const dispatch = useDispatch();

  if (!cart.length) {
    return <div className="p-4 text-slate-500">Cart is empty.</div>;
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