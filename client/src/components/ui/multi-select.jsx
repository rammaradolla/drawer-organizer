import React from "react";

/**
 * Minimal MultiSelect component
 * Props:
 * - options: [{ label, value }]
 * - values: [value]
 * - onChange: (values) => void
 * - className: string (optional)
 */
export function MultiSelect({ options, values = [], onChange, className = "" }) {
  const toggleValue = (value) => {
    if (values.includes(value)) {
      onChange(values.filter((v) => v !== value));
    } else {
      onChange([...values, value]);
    }
  };

  // Calculate number of columns needed for 3 rows
  const numRows = 3;
  const numCols = Math.ceil(options.length / numRows);

  return (
    <div
      className={`grid grid-rows-3 gap-x-4 gap-y-2 items-center ${className}`}
      style={{ gridTemplateColumns: `repeat(${numCols}, minmax(0, 1fr))` }}
      tabIndex={0}
    >
      {options.map((opt) => (
        <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={values.includes(opt.value)}
            onChange={() => toggleValue(opt.value)}
            className="mr-1"
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
} 