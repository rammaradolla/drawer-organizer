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
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Drawer Dimensions</h2>
      

      <div className="space-y-4">
        <div>
          <label htmlFor="width" className="label">
            Width (inches)
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              id="width"
              name="width"
              value={dimensions.width}
              onChange={handleChange}
              className="input flex-1"
              min="0.25"
              max={MAX_DIMENSION}
              step="0.25"
            />
            <div className="text-sm text-gray-500">in</div>
          </div>
        </div>
        
        <div>
          <label htmlFor="depth" className="label">
            Depth (inches)
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              id="depth"
              name="depth"
              value={dimensions.depth}
              onChange={handleChange}
              className="input flex-1"
              min="0.25"
              max={MAX_DIMENSION}
              step="0.25"
            />
            <div className="text-sm text-gray-500">in</div>
          </div>
        </div>
        
        <div>
          <label htmlFor="height" className="label">
            Height (inches)
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              id="height"
              name="height"
              value={dimensions.height}
              onChange={handleChange}
              className="input flex-1"
              min="0.25"
              max={MAX_DIMENSION}
              step="0.25"
            />
            <div className="text-sm text-gray-500">in</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DrawerSetup; 