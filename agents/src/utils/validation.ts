/**
 * Validate Ethereum address format
 *
 * @param address - Address string to validate
 * @returns true if valid Ethereum address, false otherwise
 *
 * @example
 * isValidEthereumAddress('0x1234567890123456789012345678901234567890') // true
 * isValidEthereumAddress('0x123') // false
 * isValidEthereumAddress('1234567890123456789012345678901234567890') // false (missing 0x)
 */
export function isValidEthereumAddress(address: string): boolean {
  // Check if address matches 0x followed by 40 hexadecimal characters
  const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/;
  return ethereumAddressRegex.test(address);
}

/**
 * Generate UUID v4
 *
 * @returns UUID string in format xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 *
 * @example
 * generateUUID() // '550e8400-e29b-41d4-a716-446655440000'
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Validate wallet address and throw error if invalid
 *
 * @param address - Address to validate
 * @throws Error if address is invalid
 *
 * @example
 * validateWalletAddress('0x1234567890123456789012345678901234567890') // No error
 * validateWalletAddress('invalid') // Throws Error
 */
export function validateWalletAddress(address: string): void {
  if (!address) {
    throw new Error('Wallet address is required');
  }

  if (!isValidEthereumAddress(address)) {
    throw new Error(`Invalid Ethereum address format: ${address}`);
  }
}

/**
 * Validate that a number is within a range
 *
 * @param value - Number to validate
 * @param min - Minimum allowed value (inclusive)
 * @param max - Maximum allowed value (inclusive)
 * @param fieldName - Name of the field for error message
 * @throws Error if value is out of range
 */
export function validateRange(
  value: number,
  min: number,
  max: number,
  fieldName: string = 'Value'
): void {
  if (value < min || value > max) {
    throw new Error(`${fieldName} must be between ${min} and ${max}, got ${value}`);
  }
}

/**
 * Validate that a percentage is between 0 and 100
 *
 * @param value - Percentage value to validate
 * @param fieldName - Name of the field for error message
 * @throws Error if value is not a valid percentage
 */
export function validatePercentage(value: number, fieldName: string = 'Percentage'): void {
  validateRange(value, 0, 100, fieldName);
}

/**
 * Sanitize a string to prevent injection attacks
 *
 * @param input - String to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(input: string): string {
  // Remove any characters that could be used for injection
  return input.replace(/[<>{}()]/g, '');
}

/**
 * Parse and validate a number from string
 *
 * @param value - String to parse
 * @param fieldName - Name of the field for error message
 * @returns Parsed number
 * @throws Error if value is not a valid number
 */
export function parseNumber(value: string | number, fieldName: string = 'Value'): number {
  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num) || !isFinite(num)) {
    throw new Error(`${fieldName} must be a valid number, got ${value}`);
  }

  return num;
}

/**
 * Validate job ID format
 *
 * @param jobId - Job ID to validate
 * @throws Error if job ID is invalid
 */
export function validateJobId(jobId: string): void {
  if (!jobId) {
    throw new Error('Job ID is required');
  }

  // UUID format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(jobId)) {
    throw new Error(`Invalid job ID format: ${jobId}`);
  }
}
