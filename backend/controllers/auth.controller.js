import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import crypto from 'crypto';
import logger from '../utils/logger.js';
import { sendPasswordResetOTP, sendVerificationEmail, sendWelcomeEmail } from '../services/email.service.js';

// Generate JWT token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '1h'
    });
};

// Generate refresh token
const generateRefreshToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d'
    });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;

        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            logger.warn(`Registration failed: Email already exists - ${email}`);
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        // Create user
        const user = await User.create({
            name,
            email,
            password,
            role: role || 'OWNER'
        });

        // Generate verification OTP
        const otp = user.generateEmailVerificationOTP();
        await user.save({ validateBeforeSave: false });

        // Send verification OTP email (Non-blocking)
        sendVerificationEmail(user.email, otp, user.name).catch(emailError => {
            logger.error(`Failed to send verification OTP during registration to ${user.email}: ${emailError.message}`);
        });
        logger.info(`Verification OTP dispatching to: ${user.email}`);

        logger.info(`New user registered (verification pending): ${user.email} (${user.role})`);

        res.status(201).json({
            success: true,
            message: 'Registration successful. Please check your email for the verification OTP.',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    emailVerified: false
                }
            }
        });
    } catch (error) {
        logger.error(`Registration error: ${error.message}`);
        next(error);
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Check for user (include password for comparison)
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            logger.warn(`Login failed: Invalid email - ${email}`);
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if user is active
        if (!user.isActive) {
            logger.warn(`Login failed: Inactive account - ${email}`);
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated'
            });
        }

        // Check if email is verified
        if (!user.emailVerified) {
            logger.warn(`Login failed: Email not verified - ${email}`);
            return res.status(401).json({
                success: false,
                message: 'Your email is not verified. Please check your inbox or request a new verification link.',
                notVerified: true
            });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            logger.warn(`Login failed: Invalid password - ${email}`);
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Populate restaurant for immediate frontend benefit
        await user.populate({
            path: 'restaurant',
            populate: { path: 'subscription' }
        });

        // Generate tokens
        const token = generateToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        // Save refresh token
        user.refreshToken = refreshToken;
        await user.save();

        logger.info(`User logged in: ${user.email}`);

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user, // Return full populated user
                token,
                refreshToken
            }
        });
    } catch (error) {
        logger.error(`Login error: ${error.message}`);
        next(error);
    }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
export const refreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token is required'
            });
        }

        // Verify refresh token
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        // Get user and verify refresh token
        const user = await User.findById(decoded.id).select('+refreshToken');
        if (!user || user.refreshToken !== refreshToken) {
            logger.warn(`RefreshToken failed: Invalid token for user ID ${decoded.id}`);
            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token'
            });
        }

        // Generate new tokens
        const newToken = generateToken(user._id);
        const newRefreshToken = generateRefreshToken(user._id);

        // Update refresh token
        user.refreshToken = newRefreshToken;
        await user.save();

        res.status(200).json({
            success: true,
            data: {
                token: newToken,
                refreshToken: newRefreshToken
            }
        });
    } catch (error) {
        logger.error(`RefreshToken error: ${error.message}`);
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired refresh token'
        });
    }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res, next) => {
    try {
        // Clear refresh token
        req.user.refreshToken = null;
        await req.user.save();

        logger.info(`User logged out: ${req.user.email}`);

        res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        logger.error(`Logout error: ${error.message}`);
        next(error);
    }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).populate({
            path: 'restaurant',
            populate: { path: 'subscription' }
        });

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        logger.error(`GetMe error: ${error.message}`);
        next(error);
    }
};

// @desc    Request password reset OTP
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            // For security, don't reveal if user exists
            logger.info(`Password reset requested for non-existent email: ${email}`);
            return res.status(200).json({
                success: true,
                message: 'If an account exists with this email, you will receive a password reset OTP'
            });
        }

        // Generate OTP
        const otp = user.generatePasswordResetOTP();
        await user.save({ validateBeforeSave: false });

        // Send email
        try {
            await sendPasswordResetOTP(user.email, otp, user.name);

            logger.info(`Password reset OTP sent to: ${user.email}`);

            res.status(200).json({
                success: true,
                message: 'Password reset OTP sent to your email',
                data: {
                    email: user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3') // Obfuscate email
                }
            });
        } catch (emailError) {
            logger.error(`Failed to send password reset email to ${user.email}: ${emailError.message}`);

            // Reset fields if email fails
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save({ validateBeforeSave: false });

            return res.status(500).json({
                success: false,
                message: 'Failed to send password reset email. Please try again later.'
            });
        }
    } catch (error) {
        logger.error(`ForgotPassword error: ${error.message}`);
        next(error);
    }
};

// @desc    Verify OTP (optional step before reset)
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOTP = async (req, res, next) => {
    try {
        const { email, otp } = req.body;

        // Hash the provided OTP
        const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

        // Find user with matching OTP and valid expiry
        const user = await User.findOne({
            email,
            passwordResetToken: hashedOTP,
            passwordResetExpires: { $gt: Date.now() }
        }).select('+passwordResetToken +passwordResetExpires');

        if (!user) {
            logger.warn(`OTP verification failed for ${email}`);
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP'
            });
        }

        res.status(200).json({
            success: true,
            message: 'OTP verified successfully. You can now reset your password.'
        });
    } catch (error) {
        logger.error(`VerifyOTP error: ${error.message}`);
        next(error);
    }
};

