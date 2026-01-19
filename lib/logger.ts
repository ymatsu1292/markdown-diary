import pino from 'pino';

const base_logger = pino({
  level: process.env.NEXT_PUBLIC_LOG_LEVEL || 'info',
  browser: {
    asObject: true,
    serialize: true,
  }
})

export default base_logger;

