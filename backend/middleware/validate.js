const { body, param, query, validationResult } = require('express-validator');

// Helper to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: errors.array().map(e => ({ field: e.path, message: e.msg }))
    });
  }
  next();
};

// Sanitize string input
const sanitizeString = (value) => {
  if (typeof value !== 'string') return value;
  return value.trim().replace(/[<>]/g, ''); // Basic XSS prevention
};

// Validation rules for common inputs
const validators = {
  // Auth validations
  register: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('full_name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
    body('hotel_name').trim().isLength({ min: 2, max: 100 }).withMessage('Hotel name must be 2-100 characters'),
    handleValidationErrors
  ],
  
  login: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 1 }).withMessage('Password required'),
    handleValidationErrors
  ],
  
  // Guest validations
  createGuest: [
    body('full_name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
    body('phone').optional().trim().matches(/^[\d\s\-+()]{10,20}$/).withMessage('Invalid phone number'),
    body('email').optional().isEmail().normalizeEmail().withMessage('Invalid email'),
    body('id_type').optional().isIn(['aadhaar', 'passport', 'driving_license', 'voter_id']).withMessage('Invalid ID type'),
    body('id_number').optional().trim().isLength({ min: 4, max: 50 }).withMessage('ID number must be 4-50 characters'),
    handleValidationErrors
  ],
  
  // Booking validations
  createBooking: [
    body('guest_id').isUUID().withMessage('Valid guest ID required'),
    body('room_id').isUUID().withMessage('Valid room ID required'),
    body('checkin_date').isISO8601().withMessage('Valid check-in date required'),
    body('checkout_date').isISO8601().withMessage('Valid check-out date required'),
    body('num_guests').isInt({ min: 1, max: 20 }).withMessage('Guests must be 1-20'),
    body('meal_plan').optional().isIn(['EP', 'CP', 'MAP', 'AP']).withMessage('Invalid meal plan'),
    body('room_rate').optional().isFloat({ min: 0 }).withMessage('Room rate must be positive'),
    body('source').optional().isIn(['walk-in', 'booking.com', 'mmt', 'airbnb', 'referral', 'direct']).withMessage('Invalid source'),
    handleValidationErrors
  ],
  
  // Room validations
  createRoom: [
    body('room_number').trim().isLength({ min: 1, max: 20 }).withMessage('Room number required'),
    body('floor').optional().isInt({ min: 0, max: 100 }).withMessage('Invalid floor'),
    handleValidationErrors
  ],
  
  // Inventory validations
  createInventory: [
    body('item_name').trim().isLength({ min: 2, max: 100 }).withMessage('Item name must be 2-100 characters'),
    body('quantity').isFloat({ min: 0.01 }).withMessage('Quantity must be positive'),
    body('rate').isFloat({ min: 0 }).withMessage('Rate must be positive'),
    body('amount_paid').optional().isFloat({ min: 0 }).withMessage('Amount paid must be positive'),
    handleValidationErrors
  ],
  
  // Staff validations
  createStaff: [
    body('full_name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
    body('phone').optional().trim().matches(/^[\d\s\-+()]{10,20}$/).withMessage('Invalid phone number'),
    body('role').optional().isIn(['front-desk', 'housekeeping', 'f&b', 'security', 'manager', 'maintenance']).withMessage('Invalid role'),
    body('salary').optional().isFloat({ min: 0 }).withMessage('Salary must be positive'),
    handleValidationErrors
  ],
  
  // UUID param validation
  uuidParam: (paramName) => [
    param(paramName).isUUID().withMessage(`Invalid ${paramName} format`),
    handleValidationErrors
  ],
  
  // Pagination validation
  pagination: [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
    handleValidationErrors
  ]
};

module.exports = validators;
