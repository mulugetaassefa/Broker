import React, { useState } from 'react';
import { validateEthiopianPhoneNumber, formatEthiopianPhoneNumber } from '../../utils/validators';

const PhoneNumberInput = ({ value, onChange, label = 'Phone Number', required = true }) => {
  const [error, setError] = useState('');
  const [isTouched, setIsTouched] = useState(false);

  const handleChange = (e) => {
    const input = e.target.value;
    onChange(input);
    
    if (!isTouched) return;
    
    if (input && !validateEthiopianPhoneNumber(input)) {
      setError('Please enter a valid Ethiopian phone number (e.g., +2519XXXXXXXX, 09XXXXXXXX, 2517XXXXXXXX, or 07XXXXXXXX)');
    } else {
      setError('');
    }
  };

  const handleBlur = () => {
    setIsTouched(true);
    if (value && !validateEthiopianPhoneNumber(value)) {
      setError('Please enter a valid Ethiopian phone number');
    } else {
      setError('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value && validateEthiopianPhoneNumber(value)) {
      const formattedNumber = formatEthiopianPhoneNumber(value);
      console.log('Formatted phone number:', formattedNumber);
      // Proceed with form submission
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <div className="mt-1">
        <input
          type="tel"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="e.g., +251912345678 or 0912345678"
          className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            error ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {isTouched && error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
        {!error && value && validateEthiopianPhoneNumber(value) && (
          <p className="mt-1 text-sm text-green-600">
            Valid {value.startsWith('9') || value.startsWith('09') || value.includes('912') ? 'Ethio Telecom' : 'Safaricom'} number
          </p>
        )}
      </div>
    </div>
  );
};

export default PhoneNumberInput;
