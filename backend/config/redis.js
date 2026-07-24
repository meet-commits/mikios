import { createClient } from 'redis';
import logger from '../utils/logger.js';

let redisClient;

const connectRedis = async () => {
    if (!process.env.REDIS_URL) {
        logger.warn('⚠️  REDIS_URL not set. Skipping Redis connection.');
        return;
    }

    try {
        redisClient = createClient({
            url: process.env.REDIS_URL
        });

        redisClient.on('error', (err) => {
            logger.error('Redis Client Error:', err);
        });

        redisClient.on('connect', () => {
            logger.info('🚀 Redis Client Connected');
        });

        await redisClient.connect();
    } catch (error) {
        logger.error('Could not connect to Redis:', error);
        // We don't exit process here because the app can still function without cache
    }
};

export { redisClient, connectRedis };
