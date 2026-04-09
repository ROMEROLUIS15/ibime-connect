import pino from 'pino';

const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

const pinoConfig = {
  level: process.env.LOG_LEVEL || 'info',
  ...(isDev && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        ignore: 'pid,hostname',
        singleLine: false,
      },
    },
  }),
};

export const logger = pino(pinoConfig);

export function requestLoggerMiddleware(req: any, res: any, next: any) {
  const requestId = req.headers['x-request-id'] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);

  logger.info(
    { requestId, method: req.method, path: req.path, query: req.query },
    'Incoming request'
  );

  const originalSend = res.send;
  res.send = function (data: any) {
    logger.info(
      { requestId, statusCode: res.statusCode, method: req.method, path: req.path },
      'Outgoing response'
    );
    return originalSend.call(this, data);
  };

  next();
}

export function contextLogger(requestId?: string) {
  return {
    info: (msg: string, data?: any) => logger.info({ requestId, ...data }, msg),
    error: (msg: string, error?: any) => logger.error({ requestId, error }, msg),
    warn: (msg: string, data?: any) => logger.warn({ requestId, ...data }, msg),
    debug: (msg: string, data?: any) => logger.debug({ requestId, ...data }, msg),
  };
}
