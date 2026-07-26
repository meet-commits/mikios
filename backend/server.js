import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/database.js';
import { connectRedis } from './config/redis.js';
import { errorHandler } from './middleware/errorHandler.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import logger from './utils/logger.js';
import { validateEnvironment } from './utils/validateEnv.js';
import passport from 'passport';
import configurePassport from './services/passport.service.js';

// Import routes
import authRoutes from './routes/auth.routes.js';
import restaurantRoutes from './routes/restaurant.routes.js';
import tableRoutes from './routes/table.routes.js';
import menuRoutes from './routes/menu.routes.js';
import orderRoutes from './routes/order.routes.js';
import voiceRoutes from './routes/voice.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import reviewRoutes from './routes/review.routes.js';
import serviceRoutes from './routes/service.routes.js';
import complaintRoutes from './routes/complaint.routes.js';
import whatsappRoutes from './routes/whatsapp.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import contactRoutes from './routes/contact.routes.js';
import aiRoutes from './routes/ai.routes.js';
import inventoryRoutes from './routes/inventory.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import subscriptionRoutes from './routes/subscription.routes.js';
import staffRoutes from './routes/staff.routes.js';
import adminRoutes from './routes/admin.routes.js';

// Load environment variables
logger.info('Starting server...');
dotenv.config();
logger.info(`Environment variables reloaded. Email User: ${process.env.EMAIL_USER ? 'Set' : 'Not Set'}, Gemini AI Key: ${process.env.GEMINI_API_KEY ? 'Present' : 'Missing'}`);

// Validate environment variables
validateEnvironment();

logger.info('Env loaded, Connecting to DB...');

// Connect to database
connectDB();
connectRedis();
logger.info('Initialization sequence triggered...');

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new Server(httpServer, {
    cors: {
        origin: (origin, callback) => {
            const allowedOrigins = process.env.ALLOWED_ORIGINS
                ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
                : [];
            if (!origin) return callback(null, true);

            if (process.env.NODE_ENV === 'development' || allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
                callback(null, true);
            } else {
                logger.warn(`CORS Blocked: Origin ${origin} not allowed. Allowed: ${allowedOrigins.join(', ')}`);
                callback(new Error('Not allowed by CORS'));
            }
        },
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        credentials: true
    }
});

// Make io accessible to routes
app.set('io', io);

// Middleware
app.use(helmet());
app.use(cors({
    origin: (origin, callback) => {
        const allowedOrigins = process.env.ALLOWED_ORIGINS
            ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
            : [];
        if (!origin) return callback(null, true);

        if (process.env.NODE_ENV === 'development' || allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
            callback(null, true);
        } else {
            logger.warn(`CORS Blocked (HTTP): Origin ${origin} not allowed.`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(compression());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Initialize Passport
configurePassport();
app.use(passport.initialize());

// CRITICAL: Webhook routes MUST come before express.json() to preserve raw body for signature verification
// Import the webhook handler directly
import { handleStripeWebhook } from './controllers/payment.controller.js';
app.post('/api/payments/webhook/stripe', express.raw({ type: 'application/json' }), handleStripeWebhook);

// Now add JSON parsing for all other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.set('trust proxy', 1);
app.use('/api/', rateLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/restaurant', restaurantRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/service', serviceRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/staff', staffRoutes);
app.use('/uploads', express.static('uploads'));

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Socket.IO connection handling
io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    socket.on('join:restaurant', (restaurantId) => {
        socket.join(`restaurant:${restaurantId}`);
        logger.info(`Socket ${socket.id} joined restaurant:${restaurantId}`);
    });

    socket.on('join:order', (orderId) => {
        socket.join(`order:${orderId}`);
        logger.info(`Socket ${socket.id} joined order:${orderId}`);
    });

    socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
    });
});

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    logger.info(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    logger.info(`📡 WebSocket server ready`);
});

process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Promise Rejection:', err);
    httpServer.close(() => process.exit(1));
});

export { io };
