export function capture2DImage(stageRef) {
  if (!stageRef || !stageRef.current) throw new Error('No Konva stageRef provided for 2D capture');
  return stageRef.current.toDataURL();
} 