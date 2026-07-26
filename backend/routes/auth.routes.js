import express from 'express';
import { register, login, refreshToken, logout, getMe, forgotPassword, verifyOTP, resetPassword, verifyEmail, verifyEmailOTP, resendVerificationEmail, googleAuthCallback, testEmail } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.js';
import passport from 'passport';
import {
    registerValidation,
    loginValidation,
    refreshTokenValidation,
    forgotPasswordValidation,
    verifyOTPValidation,
    resetPasswordValidation,
    verifyEmailValidation,
    resendVerificationValidation
} from '../middleware/validators/auth.validator.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Rate limiters
const authLimiter = createRateLimiter(20, 15); // 20 requests per 15 minutes
const generalLimiter = createRateLimiter(50, 15); // 50 requests per 15 minutes

// Public routes
router.post('/register', generalLimiter, registerValidation, register);
router.post('/login', generalLimiter, loginValidation, login);
router.post('/refresh', refreshTokenValidation, refreshToken);

// Password reset routes
router.post('/forgot-password', authLimiter, forgotPasswordValidation, forgotPassword);
router.post('/verify-otp', authLimiter, verifyOTPValidation, verifyOTP);
router.post('/reset-password', authLimiter, resetPasswordValidation, resetPassword);

// Email verification routes
router.post('/verify-email', generalLimiter, verifyEmailValidation, verifyEmail);
router.post('/verify-email-otp', generalLimiter, verifyEmailOTP);
router.post('/resend-verification', authLimiter, resendVerificationValidation, resendVerificationEmail);
router.get('/test-email', testEmail);

// Google OAuth routes
router.get('/google', (req, res, next) => {
    const { intent = 'login', role = 'OWNER' } = req.query;
    // Use a simple string instead of base64 to avoid parsing issues
    const state = `${intent}:${role}`;
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        state: state
    })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
    passport.authenticate('google', { session: false }, (err, user, info) => {
        if (err) return next(err);
        if (!user) {
            const message = info?.message || 'Authentication failed';
            const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'https://mikios.vercel.app';

            // If email is not registered, take them to the REGISTER page as requested
            const targetPage = message === 'Email not registered' ? 'register' : 'login';
            return res.redirect(`${frontendUrl}/${targetPage}?error=${encodeURIComponent(message)}`);
        }
        req.user = user;
        googleAuthCallback(req, res);
    })(req, res, next);
});

// Protected routes
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

export default router;
