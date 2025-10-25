/**
 * Diagnostics Utility
 * Helps identify slow or hanging queries
 */

import { logger } from './logger';

export async function timeQuery<T>(
  name: string,
  queryFn: () => Promise<T>,
  timeoutMs: number = 10000
): Promise<T> {
  const startTime = performance.now();

  return Promise.race([
    queryFn().then(result => {
      const duration = performance.now() - startTime;
      if (duration > 1000) {
        logger.warn(`Slow query detected: ${name} took ${duration.toFixed(0)}ms`);
      } else {
        logger.log(`Query ${name} completed in ${duration.toFixed(0)}ms`);
      }
      return result;
    }),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Query ${name} timed out after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

export function logQueryStart(name: string) {
  logger.log(`🔍 Starting query: ${name}`);
  return performance.now();
}

export function logQueryEnd(name: string, startTime: number) {
  const duration = performance.now() - startTime;
  if (duration > 1000) {
    logger.warn(`⚠️ Slow query: ${name} took ${duration.toFixed(0)}ms`);
  } else {
    logger.log(`✅ Query complete: ${name} (${duration.toFixed(0)}ms)`);
  }
}
