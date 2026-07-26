import mongoose from 'mongoose';
import logger from '../utils/logger.js';

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            // Options for MongoDB connection
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);

        // Handle connection events
        mongoose.connection.on('error', (err) => {
            logger.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('MongoDB disconnected');
        });

    } catch (error) {
        logger.error('❌ MongoDB connection failed:', error.message);
        if (process.env.NODE_ENV === 'development') {
            try {
                logger.info('Attempting fallback to local MongoDB (mongodb://127.0.0.1:27017/mikios)...');
                const conn = await mongoose.connect('mongodb://127.0.0.1:27017/mikios', {
                    maxPoolSize: 10,
                    serverSelectionTimeoutMS: 3000,
                });
                logger.info(`✅ MongoDB Connected to Local Fallback: ${conn.connection.host}`);
                return;
            } catch (fallbackErr) {
                logger.error('❌ Local MongoDB fallback also failed. Please check Atlas IP whitelist (0.0.0.0/0) or start local MongoDB.');
            }
        }
        process.exit(1);
    }
};


export default connectDB;
