import React, { useState } from 'react';
import { useUser } from './UserProvider';
import { capture2DImage } from '../utils/capture2DImage';
import { capture3DImage } from '../utils/capture3DImage';
import {
  dataUrlToBlob,
  uploadPreviewImage,
  insertDesign,
  addToCart,
  checkDesignInCart
} from '../utils/supabaseDesigns';
import { useDispatch } from 'react-redux';
import { addCartItem } from '../redux/cartSlice';
import { createCartItem } from '../utils/createCartItem';

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
  const { user } = useUser();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const handleAddToCart = async () => {
    if (!user) {
      alert('You must be logged in to add to cart.');
      return;
    }
    setLoading(true);
    try {
      // 1. Prepare layout JSON
      const jsonLayout = JSON.stringify(layout);
      // 2. Check if design already in cart
      const existingDesignId = await checkDesignInCart(user.id, jsonLayout);
      if (existingDesignId) {
        alert('This design is already in your cart.');
        setLoading(false);
        return;
      }
      // 3. Capture 3D preview as PNG dataURL and convert to Blob
      const image3DDataUrl = capture3DImage(threeRenderer.current);
      const image3DBlob = await dataUrlToBlob(image3DDataUrl);
      // 4. Upload to Supabase Storage
      const previewUrl = await uploadPreviewImage(user.id, image3DBlob);
      // 5. Insert design
      const dimensionsStr = `${dimensions.width}x${dimensions.depth}x${dimensions.height}`;
      const woodType = layout.selectedWoodType;
      console.log("Inserting design with:", {
        userId: user.id,
        jsonLayout,
        woodType,
        dimensions: dimensionsStr,
        previewUrl,
      });
      const designId = await insertDesign({
        userId: user.id,
        jsonLayout,
        woodType,
        dimensions: dimensionsStr,
        previewUrl,
      });
      // 6. Add to cart
      await addToCart(user.id, designId);
      // 7. Add to Redux cart
      const cartItem = createCartItem({
        dimensions,
        layout,
        image2D: null, // You may want to capture 2D image as well if available
        image3D: previewUrl
      });
      dispatch(addCartItem(cartItem));
      if (onReset) onReset();
      alert('Design added to cart!');
    } catch (err) {
      alert('Failed to add to cart: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleAddToCart} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap">
      {loading ? 'Adding...' : 'Add to Cart'}
    </button>
  );
} 