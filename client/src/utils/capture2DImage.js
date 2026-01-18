export function capture2DImage(stageRef) {
  if (!stageRef || !stageRef.current) throw new Error('No Konva stageRef provided for 2D capture');
  
  const stage = stageRef.current;
  
  // Get current dimensions
  const currentWidth = stage.width();
  const currentHeight = stage.height();
  
  // Use 3x pixel ratio for much sharper text rendering
  const pixelRatio = 3;
  const exportWidth = currentWidth * pixelRatio;
  const exportHeight = currentHeight * pixelRatio;
  
  // Capture at higher resolution for crisp text
  // The pixelRatio option in toDataURL multiplies the canvas size for export
  const dataURL = stage.toDataURL({ 
    pixelRatio: pixelRatio,
    mimeType: 'image/png',
    quality: 1.0,
    // Ensure we're not losing quality in compression
    x: 0,
    y: 0,
    width: currentWidth,
    height: currentHeight
  });
  
  return dataURL;
} 