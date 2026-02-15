/**
 * Retry a function with exponential backoff
 *
 * @param fn - Async function to retry
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param baseDelay - Base delay in ms, will be multiplied exponentially (default: 1000ms)
 * @returns Result of the function
 * @throws Last error if all retries fail
 *
 * @example
 * const result = await retry(
 *   async () => axios.get('https://api.example.com'),
 *   3,
 *   1000
 * );
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Attempt to execute the function
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // If this was the last attempt, break and throw
      if (attempt === maxRetries) {
        break;
      }

      // Calculate exponential backoff delay: baseDelay * 2^attempt
      const delay = baseDelay * Math.pow(2, attempt);

      console.log(
        `⚠️  Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms delay`,
        `Error: ${lastError.message}`
      );

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // All retries failed, throw the last error
  console.error(`❌ All ${maxRetries} retry attempts failed`);
  throw lastError!;
}

/**
 * Retry a function with custom retry logic
 *
 * @param fn - Async function to retry
 * @param options - Retry options
 * @returns Result of the function
 *
 * @example
 * const result = await retryWithOptions(
 *   async () => fetchData(),
 *   {
 *     maxRetries: 5,
 *     baseDelay: 500,
 *     shouldRetry: (error) => error.status === 429, // Only retry on rate limit
 *     onRetry: (attempt) => console.log(`Retrying... attempt ${attempt}`)
 *   }
 * );
 */
export async function retryWithOptions<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    shouldRetry?: (error: Error) => boolean;
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    shouldRetry = () => true,
    onRetry
  } = options;

  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Check if we should retry this error
      if (!shouldRetry(lastError)) {
        console.log(`❌ Error not retryable: ${lastError.message}`);
        throw lastError;
      }

      // If this was the last attempt, break and throw
      if (attempt === maxRetries) {
        break;
      }

      // Calculate delay and notify
      const delay = baseDelay * Math.pow(2, attempt);
      if (onRetry) {
        onRetry(attempt + 1, lastError);
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}
