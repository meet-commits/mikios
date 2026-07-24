import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';
import logger from '../utils/logger.js';
import dotenv from 'dotenv';

dotenv.config();

const configurePassport = () => {
    // Skip Google OAuth if credentials are not configured
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        logger.warn('⚠️  Google OAuth credentials not set. Google login will be disabled.');
        // Still set up serialize/deserialize for session support
        passport.serializeUser((user, done) => done(null, user.id));
        passport.deserializeUser(async (id, done) => {
            try {
                const user = await User.findById(id);
                done(null, user);
            } catch (error) {
                done(error, null);
            }
        });
        return;
    }

    const callbackURL = process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback';

    logger.info(`Google OAuth Callback URL: ${callbackURL}`);

    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: callbackURL,
        proxy: true,
        passReqToCallback: true
    }, async (req, accessToken, refreshToken, profile, done) => {
        try {
            // Parse state to get intent and role
            let intent = 'login';
            let role = 'OWNER';

            if (req.query.state) {
                const parts = req.query.state.split(':');
                if (parts.length === 2) {
                    intent = parts[0];
                    role = parts[1];
                }
            }

            logger.info(`OAuth Strategy - Intent: ${intent}, Role: ${role}, Email: ${profile.emails[0].value}`);

            // Check if user already exists
            let user = await User.findOne({
                $or: [
                    { googleId: profile.id },
                    { email: profile.emails[0].value }
                ]
            });

            if (user) {
                // Update googleId if it wasn't there
                let isModified = false;
                if (!user.googleId) {
                    user.googleId = profile.id;
                    user.emailVerified = true;
                    isModified = true;
                }

                if (user.role === 'CUSTOMER') {
                    user.role = 'OWNER';
                    isModified = true;
                }

                if (isModified) {
                    await user.save();
                }
                return done(null, user);
            }

            // If user doesn't exist and intent is login, return error
            if (intent === 'login') {
                logger.info(`Unregistered Google user attempted login: ${profile.emails[0].value}`);
                return done(null, false, { message: 'Email not registered' });
            }

            // If user doesn't exist and intent is register, create user
            user = await User.create({
                name: profile.displayName,
                email: profile.emails[0].value,
                googleId: profile.id,
                emailVerified: true,
                profileImage: profile.photos[0]?.value,
                password: Math.random().toString(36).slice(-10) + 'A1!',
                role: role
            });

            logger.info(`New user registered via Google: ${user.email} as ${user.role}`);
            return done(null, user);
        } catch (error) {
            logger.error(`Google Strategy Error: ${error.message}`);
            return done(error, null);
        }
    }));

    // Serialize/Deserialize
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (error) {
            done(error, null);
        }
    });
};

export default configurePassport;
