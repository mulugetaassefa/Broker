/**
 * Validates Ethiopian phone numbers in the following formats:
 * - +2519XXXXXXXX (Ethio Telecom)
 * - 09XXXXXXXX (Ethio Telecom)
 * - 2517XXXXXXXX (Safaricom)
 * - 07XXXXXXXX (Safaricom)
 * 
 * @param {string} phoneNumber - The phone number to validate
 * @returns {boolean} - True if the phone number is valid, false otherwise
 */
export const validateEthiopianPhoneNumber = (phoneNumber) => {
  // Remove any whitespace and special characters except + and numbers
  const cleanedNumber = phoneNumber.replace(/[^\d+]/g, '');
  
  // Regular expression to match Ethiopian phone numbers
  // Supports:
  // - +2519XXXXXXXX (Ethio Telecom)
  // - 09XXXXXXXX (Ethio Telecom)
  // - +2517XXXXXXXX (Safaricom)
  // - 07XXXXXXXX (Safaricom)
  // - 2517XXXXXXXX (Safaricom)
  const ethioPhoneRegex = /^(\+?251|0)?([79]\d{8})$/;
  
  // Check if the number starts with +2517 (Safaricom)
  if (cleanedNumber.startsWith('+2517')) {
    return cleanedNumber.length === 13; // +2517XXXXXXXX (13 digits)
  }
  
  // Check if the number starts with 2517 (Safaricom without +)
  if (cleanedNumber.startsWith('2517')) {
    return cleanedNumber.length === 12; // 2517XXXXXXXX (12 digits)
  }
  
  // Check if the number starts with 07 (Safaricom)
  if (cleanedNumber.startsWith('07')) {
    return cleanedNumber.length === 10; // 07XXXXXXXX (10 digits)
  }
  
  // For Ethio Telecom numbers (+2519, 09)
  if (cleanedNumber.startsWith('+2519')) {
    return cleanedNumber.length === 13; // +2519XXXXXXXX (13 digits)
  }
  
  if (cleanedNumber.startsWith('09')) {
    return cleanedNumber.length === 10; // 09XXXXXXXX (10 digits)
  }
  
  return ethioPhoneRegex.test(cleanedNumber);
};

/**
 * Formats a valid Ethiopian phone number to +251XXXXXXXXX format
 * @param {string} phoneNumber - The phone number to format
 * @returns {string} - Formatted phone number or empty string if invalid
 */
export const formatEthiopianPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return '';
  
  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, '');
  
  // Handle Safaricom numbers (7XXXXXXXX)
  if (digits.startsWith('7') && digits.length === 9) {
    return `+251${digits}`;
  }
  
  // Handle Safaricom numbers (07XXXXXXXX)
  if (digits.startsWith('07') && digits.length === 10) {
    return `+251${digits.substring(1)}`;
  }
  
  // Handle Safaricom numbers (2517XXXXXXXX)
  if (digits.startsWith('2517') && digits.length === 12) {
    return `+${digits}`;
  }
  
  // Handle Ethio Telecom numbers (9XXXXXXXX)
  if (digits.startsWith('9') && digits.length === 9) {
    return `+251${digits}`;
  }
  
  // Handle Ethio Telecom numbers (09XXXXXXXX)
  if (digits.startsWith('09') && digits.length === 10) {
    return `+251${digits.substring(1)}`;
  }
  
  // Handle numbers already in international format
  if ((digits.startsWith('2517') || digits.startsWith('2519')) && digits.length === 12) {
    return `+${digits}`;
  }
  
  // Handle numbers already in full international format with +
  if ((phoneNumber.startsWith('+2517') || phoneNumber.startsWith('+2519')) && phoneNumber.length === 13) {
    return phoneNumber;
  }
  
  // If we get here and the number is valid, try to format it
  if (validateEthiopianPhoneNumber(phoneNumber)) {
    // This handles any edge cases not covered above
    if (digits.length === 9) return `+251${digits}`;
    if (digits.length === 10 && digits.startsWith('0')) return `+251${digits.substring(1)}`;
    if (digits.length === 12 && digits.startsWith('251')) return `+${digits}`;
  }
};

// Example usage:
// console.log(validateEthiopianPhoneNumber('+251912345678')); // true
// console.log(validateEthiopianPhoneNumber('0912345678'));    // true
// console.log(validateEthiopianPhoneNumber('251912345678'));  // true
// console.log(validateEthiopianPhoneNumber('0712345678'));    // true
// console.log(validateEthiopianPhoneNumber('+1234567890'));   // false
