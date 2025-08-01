import { NextRequest, NextResponse } from 'next/server';
import { checkDatabaseHealth, connectToDatabase } from '@/lib/database';
import { databaseCircuitBreaker } from '@/lib/middleware/databaseMiddleware';

export async function GET(request: NextRequest) {
  try {
    // Check database connection
    const connectionTest = await connectToDatabase(1, 500); // Quick test with 1 retry
    
    // Check database health
    const health = await checkDatabaseHealth();
    
    // Get circuit breaker state
    const circuitState = databaseCircuitBreaker.getState();
    
    // Determine overall health status
    const isHealthy = connectionTest && health.healthy && circuitState.state !== 'OPEN';
    
    const response = {
      success: true,
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      database: {
        connection: connectionTest,
        health: health.healthy,
        message: health.message,
        circuitBreaker: {
          state: circuitState.state,
          failures: circuitState.failures,
          lastFailureTime: circuitState.lastFailureTime ? new Date(circuitState.lastFailureTime).toISOString() : null
        }
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        databaseUrl: process.env.DATABASE_URL ? 'configured' : 'missing'
      }
    };
    
    return NextResponse.json(response, { 
      status: isHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      success: false,
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      database: {
        connection: false,
        health: false,
        message: 'Health check failed',
        circuitBreaker: databaseCircuitBreaker.getState()
      }
    }, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }
}
