import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { addCartItem } from '../redux/cartSlice';
import { capture2DImage } from '../utils/capture2DImage';
import { capture3DImage } from '../utils/capture3DImage';
import { createCartItem } from '../utils/createCartItem';
import { resetDesignPlayground } from '../utils/resetDesignPlayground';

export default function AddToCartButton({
  design2DRef,
  threeRenderer,
  designState,
  setDesignState,
  defaultDesignState,
  dimensions,
  layout,
  onReset
}) {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const handleAddToCart = async () => {
    setLoading(true);
    try {
      const image2D = capture2DImage(design2DRef);
      const image3D = capture3DImage(threeRenderer.current);
      const cartItem = createCartItem({
        dimensions,
        layout,
        image2D,
        image3D
      });
      dispatch(addCartItem(cartItem));
      console.log('[AddToCartButton] Calling onReset after add to cart');
      if (onReset) onReset();
    } catch (err) {
      alert('Failed to add to cart: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleAddToCart} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
      {loading ? 'Adding...' : 'Add to Cart'}
    </button>
  );
} 