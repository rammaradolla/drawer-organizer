export function createCartItem({ dimensions, layout, image2D, image3D, createdAt }) {
  // Calculate main area in square inches (1 square inch = $1)
  const mainArea = Math.round((dimensions.width || 0) * (dimensions.depth || 0));

  // Calculate total divider area (sum of length * height for each divider)
  let dividerArea = 0;
  if (layout && Array.isArray(layout.dividers)) {
    dividerArea = layout.dividers.reduce((sum, divider) => {
      const length = Number(divider.length) || 0;
      const height = Number(divider.height) || 0;
      return sum + (length * height);
    }, 0);
    dividerArea = Math.round(dividerArea);
  }

  const totalArea = mainArea + dividerArea;
  const price = totalArea; // $1 per square inch

  // Debug log
  console.log('mainArea:', mainArea, 'dividerArea:', dividerArea, 'totalArea:', totalArea, 'price:', price);


  return {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    dimensions,
    layout,
    image2D,
    image3D,
    createdAt: createdAt || new Date().toISOString(),
    price,
    quantity: 1,
    wood_type: layout?.selectedWoodType || 'unknown',
  };
} 