// @desc    Reset password with OTP
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res, next) => {
    try {
        const { email, otp, newPassword } = req.body;

        // Hash the provided OTP
        const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

        // Find user with matching OTP and valid expiry
        const user = await User.findOne({
            email,
            passwordResetToken: hashedOTP,
            passwordResetExpires: { $gt: Date.now() }
        }).select('+passwordResetToken +passwordResetExpires +refreshToken');

        if (!user) {
            logger.warn(`Password reset failed: Invalid OTP for ${email}`);
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP'
            });
        }

        // Update password
        user.password = newPassword;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        user.refreshToken = null; // Invalidate all existing sessions

        await user.save();

        logger.info(`Password successfully reset for: ${user.email}`);

        res.status(200).json({
            success: true,
            message: 'Password reset successful. Please login with your new password.'
        });
    } catch (error) {
        logger.error(`ResetPassword error: ${error.message}`);
        next(error);
    }
};

// @desc    Verify email
// @route   POST /api/auth/verify-email
// @access  Public
export const verifyEmail = async (req, res, next) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Verification token is required'
            });
        }

        // Hash token to compare with stored version
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // Find user with matching token and valid expiry
        const user = await User.findOne({
            verificationToken: hashedToken,
            verificationExpires: { $gt: Date.now() }
        }).select('+verificationToken +verificationExpires');

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired verification token'
            });
        }

        // Mark as verified
        user.emailVerified = true;
        user.verificationToken = undefined;
        user.verificationExpires = undefined;
        await user.save({ validateBeforeSave: false });

        logger.info(`Email verified for: ${user.email}`);

        // Send welcome email
        try {
            await sendWelcomeEmail(user.email, user.name);
        } catch (emailError) {
            logger.error(`Failed to send welcome email to ${user.email}: ${emailError.message}`);
        }

        res.status(200).json({
            success: true,
            message: 'Email verified successfully! You can now login.'
        });
    } catch (error) {
        logger.error(`VerifyEmail error: ${error.message}`);
        next(error);
    }
};

// @desc    Verify email with OTP
// @route   POST /api/auth/verify-email-otp
// @access  Public
export const verifyEmailOTP = async (req, res, next) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Email and OTP are required'
            });
        }

        // Hash OTP to compare with stored version
        const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

        // Find user with matching OTP and valid expiry
        const user = await User.findOne({
            email,
            verificationToken: hashedOTP,
            verificationExpires: { $gt: Date.now() }
        }).select('+verificationToken +verificationExpires');

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP'
            });
        }

        // Mark as verified
        user.emailVerified = true;
        user.verificationToken = undefined;
        user.verificationExpires = undefined;
        await user.save({ validateBeforeSave: false });

        logger.info(`Email verified via OTP for: ${user.email}`);

        // Send welcome email
        try {
            await sendWelcomeEmail(user.email, user.name);
        } catch (emailError) {
            logger.error(`Failed to send welcome email to ${user.email}: ${emailError.message}`);
        }

        res.status(200).json({
            success: true,
            message: 'Email verified successfully! You can now login.'
        });
    } catch (error) {
        logger.error(`VerifyEmailOTP error: ${error.message}`);
        next(error);
    }
};

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public
export const resendVerificationEmail = async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            // For security, don't reveal if user exists
            return res.status(200).json({
                success: true,
                message: 'If an account exists with this email, a new verification link has been sent.'
            });
        }

        if (user.emailVerified) {
            return res.status(400).json({
                success: false,
                message: 'This email is already verified. Please login.'
            });
        }

        // Generate new token
        const verificationToken = user.generateVerificationToken();
        await user.save({ validateBeforeSave: false });

        // Send email (Non-blocking)
        sendVerificationEmail(user.email, verificationToken, user.name).catch(err => {
            logger.error(`Async Resend Email Error for ${user.email}: ${err.message}`);
        });
        logger.info(`Verification email dispatching to: ${user.email}`);

        res.status(200).json({
            success: true,
            message: 'A new verification link has been sent to your email.'
        });
    } catch (error) {
        logger.error(`ResendVerificationEmail error: ${error.message}`);
        next(error);
    }
};

// @desc    Google auth callback handler
// @route   GET /api/auth/google/callback
// @access  Public
export const googleAuthCallback = async (req, res) => {
    try {
        const user = req.user;
        const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'https://mikios.vercel.app';

        if (!user) {
            return res.redirect(`${frontendUrl}/login?error=auth_failed`);
        }


        // Generate tokens
        const token = generateToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        // Save refresh token
        user.refreshToken = refreshToken;
        await user.save();

        const userData = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            profileImage: user.profileImage,
            restaurant: user.restaurant
        };

        // Redirect to frontend with tokens
        const redirectUrl = `${frontendUrl}/login?token=${token}&refreshToken=${refreshToken}&user=${encodeURIComponent(JSON.stringify(userData))}`;

        res.redirect(redirectUrl);
    } catch (error) {
        logger.error(`Google Auth Callback Error: ${error.message}`);
        const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'https://mikios.vercel.app';
        res.redirect(`${frontendUrl}/login?error=server_error`);
    }
};


// @desc    Test email configuration
// @route   GET /api/auth/test-email
// @access  Public
export const testEmail = async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) return res.status(400).json({ success: false, message: 'Email query param required' });

        logger.info(`Starting email test for: ${email}`);
        const result = await sendVerificationEmail(email, 'TEST-1234', 'Test User');

        res.status(200).json({
            success: true,
            message: 'Test email dispatch attempt completed. Check backend logs for result.',
            result
        });
    } catch (error) {
        logger.error(`Test Email Error: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Test email failed',
            error: error.message
        });
    }
};
