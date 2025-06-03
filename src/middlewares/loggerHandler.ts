// src/middleware/logging.ts
import morgan from 'morgan';

import logger from '../utils/customLogger.ts';

// Custom Morgan format that integrates with Winston
const morganFormat =
  ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms';

export const httpLogger = morgan(morganFormat, {
  stream: {
    write: (message: string) => {
      // Send HTTP logs to Winston with 'http' label
      logger.info(message.trim(), {
        type: 'http-access',
        source: 'morgan',
      });
    },
  },
});

// Skip logging for health checks
export const httpLoggerWithSkip = morgan(morganFormat, {
  skip: (req) => req.url === '/health' || req.url === '/ping',
  stream: {
    write: (message: string) => {
      logger.info(message.trim(), {
        type: 'http-access',
        source: 'morgan',
      });
    },
  },
});
