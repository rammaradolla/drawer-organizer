import React from 'react';

const MAX_DIMENSION = 100; // Maximum dimension in inches

const DrawerSetup = ({ dimensions, onDimensionsSet }) => {
  const validateDimension = (value, name) => {
    if (!value) return `${name} is required`;
    const num = parseFloat(value);
    if (isNaN(num)) return `${name} must be a number`;
    if (num <= 0) return `${name} must be greater than 0`;
    if (num > MAX_DIMENSION) return `${name} cannot exceed ${MAX_DIMENSION} inches`;
    if (Math.round(num * 4) !== num * 4) return `${name} must be in increments of 0.25 inches`;
    return null;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const error = validateDimension(value, name);
    if (!error) {
      onDimensionsSet({
        ...dimensions,
        [name]: parseFloat(value)
      });
    }
  };

  return (
    <div className="flex flex-row items-center gap-4 w-full">
      <span className="font-semibold text-slate-700 mr-2">Dimentions (inches):</span>
      <div className="flex flex-row items-center gap-1">
        <label className="font-semibold text-slate-700 mr-1">Width</label>
        <input
          type="number"
          value={dimensions.width}
          min={1}
          onChange={handleChange}
          name="width"
          className="w-16 px-2 py-1 border rounded"
        />
      </div>
      <div className="flex flex-row items-center gap-1">
        <label className="font-semibold text-slate-700 mr-1">Depth</label>
        <input
          type="number"
          value={dimensions.depth}
          min={1}
          onChange={handleChange}
          name="depth"
          className="w-16 px-2 py-1 border rounded"
        />
      </div>
      <div className="flex flex-row items-center gap-1">
        <label className="font-semibold text-slate-700 mr-1">Height</label>
        <input
          type="number"
          value={dimensions.height}
          min={1}
          onChange={handleChange}
          name="height"
          className="w-16 px-2 py-1 border rounded"
        />
      </div>
    </div>
  );
};

export default DrawerSetup; 