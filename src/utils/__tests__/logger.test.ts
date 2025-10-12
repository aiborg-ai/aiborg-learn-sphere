import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger, Logger, LogLevel } from '../logger';

describe('Logger', () => {
  // Mock console methods
  const mockConsole = {
    log: vi.spyOn(console, 'log').mockImplementation(() => {}),
    error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
    info: vi.spyOn(console, 'info').mockImplementation(() => {}),
    debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
    table: vi.spyOn(console, 'table').mockImplementation(() => {}),
    group: vi.spyOn(console, 'group').mockImplementation(() => {}),
    groupCollapsed: vi.spyOn(console, 'groupCollapsed').mockImplementation(() => {}),
    groupEnd: vi.spyOn(console, 'groupEnd').mockImplementation(() => {}),
  };

  beforeEach(() => {
    // Clear mock calls before each test
    Object.values(mockConsole).forEach(mock => mock.mockClear());
    // Reset logger to DEBUG level
    logger.setLevel(LogLevel.DEBUG);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('log levels', () => {
    it('should have correct log level values', () => {
      expect(LogLevel.DEBUG).toBe(0);
      expect(LogLevel.INFO).toBe(1);
      expect(LogLevel.WARN).toBe(2);
      expect(LogLevel.ERROR).toBe(3);
      expect(LogLevel.NONE).toBe(4);
    });

    it('should get and set log level', () => {
      logger.setLevel(LogLevel.WARN);
      expect(logger.getLevel()).toBe(LogLevel.WARN);

      logger.setLevel(LogLevel.DEBUG);
      expect(logger.getLevel()).toBe(LogLevel.DEBUG);
    });

    it('should respect log level filtering', () => {
      logger.setLevel(LogLevel.ERROR);

      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      expect(mockConsole.debug).not.toHaveBeenCalled();
      expect(mockConsole.info).not.toHaveBeenCalled();
      expect(mockConsole.warn).not.toHaveBeenCalled();
      expect(mockConsole.error).toHaveBeenCalledTimes(1);
    });
  });

  describe('basic logging', () => {
    it('should log debug messages', () => {
      logger.debug('debug message');
      expect(mockConsole.debug).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG] debug message')
      );
    });

    it('should log info messages', () => {
      logger.info('info message');
      expect(mockConsole.info).toHaveBeenCalledWith(expect.stringContaining('[INFO] info message'));
    });

    it('should log warn messages', () => {
      logger.warn('warn message');
      expect(mockConsole.warn).toHaveBeenCalledWith(expect.stringContaining('[WARN] warn message'));
    });

    it('should log error messages', () => {
      logger.error('error message');
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR] error message')
      );
    });

    it('should alias log to info', () => {
      logger.log('log message');
      expect(mockConsole.info).toHaveBeenCalledWith(expect.stringContaining('[INFO] log message'));
    });
  });

  describe('context logging', () => {
    it('should log with context object', () => {
      const context = { userId: '123', action: 'click' };
      logger.info('User action', context);

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringMatching(/\[INFO\] User action[\s\S]*"userId": "123"[\s\S]*"action": "click"/)
      );
    });

    it('should handle empty context', () => {
      logger.info('Message', {});
      expect(mockConsole.info).toHaveBeenCalledWith(expect.stringContaining('[INFO] Message'));
    });

    it('should handle circular references in context', () => {
      const circular: any = { name: 'test' };
      circular.self = circular;

      logger.info('Circular reference test', { circular });
      expect(mockConsole.info).toHaveBeenCalledWith(expect.stringContaining('circular reference'));
    });
  });

  describe('error logging', () => {
    it('should log Error objects with stack trace', () => {
      const error = new Error('Test error');
      logger.error('Operation failed', error);

      const call = mockConsole.error.mock.calls[0][0];
      expect(call).toContain('[ERROR] Operation failed');
      expect(call).toContain('Test error');
      expect(call).toContain('stack');
    });

    it('should log error with context', () => {
      const error = new Error('Test error');
      logger.error('Operation failed', error, { userId: '123' });

      const call = mockConsole.error.mock.calls[0][0];
      expect(call).toContain('[ERROR] Operation failed');
      expect(call).toContain('userId');
      expect(call).toContain('123');
    });

    it('should handle non-Error objects', () => {
      logger.error('Failed', 'String error');
      expect(mockConsole.error).toHaveBeenCalledWith(expect.stringContaining('[ERROR] Failed'));
    });
  });

  describe('table logging', () => {
    it('should call console.table', () => {
      const data = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 },
      ];
      logger.table(data);
      expect(mockConsole.table).toHaveBeenCalledWith(data);
    });

    it('should not log table if level is too high', () => {
      logger.setLevel(LogLevel.INFO);
      logger.table([{ name: 'John' }]);
      expect(mockConsole.table).not.toHaveBeenCalled();
    });
  });

  describe('grouped logging', () => {
    it('should create log groups', () => {
      logger.group('Test Group');
      logger.info('Message inside group');
      logger.groupEnd();

      expect(mockConsole.group).toHaveBeenCalledWith('Test Group');
      expect(mockConsole.info).toHaveBeenCalled();
      expect(mockConsole.groupEnd).toHaveBeenCalled();
    });

    it('should create collapsed groups', () => {
      logger.group('Collapsed Group', true);
      logger.groupEnd();

      expect(mockConsole.groupCollapsed).toHaveBeenCalledWith('Collapsed Group');
      expect(mockConsole.groupEnd).toHaveBeenCalled();
    });
  });

  describe('performance timing', () => {
    it('should track time for operations', () => {
      logger.time('test-operation');
      logger.timeEnd('test-operation');

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringMatching(/\[INFO\] test-operation: \d+\.\d+ms/)
      );
    });

    it('should warn if timer does not exist', () => {
      logger.timeEnd('non-existent-timer');

      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining("Timer 'non-existent-timer' does not exist")
      );
    });
  });

  describe('assertions', () => {
    it('should not log when assertion passes', () => {
      logger.assert(true, 'This should not log');
      expect(mockConsole.error).not.toHaveBeenCalled();
    });

    it('should log when assertion fails', () => {
      logger.assert(false, 'This should log');
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('Assertion failed: This should log')
      );
    });
  });

  describe('child loggers', () => {
    it('should create child logger with prefix', () => {
      const childLogger = logger.createChild('Auth');
      childLogger.info('Login attempt');

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringMatching(/\[Auth\] \[INFO\] Login attempt/)
      );
    });

    it('should support nested child loggers', () => {
      const authLogger = logger.createChild('Auth');
      const oauthLogger = authLogger.createChild('OAuth2');
      oauthLogger.info('Token refreshed');

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringMatching(/\[Auth:OAuth2\] \[INFO\] Token refreshed/)
      );
    });

    it('should inherit configuration from parent', () => {
      const parentLogger = new Logger({ level: LogLevel.WARN });
      const childLogger = parentLogger.createChild('Child');

      childLogger.info('This should not log');
      expect(mockConsole.info).not.toHaveBeenCalled();

      childLogger.warn('This should log');
      expect(mockConsole.warn).toHaveBeenCalled();
    });
  });

  describe('function tracing', () => {
    it('should trace synchronous function execution', () => {
      const fn = () => {
        return 42;
      };

      const result = logger.trace(fn, 'testFunction');

      expect(result).toBe(42);
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringMatching(/\[INFO\] testFunction: \d+\.\d+ms/)
      );
    });

    it('should trace and rethrow errors', () => {
      const fn = () => {
        throw new Error('Test error');
      };

      expect(() => logger.trace(fn, 'errorFunction')).toThrow('Test error');
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('Error in errorFunction')
      );
    });

    it('should trace async function execution', async () => {
      const asyncFn = async () => {
        return Promise.resolve('result');
      };

      const result = await logger.traceAsync(asyncFn, 'asyncFunction');

      expect(result).toBe('result');
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringMatching(/\[INFO\] asyncFunction: \d+\.\d+ms/)
      );
    });

    it('should trace async functions and rethrow errors', async () => {
      const asyncFn = async () => {
        throw new Error('Async error');
      };

      await expect(logger.traceAsync(asyncFn, 'asyncError')).rejects.toThrow('Async error');
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('Error in asyncError')
      );
    });
  });

  describe('configuration', () => {
    it('should update configuration', () => {
      const customLogger = new Logger();
      customLogger.configure({
        level: LogLevel.WARN,
        enableTimestamps: false,
      });

      customLogger.debug('Should not log');
      customLogger.warn('Should log');

      expect(mockConsole.debug).not.toHaveBeenCalled();
      expect(mockConsole.warn).toHaveBeenCalled();
    });

    it('should support custom prefix', () => {
      const customLogger = new Logger({ prefix: 'MyApp' });
      customLogger.info('Test message');

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringMatching(/\[MyApp\] \[INFO\] Test message/)
      );
    });

    it('should support timestamp configuration', () => {
      const withTimestamps = new Logger({ enableTimestamps: true });
      withTimestamps.info('With timestamp');

      const call = mockConsole.info.mock.calls[0][0];
      expect(call).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('custom logger instances', () => {
    it('should create independent logger instances', () => {
      const logger1 = new Logger({ level: LogLevel.DEBUG });
      const logger2 = new Logger({ level: LogLevel.ERROR });

      logger1.debug('Debug from logger1');
      logger2.debug('Debug from logger2');

      // logger1 should log (DEBUG level)
      // logger2 should not log (ERROR level)
      expect(mockConsole.debug).toHaveBeenCalledTimes(1);
    });

    it('should not affect global logger', () => {
      const customLogger = new Logger({ level: LogLevel.NONE });

      customLogger.info('From custom logger');
      logger.info('From global logger');

      // Only global logger should have logged
      expect(mockConsole.info).toHaveBeenCalledTimes(1);
    });
  });

  describe('edge cases', () => {
    it('should handle NONE log level', () => {
      logger.setLevel(LogLevel.NONE);

      logger.debug('debug');
      logger.info('info');
      logger.warn('warn');
      logger.error('error');

      expect(mockConsole.debug).not.toHaveBeenCalled();
      expect(mockConsole.info).not.toHaveBeenCalled();
      expect(mockConsole.warn).not.toHaveBeenCalled();
      expect(mockConsole.error).not.toHaveBeenCalled();
    });

    it('should handle undefined context', () => {
      logger.info('Message', undefined);
      expect(mockConsole.info).toHaveBeenCalledWith(expect.stringContaining('[INFO] Message'));
    });

    it('should handle complex nested objects', () => {
      const complexContext = {
        user: {
          id: '123',
          profile: {
            name: 'John',
            settings: {
              theme: 'dark',
              notifications: true,
            },
          },
        },
      };

      logger.info('Complex context', complexContext);
      const call = mockConsole.info.mock.calls[0][0];
      expect(call).toContain('John');
      expect(call).toContain('dark');
    });
  });
});
