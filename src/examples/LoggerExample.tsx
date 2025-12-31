/**
 * Logger Usage Examples
 *
 * This file demonstrates various ways to use the enhanced logger utility.
 * These examples can be copied into your components.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { logger, LogLevel } from '@/utils/logger';

export function LoggerExample() {
  const [logLevel, setLogLevel] = useState<LogLevel>(logger.getLevel());

  // Example 1: Basic Logging
  const handleBasicLogging = () => {
    logger.debug('This is a debug message - for detailed debugging');
    logger.info('This is an info message - for general information');
    logger.warn('This is a warning message - for potential issues');
    logger.error('This is an error message - for actual errors');
  };

  // Example 2: Logging with Context
  const handleContextLogging = () => {
    logger.info('User performed action', {
      action: 'click',
      buttonId: 'submit',
      timestamp: Date.now(),
      userId: '12345',
    });
  };

  // Example 3: Error Logging
  const handleErrorLogging = () => {
    try {
      throw new Error('Example error for demonstration');
    } catch (_error) {
      logger._error('An _error occurred', _error, {
        operation: 'handleErrorLogging',
        component: 'LoggerExample',
      });
    }
  };

  // Example 4: Performance Timing
  const handlePerformanceTiming = () => {
    logger.time('expensive-operation');

    // Simulate expensive operation
    let sum = 0;
    for (let i = 0; i < 1000000; i++) {
      sum += i;
    }

    logger.timeEnd('expensive-operation');
    logger.info('Operation completed', { result: sum });
  };

  // Example 5: Function Tracing
  const handleFunctionTracing = () => {
    const result = logger.trace(() => {
      // Simulate some work
      let sum = 0;
      for (let i = 0; i < 500000; i++) {
        sum += i;
      }
      return sum;
    }, 'calculateSum');

    logger.info('Traced function result', { result });
  };

  // Example 6: Async Function Tracing
  const handleAsyncTracing = async () => {
    const result = await logger.traceAsync(async () => {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { data: 'fetched data', timestamp: Date.now() };
    }, 'fetchData');

    logger.info('Async traced result', result);
  };

  // Example 7: Grouped Logs
  const handleGroupedLogs = () => {
    logger.group('User Registration Process');
    logger.info('Step 1: Validating email');
    logger.info('Step 2: Checking password strength');
    logger.info('Step 3: Creating user account');
    logger.info('Step 4: Sending welcome email');
    logger.groupEnd();
  };

  // Example 8: Table Logging
  const handleTableLogging = () => {
    const users = [
      { id: 1, name: 'Alice', role: 'Admin', active: true },
      { id: 2, name: 'Bob', role: 'User', active: true },
      { id: 3, name: 'Charlie', role: 'User', active: false },
      { id: 4, name: 'Diana', role: 'Moderator', active: true },
    ];

    logger.info('Displaying users table');
    logger.table(users);
  };

  // Example 9: Child Logger
  const handleChildLogger = () => {
    const authLogger = logger.createChild('Authentication');
    const apiLogger = logger.createChild('API');

    authLogger.info('User login attempt', { userId: '123' });
    authLogger.warn('Failed login attempt', { userId: '123', attempts: 3 });

    apiLogger.info('API request', { endpoint: '/api/users', method: 'GET' });
    apiLogger.error('API request failed', new Error('Network error'), {
      endpoint: '/api/users',
      statusCode: 500,
    });

    // Nested child logger
    const oauth2Logger = authLogger.createChild('OAuth2');
    oauth2Logger.info('OAuth2 token refreshed');
  };

  // Example 10: Assertions
  const handleAssertions = () => {
    const userId = null;
    const userName = 'Alice';

    logger.assert(userId !== null, 'User ID should not be null'); // This will log an error
    logger.assert(userName !== null, 'User name should not be null'); // This won't log anything
  };

  // Change log level
  const handleSetLogLevel = (level: LogLevel) => {
    logger.setLevel(level);
    setLogLevel(level);
    logger.info(`Log level changed to ${LogLevel[level]}`);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Logger Utility Examples</CardTitle>
          <CardDescription>
            Interactive examples demonstrating the logger utility features. Open the browser console
            to see the output.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Log Level Control */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Current Log Level: {LogLevel[logLevel]}</h3>
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={() => handleSetLogLevel(LogLevel.DEBUG)}
                variant={logLevel === LogLevel.DEBUG ? 'default' : 'outline'}
                size="sm"
              >
                DEBUG
              </Button>
              <Button
                onClick={() => handleSetLogLevel(LogLevel.INFO)}
                variant={logLevel === LogLevel.INFO ? 'default' : 'outline'}
                size="sm"
              >
                INFO
              </Button>
              <Button
                onClick={() => handleSetLogLevel(LogLevel.WARN)}
                variant={logLevel === LogLevel.WARN ? 'default' : 'outline'}
                size="sm"
              >
                WARN
              </Button>
              <Button
                onClick={() => handleSetLogLevel(LogLevel.ERROR)}
                variant={logLevel === LogLevel.ERROR ? 'default' : 'outline'}
                size="sm"
              >
                ERROR
              </Button>
              <Button
                onClick={() => handleSetLogLevel(LogLevel.NONE)}
                variant={logLevel === LogLevel.NONE ? 'default' : 'outline'}
                size="sm"
              >
                NONE
              </Button>
            </div>
          </div>

          {/* Example Buttons */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Examples (check console)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Button onClick={handleBasicLogging} variant="outline">
                1. Basic Logging
              </Button>
              <Button onClick={handleContextLogging} variant="outline">
                2. Logging with Context
              </Button>
              <Button onClick={handleErrorLogging} variant="outline">
                3. Error Logging
              </Button>
              <Button onClick={handlePerformanceTiming} variant="outline">
                4. Performance Timing
              </Button>
              <Button onClick={handleFunctionTracing} variant="outline">
                5. Function Tracing
              </Button>
              <Button onClick={handleAsyncTracing} variant="outline">
                6. Async Tracing
              </Button>
              <Button onClick={handleGroupedLogs} variant="outline">
                7. Grouped Logs
              </Button>
              <Button onClick={handleTableLogging} variant="outline">
                8. Table Logging
              </Button>
              <Button onClick={handleChildLogger} variant="outline">
                9. Child Logger
              </Button>
              <Button onClick={handleAssertions} variant="outline">
                10. Assertions
              </Button>
            </div>
          </div>

          {/* Documentation */}
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Quick Reference</h3>
            <pre className="text-xs overflow-auto">
              {`import { logger, LogLevel } from '@/utils/logger';

// Basic usage
logger.debug('Debug message');
logger.info('Info message');
logger.warn('Warning message');
logger.error('Error message');

// With context
logger.info('User action', { userId: '123', action: 'click' });

// Error with stack trace
logger.error('Failed to save', error, { userId: '123' });

// Performance timing
logger.time('operation');
doSomething();
logger.timeEnd('operation');

// Function tracing
const result = logger.trace(() => expensiveOperation(), 'myOperation');

// Child logger
const apiLogger = logger.createChild('API');
apiLogger.info('Request sent');

// Change log level
logger.setLevel(LogLevel.ERROR);`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
