const { check, validationResult } = require('express-validator');
const { body } = require('express-validator');

// Common validation rules
const commonValidationRules = [
  check('firstName')
    .trim()
    .notEmpty().withMessage('First name is required')
    .isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),
  
  check('lastName')
    .trim()
    .notEmpty().withMessage('Last name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters'),
  
  check('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^(\+251|0)?[79]\d{8}$/).withMessage('Please enter a valid Ethiopian phone number'),
  
  check('gender')
    .optional()
    .isIn(['male', 'female', 'other']).withMessage('Invalid gender value'),
  
  check('bio')
    .optional()
    .isLength({ max: 500 }).withMessage('Bio cannot exceed 500 characters'),
  
  check('dateOfBirth')
    .optional()
    .isISO8601().withMessage('Invalid date format. Use YYYY-MM-DD')
    .custom((value) => {
      const birthDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 18) {
        throw new Error('You must be at least 18 years old');
      }
      return true;
    })
];

// Address validation rules
const addressValidationRules = [
  check('region')
    .optional()
    .isIn([
      'Addis Ababa', 'Amhara', 'Oromia', 'Tigray', 'SNNP', 'Somali', 
      'Afar', 'Dire Dawa', 'Harari', 'Benishangul-Gumuz', 'Gambela', 'Sidama'
    ]).withMessage('Invalid region'),
  
  check('subCity')
    .optional()
    .isIn([
      'Bole', 'Gulele', 'Yeka', 'Addis Ketema', 'Akaki Kaliti', 
      'Arada', 'Kirkos', 'Kolfe Keranio', 'Lideta', 'Nifas Silk-Lafto'
    ]).withMessage('Invalid sub-city'),
  
  check('specificLocation')
    .optional()
    .isLength({ max: 200 }).withMessage('Location cannot exceed 200 characters')
];

// Document validation rules
const documentValidationRules = [
  check('documentType')
    .notEmpty().withMessage('Document type is required')
    .isIn(['nationalId', 'passport', 'drivingLicense', 'other']).withMessage('Invalid document type'),
  
  check('documentNumber')
    .notEmpty().withMessage('Document number is required')
    .isString().withMessage('Document number must be a string'),
  
  check('expiryDate')
    .optional()
    .isISO8601().withMessage('Invalid expiry date format. Use YYYY-MM-DD')
];

// Validate request
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  
  const extractedErrors = [];
  errors.array().map(err => extractedErrors.push({ [err.param]: err.msg }));
  
  return res.status(422).json({
    success: false,
    errors: extractedErrors
  });
};

module.exports = {
  commonValidationRules,
  addressValidationRules,
  documentValidationRules,
  validate
};
