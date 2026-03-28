import pino from 'pino';

const isDev = process.env.NODE_ENV === 'development';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isDev ? 'debug' : 'info'),
  ...(isDev
    ? {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:standard', ignore: 'pid,hostname' },
        },
      }
    : {
        // Production: structured JSON — forward to log aggregator (Datadog, Logtail, etc.)
        formatters: {
          level(label) {
            return { level: label };
          },
        },
        timestamp: pino.stdTimeFunctions.isoTime,
      }),
});

// Child loggers per domain
export const dbLogger = logger.child({ context: 'database' });
export const authLogger = logger.child({ context: 'auth' });
export const stripeLogger = logger.child({ context: 'stripe' });
export const emailLogger = logger.child({ context: 'email' });
export const storageLogger = logger.child({ context: 'storage' });
