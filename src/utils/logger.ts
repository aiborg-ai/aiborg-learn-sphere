/**
 * Logger utility that only logs in development mode
 * This prevents sensitive information from being logged in production
 */

const isDevelopment = import.meta.env.DEV;

export const logger = {
  log: (...args: unknown[]) => {
    if (isDevelopment) {
      // eslint-disable-next-line no-console
      console.log(...args);
    }
  },

  error: (...args: unknown[]) => {
    if (isDevelopment) {
       
      console.error(...args);
    }
  },

  warn: (...args: unknown[]) => {
    if (isDevelopment) {
       
      console.warn(...args);
    }
  },

  info: (...args: unknown[]) => {
    if (isDevelopment) {
      // eslint-disable-next-line no-console
      console.info(...args);
    }
  },

  debug: (...args: unknown[]) => {
    if (isDevelopment) {
      // eslint-disable-next-line no-console
      console.debug(...args);
    }
  },

  table: (data: unknown) => {
    if (isDevelopment) {
      // eslint-disable-next-line no-console
      console.table(data);
    }
  }
};