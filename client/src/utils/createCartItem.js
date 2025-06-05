export function createCartItem({ dimensions, layout, image2D, image3D }) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    dimensions,
    layout,
    image2D,
    image3D,
    createdAt: new Date().toISOString(),
  };
} 