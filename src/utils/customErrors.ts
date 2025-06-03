/**
 * Base application error class
 * All custom errors should extend this class
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public code: string;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR'
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = this.constructor.name;

    // Maintains proper stack trace for debugging
    Error.captureStackTrace(this, this.constructor);
  }
}

// ===== 4xx Client Errors =====

/**
 * 400 - Bad Request / Validation Error
 */
export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    const code = field
      ? `VALIDATION_ERROR_${field.toUpperCase()}`
      : 'VALIDATION_ERROR';
    super(message, 400, code);
  }
}

/**
 * 401 - Authentication Required
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

/**
 * 403 - Forbidden / Authorization Error
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

/**
 * 404 - Not Found
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

/**
 * 409 - Conflict (duplicate data, etc.)
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT_ERROR');
  }
}

/**
 * 422 - Unprocessable Entity
 */
export class UnprocessableEntityError extends AppError {
  constructor(message: string) {
    super(message, 422, 'UNPROCESSABLE_ENTITY');
  }
}

/**
 * 429 - Too Many Requests
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

// ===== 5xx Server Errors =====

/**
 * 500 - Database Error
 */
export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed') {
    super(message, 500, 'DATABASE_ERROR');
  }
}

/**
 * 503 - External Service Error
 */
export class ExternalServiceError extends AppError {
  constructor(service: string, message?: string) {
    super(
      message || `External service ${service} is unavailable`,
      503,
      'EXTERNAL_SERVICE_ERROR'
    );
  }
}

/**
 * 500 - Configuration Error
 */
export class ConfigurationError extends AppError {
  constructor(message: string = 'Configuration error') {
    super(message, 500, 'CONFIGURATION_ERROR');
  }
}

// ===== Food App Specific Errors =====

/**
 * Food-specific validation error
 */
export class FoodValidationError extends ValidationError {
  constructor(message: string, field?: string) {
    super(`Food validation failed: ${message}`, field);
    this.code = 'FOOD_VALIDATION_ERROR';
  }
}

/**
 * Food not found error
 */
export class FoodNotFoundError extends NotFoundError {
  constructor(foodId?: string) {
    const message = foodId
      ? `Food with ID ${foodId} not found`
      : 'Food not found';
    super(message);
    this.code = 'FOOD_NOT_FOUND';
  }
}

/**
 * Duplicate food error
 */
export class DuplicateFoodError extends ConflictError {
  constructor(foodName: string) {
    super(`Food with name "${foodName}" already exists`);
    this.code = 'DUPLICATE_FOOD';
  }
}
