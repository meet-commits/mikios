import { redisClient } from '../config/redis.js';
import logger from './logger.js';

/**
 * Cache utility for Redis operations
 */
class CacheService {
    constructor() {
        this.defaultTTL = 900; // 15 minutes default
    }

    /**
     * Check Redis availability dynamically
     */
    get isRedisAvailable() {
        return Boolean(redisClient && (redisClient.isOpen || redisClient.isReady));
    }


    /**
     * Get data from cache
     */
    async get(key) {
        if (!this.isRedisAvailable) return null;

        try {
            const data = await redisClient.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            logger.error(`Cache GET error for key ${key}:`, error);
            return null;
        }
    }

    /**
     * Set data in cache with TTL
     */
    async set(key, value, ttl = this.defaultTTL) {
        if (!this.isRedisAvailable) return false;

        try {
            await redisClient.setEx(key, ttl, JSON.stringify(value));
            return true;
        } catch (error) {
            logger.error(`Cache SET error for key ${key}:`, error);
            return false;
        }
    }

    /**
     * Delete specific key from cache
     */
    async del(key) {
        if (!this.isRedisAvailable) return false;

        try {
            await redisClient.del(key);
            return true;
        } catch (error) {
            logger.error(`Cache DELETE error for key ${key}:`, error);
            return false;
        }
    }

    /**
     * Delete all keys matching a pattern
     */
    async invalidatePattern(pattern) {
        if (!this.isRedisAvailable) return false;

        try {
            const keys = await redisClient.keys(pattern);
            if (keys.length > 0) {
                await redisClient.del(keys);
            }
            return true;
        } catch (error) {
            logger.error(`Cache INVALIDATE error for pattern ${pattern}:`, error);
            return false;
        }
    }

    /**
     * Cache key generators for consistency
     */
    keys = {
        menu: (restaurantId) => `menu:${restaurantId}`,
        menuItem: (itemId) => `menuItem:${itemId}`,
        restaurant: (restaurantId) => `restaurant:${restaurantId}`,
        tables: (restaurantId) => `tables:${restaurantId}`,
        analytics: (restaurantId, type) => `analytics:${restaurantId}:${type}`,
        orders: (restaurantId, status) => `orders:${restaurantId}:${status || 'all'}`
    };
}

export default new CacheService();
