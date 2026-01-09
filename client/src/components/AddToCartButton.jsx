import React, { useState } from 'react';
import { useUser } from './UserProvider';
import { capture2DImage } from '../utils/capture2DImage';
import { capture3DImage } from '../utils/capture3DImage';
import {
  dataUrlToBlob,
  uploadPreviewImage,
  upload2DPreviewImage,
  insertDesign,
  addToCart,
  checkDesignInCart,
  clearCartInSupabase
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
      // 3. Capture 2D and 3D previews
      const image2DDataUrl = capture2DImage(design2DRef);
      // Set camera position before capturing 3D image
      if (threeRenderer.current && threeRenderer.current.camera && threeRenderer.current.scene) {
        const cam = threeRenderer.current.camera;
        cam.position.set(16.19, 15.35, -15.93);
        cam.lookAt(0, 0, 0);
        cam.updateProjectionMatrix();
        threeRenderer.current.render(threeRenderer.current.scene, cam);
      }
      const image3DDataUrl = capture3DImage(threeRenderer.current);
      const image2DBlob = await dataUrlToBlob(image2DDataUrl);
      const image3DBlob = await dataUrlToBlob(image3DDataUrl);
      // 4. Upload to Supabase Storage
      const previewUrl = await uploadPreviewImage(user.id, image3DBlob);
      const preview2dUrl = await upload2DPreviewImage(user.id, image2DBlob);
      // 5. Insert design
      const dimensionsStr = `${dimensions.width}x${dimensions.depth}x${dimensions.height}`;
      const woodType = layout.selectedWoodType;
      console.log("Inserting design with:", {
        userId: user.id,
        jsonLayout,
        woodType,
        dimensions: dimensionsStr,
        previewUrl,
        preview2dUrl,
      });
      const designId = await insertDesign({
        userId: user.id,
        jsonLayout,
        woodType,
        dimensions: dimensionsStr,
        previewUrl,
        preview2dUrl,
        customerNotes: '', // Will be updated later via CartItemForm
        drawerPhotoUrl: '', // Will be updated later via CartItemForm
      });
      // 6. Add to cart
      await addToCart(user.id, designId);
      // 7. Add to Redux cart
      const dividers = (layout.splitLines || []).map(line => {
        if (line.isHorizontal) {
          return {
            length: Math.abs(line.x2 - line.x1) / 10, // px to inches
            height: dimensions.height
          };
        } else {
          return {
            length: Math.abs(line.y2 - line.y1) / 10, // px to inches
            height: dimensions.height
          };
        }
      });
      const cartItem = createCartItem({
        dimensions,
        layout: { ...layout, dividers }, // add dividers to layout
        image2D: preview2dUrl,
        image3D: previewUrl,
        designId: designId
      });
      dispatch(addCartItem(cartItem));
      if (onReset) onReset();
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