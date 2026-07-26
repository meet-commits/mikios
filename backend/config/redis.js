import { createClient } from 'redis';
import logger from '../utils/logger.js';

let redisClient = null;

const connectRedis = async () => {
    const redisUrl = process.env.REDIS_URL;

    // Skip Redis connection if not configured, disabled, or set to localhost in production
    if (!redisUrl || redisUrl === 'disabled' || (process.env.NODE_ENV === 'production' && redisUrl.includes('localhost'))) {
        logger.info('ℹ️ Redis not configured for production. Running without Redis cache.');
        return;
    }

    try {
        redisClient = createClient({
            url: redisUrl,
            socket: {
                // Retry connection max 3 times, then stop to prevent spamming logs
                reconnectStrategy: (retries) => {
                    if (retries >= 3) {
                        logger.warn('⚠️ Redis max connection retries reached. Running without Redis.');
                        return new Error('Redis connection failed');
                    }
                    return Math.min(retries * 500, 3000);
                }
            }
        });

        redisClient.on('error', (err) => {
            logger.debug(`Redis connection notice: ${err.message || err}`);
        });


        redisClient.on('connect', () => {
            logger.info('🚀 Redis Client Connected');
        });

        await redisClient.connect();
    } catch (error) {
        logger.warn(`⚠️ Could not connect to Redis: ${error.message}. Running without cache.`);
        redisClient = null;
    }
};

export { redisClient, connectRedis };

