import React from 'react';
import { US_STATES, formatPhone, formatZip } from '../utils/addressUtils';

export default function AddressForm({
  type = 'billing', // 'billing' or 'shipping'
  address = {},
  onChange,
  errors = {},
  disabled = false
}) {
  const prefix = type === 'billing' ? 'billing' : 'shipping';
  const label = type === 'billing' ? 'Billing' : 'Shipping';

  const handleChange = (field, value) => {
    if (onChange) {
      onChange({
        ...address,
        [field]: value
      });
    }
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 10) {
      handleChange(`${prefix}_phone`, value);
    }
  };

  const handleZipChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 9) {
      handleChange(`${prefix}_zip`, value);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">{label} Address</h3>
      
      {/* Street Address */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Street Address <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={address[`${prefix}_street`] || ''}
          onChange={(e) => handleChange(`${prefix}_street`, e.target.value)}
          className={`w-full px-3 py-2 border rounded-md ${errors[`${prefix}_street`] ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
          placeholder="123 Main St"
          disabled={disabled}
        />
        {errors[`${prefix}_street`] && (
          <p className="mt-1 text-sm text-red-600">{errors[`${prefix}_street`]}</p>
        )}
      </div>

      {/* City and State */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            City <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={address[`${prefix}_city`] || ''}
            onChange={(e) => handleChange(`${prefix}_city`, e.target.value)}
            className={`w-full px-3 py-2 border rounded-md ${errors[`${prefix}_city`] ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder="City"
            disabled={disabled}
          />
          {errors[`${prefix}_city`] && (
            <p className="mt-1 text-sm text-red-600">{errors[`${prefix}_city`]}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            State <span className="text-red-500">*</span>
          </label>
          <select
            value={address[`${prefix}_state`] || ''}
            onChange={(e) => handleChange(`${prefix}_state`, e.target.value)}
            className={`w-full px-3 py-2 border rounded-md ${errors[`${prefix}_state`] ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            disabled={disabled}
          >
            <option value="">Select State</option>
            {US_STATES.map(state => (
              <option key={state.value} value={state.value}>
                {state.label}
              </option>
            ))}
          </select>
          {errors[`${prefix}_state`] && (
            <p className="mt-1 text-sm text-red-600">{errors[`${prefix}_state`]}</p>
          )}
        </div>
      </div>

      {/* ZIP and Country */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ZIP Code <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formatZip(address[`${prefix}_zip`] || '')}
            onChange={handleZipChange}
            className={`w-full px-3 py-2 border rounded-md ${errors[`${prefix}_zip`] ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder="12345"
            maxLength={10}
            disabled={disabled}
          />
          {errors[`${prefix}_zip`] && (
            <p className="mt-1 text-sm text-red-600">{errors[`${prefix}_zip`]}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Country <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={address[`${prefix}_country`] || 'US'}
            onChange={(e) => handleChange(`${prefix}_country`, e.target.value)}
            className={`w-full px-3 py-2 border rounded-md ${errors[`${prefix}_country`] ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder="US"
            disabled={disabled}
          />
          {errors[`${prefix}_country`] && (
            <p className="mt-1 text-sm text-red-600">{errors[`${prefix}_country`]}</p>
          )}
        </div>
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phone Number <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          value={formatPhone(address[`${prefix}_phone`] || '')}
          onChange={handlePhoneChange}
          className={`w-full px-3 py-2 border rounded-md ${errors[`${prefix}_phone`] ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
          placeholder="(123) 456-7890"
          maxLength={14}
          disabled={disabled}
        />
        {errors[`${prefix}_phone`] && (
          <p className="mt-1 text-sm text-red-600">{errors[`${prefix}_phone`]}</p>
        )}
      </div>
    </div>
  );
}
