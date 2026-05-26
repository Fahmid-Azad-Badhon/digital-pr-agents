/**
 * Browser Tools Retry Utility
 * Retry logic with exponential backoff
 */

const logger = require('./logger');

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {Object} options - Retry options
 * @returns {Promise<any>} - Result of the function
 */
async function retry(fn, options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    retryCondition = () => true,
    onRetry = () => {},
    name = 'operation'
  } = options;

  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Check if we should retry
      if (!retryCondition(error)) {
        throw error;
      }
      
      // Check if we have retries left
      if (attempt >= maxRetries) {
        break;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        initialDelay * Math.pow(backoffMultiplier, attempt),
        maxDelay
      );
      
      // Call retry callback
      const retryInfo = {
        attempt: attempt + 1,
        maxRetries,
        delay,
        error: error.message
      };
      
      await onRetry(retryInfo);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Create a retryable version of a function
 * @param {Function} fn - Function to make retryable
 * @param {Object} options - Retry options
 * @returns {Function} - Retryable function
 */
function retryable(fn, options = {}) {
  return async function(...args) {
    return retry(
      () => fn.apply(this, args),
      {
        ...options,
        name: options.name || fn.name || 'unnamed'
      }
    );
  };
}

/**
 * Retry with circuit breaker pattern
 */
class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.successThreshold = options.successThreshold || 2;
    this.timeout = options.timeout || 60000;
    
    this.state = 'closed'; // closed, open, half-open
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = null;
    this.name = options.name || 'circuit';
    this.logger = options.logger || new Logger('CircuitBreaker');
  }

  async execute(fn) {
    if (this.state === 'open') {
      // Check if timeout has passed
      if (Date.now() - this.lastFailureTime >= this.timeout) {
        this.state = 'half-open';
        this.logger.info(`[${this.name}] Circuit half-open, allowing request`);
      } else {
        throw new Error(`Circuit ${this.name} is open`);
      }
    }

    try {
      const result = await fn();
      
      if (this.state === 'half-open') {
        this.successes++;
        if (this.successes >= this.successThreshold) {
          this.state = 'closed';
          this.failures = 0;
          this.successes = 0;
          this.logger.info(`[${this.name}] Circuit closed`);
        }
      }
      
      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();
      
      this.logger.warn(`[${this.name}] Circuit failure (${this.failures}/${this.failureThreshold})`);
      
      if (this.state === 'half-open' || this.failures >= this.failureThreshold) {
        this.state = 'open';
        this.logger.error(`[${this.name}] Circuit opened`);
      }
      
      throw error;
    }
  }

  reset() {
    this.state = 'closed';
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = null;
  }

  getState() {
    return this.state;
  }
}

/**
 * Timeout wrapper
 * @param {Function} fn - Function to timeout
 * @param {number} ms - Timeout in milliseconds
 * @param {string} message - Error message
 * @returns {Promise<any>}
 */
async function withTimeout(fn, ms, message = 'Operation timed out') {
  return Promise.race([
    fn(),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error(message)), ms)
    )
  ]);
}

/**
 * Create a timeoutable version of a function
 * @param {Function} fn - Function to make timeoutable
 * @param {number} ms - Default timeout
 * @returns {Function} - Timeoutable function
 */
function timeoutable(fn, ms) {
  return function(...args) {
    const timeout = args[args.length - 1];
    const actualTimeout = typeof timeout === 'number' ? timeout : ms;
    const fnArgs = typeof timeout === 'number' ? args.slice(0, -1) : args;
    
    return withTimeout(
      () => fn.apply(this, fnArgs),
      actualTimeout,
      `Timeout after ${actualTimeout}ms`
    );
  };
}

module.exports = {
  retry,
  retryable,
  CircuitBreaker,
  withTimeout,
  timeoutable
};