export function capture3DImage(gl) {
  if (!gl || !gl.domElement) throw new Error('No WebGL renderer provided for 3D capture');
  return gl.domElement.toDataURL('image/png');
} 