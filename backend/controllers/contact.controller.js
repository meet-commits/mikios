import Inquiry from '../models/Inquiry.js';
import logger from '../utils/logger.js';
import { sendWelcomeEmail } from '../services/email.service.js';

// Send contact sales email & save inquiry
export const sendContactEmail = async (req, res, next) => {
    try {
        const { name, email, restaurantName, phone, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and message are required fields'
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email address'
            });
        }

        // 1. Save Inquiry in Database
        const inquiry = await Inquiry.create({
            name,
            email,
            phone,
            restaurantName,
            message,
            type: 'CONTACT_SALES',
            status: 'PENDING'
        });

        logger.info(`New Contact Sales Inquiry created: ${email} (${name})`);

        // 2. Try sending confirmation email
        try {
            await sendWelcomeEmail(email, name);
        } catch (emailErr) {
            logger.warn(`Failed to dispatch confirmation email to ${email}: ${emailErr.message}`);
        }

        res.status(200).json({
            success: true,
            message: 'Thank you! Your message has been received. Our team will contact you shortly.',
            data: inquiry
        });
    } catch (error) {
        logger.error(`sendContactEmail Error: ${error.message}`);
        next(error);
    }
};

// Request Demo Link
export const requestDemoLink = async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Work email is required'
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email address'
            });
        }

        // 1. Save Demo Link Request in Database
        const inquiry = await Inquiry.create({
            name: 'Demo Request User',
            email,
            message: 'Requested mikiOS Instant Demo Video Link',
            type: 'DEMO_REQUEST',
            status: 'PENDING'
        });

        logger.info(`New Demo Link Request recorded: ${email}`);

        // 2. Try sending email with demo link
        try {
            await sendWelcomeEmail(email, 'Restaurant Leader');
        } catch (emailErr) {
            logger.warn(`Failed to send demo link email to ${email}: ${emailErr.message}`);
        }

        res.status(200).json({
            success: true,
            message: 'Demo link and video walkthrough dispatched to your email!',
            data: inquiry
        });
    } catch (error) {
        logger.error(`requestDemoLink Error: ${error.message}`);
        next(error);
    }
};
