// Simple test component without React Three Fiber
import React from 'react';

export default function SimpleTest({ selectedWoodType }) {
  const getWoodColor = (woodType) => {
    const colors = {
      birch: '#f5f1e8',
      maple: '#f2e6d0', 
      ash: '#e8dcc6',
      oak: '#d4a574',
      cherry: '#c65d00',
      beech: '#e0c097',
      walnut: '#8b4513',
      mahogany: '#c04000',
      ebony: '#3c2415'
    };
    return colors[woodType] || '#deb887';
  };

  return (
    <div className="w-full h-full min-h-[300px] max-h-[60vh] flex items-center justify-center rounded-lg border-2 border-slate-300" 
         style={{ backgroundColor: getWoodColor(selectedWoodType) }}>
      <div className="text-center text-slate-800">
        <h3 className="text-lg font-semibold">3D Preview</h3>
        <p className="text-sm">Selected: {selectedWoodType}</p>
        <p className="text-xs mt-2">Color changes based on wood type</p>
      </div>
    </div>
  );
}