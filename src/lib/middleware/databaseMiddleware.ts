import { NextRequest, NextResponse } from 'next/server';
import { checkDatabaseHealth } from '@/lib/database';

// Database health check middleware
export async function withDatabaseCheck<T>(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse<T>>,
  fallbackResponse?: () => NextResponse<T>
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse<T>> => {
    try {
      // Check database health before processing request
      const health = await checkDatabaseHealth();
      
      if (!health.healthy) {
        console.error('Database health check failed:', health.message);
        
        // Return fallback response if provided
        if (fallbackResponse) {
          return fallbackResponse();
        }
        
        // Default error response
        return NextResponse.json({
          success: false,
          error: 'Database temporarily unavailable',
          message: 'Please try again in a few moments',
          code: 'DATABASE_UNAVAILABLE'
        }, { status: 503 }) as NextResponse<T>;
      }
      
      // Database is healthy, proceed with the request
      return await handler(request, ...args);
      
    } catch (error) {
      console.error('Database middleware error:', error);
      
      // Return fallback response if provided
      if (fallbackResponse) {
        return fallbackResponse();
      }
      
      // Default error response
      return NextResponse.json({
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred',
        code: 'INTERNAL_ERROR'
      }, { status: 500 }) as NextResponse<T>;
    }
  };
}

// Graceful degradation helper for read-only operations
export function createFallbackResponse<T>(data: T, message: string = 'Using cached data due to database unavailability'): NextResponse<T> {
  return NextResponse.json({
    success: true,
    data,
    warning: message,
    fallback: true
  } as any, { status: 200 });
}

// Connection retry wrapper for database operations
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
      console.warn(`Operation failed (attempt ${attempt}/${maxRetries}), retrying in ${Math.round(delay)}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

// Database operation wrapper with error handling
export async function safeDbOperation<T>(
  operation: () => Promise<T>,
  fallbackValue?: T,
  operationName: string = 'Database operation'
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const result = await withRetry(operation);
    return { success: true, data: result };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`${operationName} failed:`, errorMessage);
    
    if (fallbackValue !== undefined) {
      console.warn(`Using fallback value for ${operationName}`);
      return { success: true, data: fallbackValue };
    }
    
    return { success: false, error: errorMessage };
  }
}

// Circuit breaker pattern for database operations
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  constructor(
    private failureThreshold = 5,
    private recoveryTimeout = 30000 // 30 seconds
  ) {}
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN - database operations temporarily disabled');
      }
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }
  
  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
      console.warn('Circuit breaker opened - too many database failures');
    }
  }
  
  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime
    };
  }
}

// Global circuit breaker instance
export const databaseCircuitBreaker = new CircuitBreaker();

// Health check endpoint helper
export function createHealthCheckResponse() {
  return async () => {
    try {
      const health = await checkDatabaseHealth();
      const circuitState = databaseCircuitBreaker.getState();
      
      return NextResponse.json({
        success: true,
        database: {
          healthy: health.healthy,
          message: health.message,
          circuitBreaker: circuitState
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return NextResponse.json({
        success: false,
        database: {
          healthy: false,
          message: error instanceof Error ? error.message : 'Unknown error',
          circuitBreaker: databaseCircuitBreaker.getState()
        },
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }
  };
}
