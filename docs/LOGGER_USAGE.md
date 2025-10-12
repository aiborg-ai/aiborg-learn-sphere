# Logger Utility Documentation

Comprehensive guide for using the enhanced logger utility in the aiborg Learn Sphere application.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Basic Usage](#basic-usage)
- [Log Levels](#log-levels)
- [Advanced Features](#advanced-features)
- [Configuration](#configuration)
- [Best Practices](#best-practices)
- [Migration Guide](#migration-guide)

## Overview

The logger utility provides a structured, production-safe logging system with multiple log levels,
context support, performance tracking, and more.

**Key Benefits:**

- ✅ Automatic environment detection (dev/prod)
- ✅ Structured logging with context
- ✅ Performance timing and tracing
- ✅ Type-safe with TypeScript
- ✅ Zero logs in production (configurable)
- ✅ Child loggers with prefixes
- ✅ Error stack trace capture

## Features

### Core Logging Methods

```typescript
import { logger } from '@/utils/logger';

// Basic logging
logger.debug('Debug information');
logger.info('Informational message');
logger.warn('Warning message');
logger.error('Error message');
logger.log('Generic message'); // Alias for info
```

### Context Support

Add structured data to your logs:

```typescript
logger.info('User logged in', {
  userId: '123',
  email: 'user@example.com',
  timestamp: Date.now(),
});

// Output:
// [2025-10-11T12:34:56.789Z] [INFO] User logged in
// {
//   "userId": "123",
//   "email": "user@example.com",
//   "timestamp": 1728652496789
// }
```

### Error Logging

Automatically captures error details:

```typescript
try {
  throw new Error('Something went wrong');
} catch (error) {
  logger.error('Failed to process request', error, {
    operation: 'fetchUserData',
    userId: '123',
  });
}

// Output:
// [2025-10-11T12:34:56.789Z] [ERROR] Failed to process request
// {
//   "operation": "fetchUserData",
//   "userId": "123",
//   "error": {
//     "name": "Error",
//     "message": "Something went wrong",
//     "stack": "Error: Something went wrong\n    at ..."
//   }
// }
```

## Log Levels

The logger supports five log levels:

| Level   | Value | When to Use                           | Production |
| ------- | ----- | ------------------------------------- | ---------- |
| `DEBUG` | 0     | Detailed debugging information        | ❌ Hidden  |
| `INFO`  | 1     | General informational messages        | ❌ Hidden  |
| `WARN`  | 2     | Warning messages for potential issues | ✅ Visible |
| `ERROR` | 3     | Error messages for failures           | ✅ Visible |
| `NONE`  | 4     | Disable all logging                   | -          |

**Default Levels:**

- Development: `DEBUG` (all logs visible)
- Production: `WARN` (only warnings and errors)

### Changing Log Level

```typescript
import { logger, LogLevel } from '@/utils/logger';

// Set log level programmatically
logger.setLevel(LogLevel.ERROR); // Only show errors

// Get current level
const currentLevel = logger.getLevel();
```

## Advanced Features

### Performance Timing

Track execution time of operations:

```typescript
// Manual timing
logger.time('data-fetch');
await fetchData();
logger.timeEnd('data-fetch');
// Output: [INFO] data-fetch: 123.45ms

// Automatic tracing (synchronous)
const result = logger.trace(() => {
  return expensiveOperation();
}, 'expensiveOperation');

// Automatic tracing (async)
const data = await logger.traceAsync(async () => {
  return await fetchData();
}, 'fetchData');
```

### Grouped Logs

Organize related log messages:

```typescript
logger.group('User Registration');
logger.info('Validating input');
logger.info('Creating user account');
logger.info('Sending welcome email');
logger.groupEnd();

// Use collapsed groups for less important details
logger.group('Request Details', true); // collapsed
logger.debug('Headers', { headers });
logger.debug('Body', { body });
logger.groupEnd();
```

### Table Logging

Display arrays of objects in a table format:

```typescript
const users = [
  { id: 1, name: 'Alice', role: 'Admin' },
  { id: 2, name: 'Bob', role: 'User' },
  { id: 3, name: 'Charlie', role: 'User' },
];

logger.table(users);
// Displays a formatted table in the console
```

### Child Loggers

Create prefixed loggers for different modules:

```typescript
// Create a child logger for authentication module
const authLogger = logger.createChild('Auth');

authLogger.info('User login attempt');
// Output: [2025-10-11T12:34:56.789Z] [Auth] [INFO] User login attempt

// Nested child loggers
const oauth2Logger = authLogger.createChild('OAuth2');
oauth2Logger.info('Token refreshed');
// Output: [2025-10-11T12:34:56.789Z] [Auth:OAuth2] [INFO] Token refreshed
```

### Assertions

Log only when a condition fails:

```typescript
logger.assert(userId !== null, 'User ID should not be null');
// Only logs if userId is null
```

## Configuration

### Global Configuration

Configure the logger globally:

```typescript
import { logger } from '@/utils/logger';

logger.configure({
  level: LogLevel.DEBUG,
  enableTimestamps: true,
  enableColors: false, // Disable colors (future feature)
  prefix: 'MyApp',
});
```

### Custom Logger Instances

Create independent logger instances:

```typescript
import { Logger, LogLevel } from '@/utils/logger';

const apiLogger = new Logger({
  level: LogLevel.INFO,
  enableTimestamps: true,
  prefix: 'API',
});

const dbLogger = new Logger({
  level: LogLevel.DEBUG,
  enableTimestamps: false,
  prefix: 'Database',
});

apiLogger.info('API request received');
dbLogger.debug('Query executed');
```

## Best Practices

### 1. Use Appropriate Log Levels

```typescript
// ❌ Bad
logger.info('Critical error occurred');
logger.error('User clicked button');

// ✅ Good
logger.error('Critical error occurred');
logger.debug('User clicked button');
```

### 2. Add Context to Logs

```typescript
// ❌ Bad
logger.error('Failed to save');

// ✅ Good
logger.error('Failed to save user profile', error, {
  userId: user.id,
  operation: 'updateProfile',
  timestamp: Date.now(),
});
```

### 3. Use Child Loggers for Modules

```typescript
// ❌ Bad - mixing concerns
logger.info('[Auth] User logged in');
logger.info('[Payment] Processing payment');

// ✅ Good - separate loggers
const authLogger = logger.createChild('Auth');
const paymentLogger = logger.createChild('Payment');

authLogger.info('User logged in');
paymentLogger.info('Processing payment');
```

### 4. Use Performance Tracking

```typescript
// Track slow operations
logger.time('database-query');
const results = await db.query(sql);
logger.timeEnd('database-query');

// Or use traceAsync for cleaner code
const results = await logger.traceAsync(async () => db.query(sql), 'database-query');
```

### 5. Don't Log Sensitive Information

```typescript
// ❌ Bad
logger.info('User logged in', {
  email: user.email,
  password: user.password, // NEVER log passwords!
  creditCard: user.card,
});

// ✅ Good
logger.info('User logged in', {
  userId: user.id,
  email: user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3'), // Masked email
  timestamp: Date.now(),
});
```

### 6. Group Related Operations

```typescript
// ✅ Good - organized logging
logger.group('Order Processing');
logger.info('Validating order');
logger.info('Calculating total');
logger.info('Processing payment');
logger.info('Sending confirmation');
logger.groupEnd();
```

## Migration Guide

### From console.log to logger

Replace all console statements:

```typescript
// Before
console.log('User data:', data);
console.error('Error:', error);
console.warn('Deprecated API');
console.debug('Debug info');

// After
import { logger } from '@/utils/logger';

logger.info('User data', { data });
logger.error('Error occurred', error);
logger.warn('Deprecated API');
logger.debug('Debug info');
```

### From console.time to logger.time

```typescript
// Before
console.time('operation');
doSomething();
console.timeEnd('operation');

// After
logger.time('operation');
doSomething();
logger.timeEnd('operation');

// Or better - use trace
logger.trace(() => doSomething(), 'operation');
```

## Common Patterns

### API Request Logging

```typescript
const apiLogger = logger.createChild('API');

async function fetchUserData(userId: string) {
  apiLogger.time(`fetch-user-${userId}`);

  try {
    apiLogger.debug('Fetching user data', { userId });

    const response = await fetch(`/api/users/${userId}`);
    const data = await response.json();

    apiLogger.info('User data fetched successfully', {
      userId,
      dataSize: JSON.stringify(data).length,
    });

    return data;
  } catch (error) {
    apiLogger.error('Failed to fetch user data', error, { userId });
    throw error;
  } finally {
    apiLogger.timeEnd(`fetch-user-${userId}`);
  }
}
```

### Component Lifecycle Logging

```typescript
const componentLogger = logger.createChild('UserProfile');

useEffect(() => {
  componentLogger.debug('Component mounted', { userId });

  return () => {
    componentLogger.debug('Component unmounted', { userId });
  };
}, [userId]);
```

### Error Boundary Logging

```typescript
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('React error boundary caught error', error, {
      componentStack: errorInfo.componentStack,
    });
  }
}
```

### Form Validation Logging

```typescript
const formLogger = logger.createChild('ContactForm');

async function handleSubmit(data: FormData) {
  formLogger.group('Form Submission');

  formLogger.debug('Validating form data');
  const isValid = validateForm(data);

  if (!isValid) {
    formLogger.warn('Form validation failed', { errors: getErrors() });
    formLogger.groupEnd();
    return;
  }

  formLogger.info('Form validated successfully');

  try {
    formLogger.time('form-submit');
    await submitForm(data);
    formLogger.timeEnd('form-submit');

    formLogger.info('Form submitted successfully');
  } catch (error) {
    formLogger.error('Form submission failed', error);
  }

  formLogger.groupEnd();
}
```

## Environment Variables

Control logging via environment variables:

```env
# In .env.local
VITE_LOG_LEVEL=debug  # debug, info, warn, error, none
VITE_ENABLE_LOGS=true # Enable/disable all logging
```

Access in code:

```typescript
import { LogLevel } from '@/utils/logger';

const logLevel = import.meta.env.VITE_LOG_LEVEL?.toUpperCase() || 'INFO';
logger.setLevel(LogLevel[logLevel as keyof typeof LogLevel]);
```

## Testing with Logger

### Mocking in Tests

```typescript
import { logger } from '@/utils/logger';

describe('MyComponent', () => {
  beforeEach(() => {
    // Spy on logger methods
    vi.spyOn(logger, 'info');
    vi.spyOn(logger, 'error');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should log user action', () => {
    // Test code
    performAction();

    expect(logger.info).toHaveBeenCalledWith(
      'Action performed',
      expect.objectContaining({ userId: '123' })
    );
  });
});
```

### Silence Logs in Tests

```typescript
import { LogLevel } from '@/utils/logger';

beforeAll(() => {
  logger.setLevel(LogLevel.NONE); // Disable all logs during tests
});

afterAll(() => {
  logger.setLevel(LogLevel.DEBUG); // Restore after tests
});
```

## Performance Impact

The logger is designed to be lightweight:

- **Development**: ~0.5ms overhead per log statement
- **Production**: ~0.01ms overhead (early return if level check fails)
- **Context serialization**: Only performed if log will be displayed
- **Performance tracking**: Uses high-resolution `performance.now()`

## Troubleshooting

### Logs Not Appearing

1. Check log level:

   ```typescript
   console.log(logger.getLevel()); // Should be DEBUG in dev
   ```

2. Verify environment:

   ```typescript
   console.log(import.meta.env.DEV); // Should be true in dev
   ```

3. Check browser console filter settings

### Circular Reference Errors

The logger handles circular references gracefully:

```typescript
const obj: any = { name: 'test' };
obj.self = obj; // Circular reference

logger.info('Object', { obj });
// Output: [INFO] Object
// [Context contains circular reference]
```

## Summary

The enhanced logger provides a robust, production-ready logging solution with:

- ✅ Multiple log levels
- ✅ Structured context logging
- ✅ Performance tracking
- ✅ Child loggers with prefixes
- ✅ Error stack traces
- ✅ Group/table formatting
- ✅ Type safety
- ✅ Production-safe (configurable)

Replace all `console.*` statements with the logger for better debugging and monitoring capabilities!
