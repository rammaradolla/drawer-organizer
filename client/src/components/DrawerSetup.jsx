import React, { useState, useEffect } from 'react';

const MAX_DIMENSION = 100; // Maximum dimension in inches

// Utility to parse and round to nearest 1/32
function parseAndRoundTo32(input) {
  input = input.trim();
  // Match 'inches fraction' (e.g., '27 11/16', '27 5/32')
  const match = input.match(/^(\d+)(?:\s+(\d+)[\/](\d+))?$/);
  if (match) {
    const inches = parseInt(match[1], 10);
    let value = inches;
    if (match[2] && match[3]) {
      const numerator = parseInt(match[2], 10);
      const denominator = parseInt(match[3], 10);
      if (denominator > 0) {
        value += numerator / denominator;
      }
    }
    // Round to nearest 1/32
    value = Math.round(value * 32) / 32;
    return value;
  }
  // Try to parse as decimal
  const asFloat = parseFloat(input);
  if (!isNaN(asFloat)) {
    return Math.round(asFloat * 32) / 32;
  }
  return null;
}

// Utility to format as 'inches n/32"', reducing the fraction to lowest terms
function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}
function formatInches32(value) {
  const inches = Math.floor(value);
  let fraction = Math.round((value - inches) * 32);
  if (fraction === 0) return `${inches}"`;
  // Reduce fraction
  const divisor = gcd(fraction, 32);
  const num = fraction / divisor;
  const denom = 32 / divisor;
  return `${inches} ${num}/${denom}\"`;
}

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

  // Add state for raw input and parsed value for each dimension
  const [widthInput, setWidthInput] = useState(dimensions?.width?.toString() || '');
  const [depthInput, setDepthInput] = useState(dimensions?.depth?.toString() || '');
  const [heightInput, setHeightInput] = useState(dimensions?.height?.toString() || '');
  const parsedWidth = parseAndRoundTo32(widthInput);
  const parsedDepth = parseAndRoundTo32(depthInput);
  const parsedHeight = parseAndRoundTo32(heightInput);

  useEffect(() => {
    if (
      parsedWidth !== null && parsedWidth > 0 &&
      parsedDepth !== null && parsedDepth > 0 &&
      parsedHeight !== null && parsedHeight > 0
    ) {
      onDimensionsSet({
        width: parsedWidth,
        depth: parsedDepth,
        height: parsedHeight
      });
    }
    // Only run when parsed values change
  }, [parsedWidth, parsedDepth, parsedHeight]);

  return (
    <div className="flex flex-row items-center gap-4 w-full">
      <span className="font-semibold text-slate-700 mr-2">Dimentions (inches):</span>
      <div className="flex flex-col items-start gap-1">
        <label className="font-semibold text-slate-700 mr-1">Width</label>
        <input
          type="text"
          value={widthInput}
          onChange={e => setWidthInput(e.target.value)}
          name="width"
          className="w-28 px-2 py-1 border rounded"
        />
        {parsedWidth !== null && <div className="mt-1 text-xs text-gray-500">Rounded: {formatInches32(parsedWidth)} ({parsedWidth.toFixed(3)}")</div>}
      </div>
      <div className="flex flex-col items-start gap-1">
        <label className="font-semibold text-slate-700 mr-1">Depth</label>
        <input
          type="text"
          value={depthInput}
          onChange={e => setDepthInput(e.target.value)}
          name="depth"
          className="w-28 px-2 py-1 border rounded"
        />
        {parsedDepth !== null && <div className="mt-1 text-xs text-gray-500">Rounded: {formatInches32(parsedDepth)} ({parsedDepth.toFixed(3)}")</div>}
      </div>
      <div className="flex flex-col items-start gap-1">
        <label className="font-semibold text-slate-700 mr-1">Height</label>
        <input
          type="text"
          value={heightInput}
          onChange={e => setHeightInput(e.target.value)}
          name="height"
          className="w-28 px-2 py-1 border rounded"
        />
        {parsedHeight !== null && <div className="mt-1 text-xs text-gray-500">Rounded: {formatInches32(parsedHeight)} ({parsedHeight.toFixed(3)}")</div>}
      </div>
    </div>
  );
};

export default DrawerSetup; 