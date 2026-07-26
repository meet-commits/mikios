import axios from 'axios';
import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';

// Create a Resend client helper if API key exists
const sendViaResend = async (mailOptions) => {
    try {
        // Resend Free Tier requires 'onboarding@resend.dev' as the from address 
        // unless you have verified your own custom domain.
        const fromAddress = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

        const response = await axios.post('https://api.resend.com/emails', {
            from: fromAddress,
            to: mailOptions.to,
            subject: mailOptions.subject,
            html: mailOptions.html,
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        return { success: true, messageId: response.data.id };
    } catch (error) {
        logger.error(`Resend API Error: ${error.response?.data?.message || error.message}`);
        throw error;
    }
};

// Original SMTP transporter for local/cloud fallback
const transporter = nodemailer.createTransport(
    process.env.EMAIL_HOST
        ? {
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT) : 587,
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            },
            connectionTimeout: 10000,
            greetingTimeout: 5000,
            socketTimeout: 15000
        }
        : {
            service: process.env.EMAIL_SERVICE || 'gmail',
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            },
            connectionTimeout: 10000,
            greetingTimeout: 5000,
            socketTimeout: 15000
        }
);




// Brevo (Sendinblue) client helper (300 free emails/day to ANY recipient without domain)
const sendViaBrevo = async (mailOptions) => {
    try {
        let apiKey = process.env.BREVO_API_KEY ? process.env.BREVO_API_KEY.trim() : '';
        if (apiKey.startsWith('{') && apiKey.includes('xkeysib-')) {
            try {
                const parsed = JSON.parse(apiKey);
                apiKey = parsed.api_key || apiKey;
            } catch (e) {}
        }
        apiKey = apiKey.replace(/^["']|["']$/g, '').trim();

        // Extract valid sender email address (avoid using SMTP username like b358f5001@smtp-brevo.com)
        const rawFrom = process.env.EMAIL_FROM || '';
        const match = rawFrom.match(/<([^>]+)>/);
        let senderEmail = match ? match[1] : (process.env.EMAIL_USER || 'meetzvaghela@gmail.com');
        if (!senderEmail.includes('@') || senderEmail.includes('smtp-brevo.com')) {
            senderEmail = 'meetzvaghela@gmail.com';
        }

        const response = await axios.post('https://api.brevo.com/v3/smtp/email', {
            sender: {
                name: 'mikiOS',
                email: senderEmail
            },
            to: [{ email: mailOptions.to }],
            subject: mailOptions.subject,
            htmlContent: mailOptions.html
        }, {
            headers: {
                'api-key': apiKey,
                'Content-Type': 'application/json'
            }
        });
        return { success: true, messageId: response.data.messageId };
    } catch (error) {
        logger.error(`Brevo API Error: ${error.response?.data?.message || error.message}`);
        throw error;
    }
};



// Helper to determine which service to use
const sendMail = async (options) => {
    // If BREVO_API_KEY is defined, use Brevo (allows 300 free emails/day to ANY recipient without custom domain)
    if (process.env.BREVO_API_KEY) {
        return await sendViaBrevo(options);
    }
    // If RESEND_API_KEY is defined, use Resend
    if (process.env.RESEND_API_KEY) {
        return await sendViaResend(options);
    }
    try {
        return await transporter.sendMail(options);
    } catch (error) {
        if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
            logger.error(`[Email] SMTP port blocked by cloud host (${error.message}). Tip: Set BREVO_API_KEY or RESEND_API_KEY on Render for free HTTPS email delivery.`);
        }
        throw error;
    }
};


// Verify connection status (only for SMTP when EMAIL_USER is present)
if (!process.env.RESEND_API_KEY && process.env.EMAIL_USER && process.env.NODE_ENV !== 'production') {
    transporter.verify((error) => {
        if (error) {
            logger.warn(`[Email] Local SMTP verification notice: ${error.message}`);
        } else {
            logger.info('✅ [Email] SMTP Server is ready');
        }
    });
}


// Send OTP email
export const sendPasswordResetOTP = async (email, otp, userName) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM || `"mikiOS" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Password Reset OTP - mikiOS',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #18181b 0%, #3f3f46 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                        .otp-box { background: white; border: 2px dashed #eab308; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
                        .otp-code { font-size: 32px; font-weight: bold; color: #eab308; letter-spacing: 8px; }
                        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
                        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🔐 Password Reset Request</h1>
                        </div>
                        <div class="content">
                            <p>Hello <strong>${userName}</strong>,</p>
                            <p>We received a request to reset your password. Use the OTP below to proceed:</p>
                            
                            <div class="otp-box">
                                <p style="margin: 0; color: #666; font-size: 14px;">Your OTP Code</p>
                                <div class="otp-code">${otp}</div>
                                <p style="margin: 10px 0 0 0; color: #999; font-size: 12px;">Valid for 10 minutes</p>
                            </div>

                            <div class="warning">
                                <strong>⚠️ Security Notice:</strong><br>
                                • Do not share this OTP with anyone<br>
                                • This code expires in 10 minutes<br>
                                • If you didn't request this, please ignore this email
                            </div>

                            <p>If you need help, contact our support team.</p>
                            <p>Best regards,<br><strong>mikiOS Team</strong></p>
                        </div>
                        <div class="footer">
                            <p>© ${new Date().getFullYear()} mikiOS. All rights reserved.</p>
                            <p>This is an automated email, please do not reply.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `Hello ${userName},\n\nYour password reset OTP is: ${otp}\n\nThis code is valid for 10 minutes.\n\nIf you didn't request this, please ignore this email.\n\nBest regards,\nmikiOS Team`
        };

        const info = await sendMail(mailOptions);
        logger.info(`Password reset email sent: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        logger.error(`Email sending error: ${error.message}`);

        if (process.env.NODE_ENV === 'development') {
            logger.warn('⚠️  EMAIL FAILED (Using Dev Fallback)');
            logger.warn(`📧 To: ${email}`);
            logger.warn(`🔑 OTP: ${otp}`);
            return { success: true, messageId: 'dev-fallback' };
        }

        throw error;
    }
};

// Send Email Verification
export const sendVerificationEmail = async (email, token, userName) => {
    try {
        const verificationUrl = `${process.env.CLIENT_URL || 'https://mikios.vercel.app'}/verify-email?token=${token}`;


        const mailOptions = {
            from: process.env.EMAIL_FROM || `"mikiOS" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Verify Your Email - mikiOS',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #18181b 0%, #3f3f46 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; text-align: center; }
                        .button { display: inline-block; padding: 15px 30px; background-color: #eab308; color: #000; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
                        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>📧 Verify Your Email</h1>
                        </div>
                        <div class="content">
                            <p>Hello <strong>${userName}</strong>,</p>
                            <p>Thank you for signing up with mikiOS! To complete your registration and start managing your restaurant, please verify your email address by clicking the button below:</p>
                            
                            <a href="${verificationUrl}" class="button">Verify Email Address</a>

                            <p>Or copy and paste this link into your browser:</p>
                            <p style="word-break: break-all; color: #6366f1;">${verificationUrl}</p>

                            <p>This link will expire in 24 hours.</p>
                            <p>Best regards,<br><strong>mikiOS Team</strong></p>
                        </div>
                        <div class="footer">
                            <p>© ${new Date().getFullYear()} mikiOS. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `Hello ${userName},\n\nPlease verify your email address by clicking this link: ${verificationUrl}\n\nBest regards,\nmikiOS Team`
        };

        const info = await sendMail(mailOptions);
        logger.info(`Verification email sent: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        const errorMsg = error.response?.data?.message || error.message;
        logger.error(`Verification email error: ${errorMsg}`);

        if (error.response?.status === 403 || errorMsg.includes('testing emails')) {
            logger.warn(`⚠️ [Resend Limit] To send emails to ${email}, verify a custom domain at resend.com/domains or test with meetzvaghela@gmail.com.`);
        }

        if (process.env.NODE_ENV === 'development') {
            logger.warn('⚠️ VERIFICATION EMAIL FAILED (Using Dev Fallback)');
            logger.warn(`📧 To: ${email}`);
            logger.warn(`🔗 Link: ${process.env.CLIENT_URL || 'https://mikios.vercel.app'}/verify-email?token=${token}`);
            return { success: true, messageId: 'dev-fallback' };
        }

        throw error;
    }
};

// Send welcome email
export const sendWelcomeEmail = async (email, userName) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM || `"mikiOS" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Welcome to mikiOS! 🎉',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #18181b 0%, #3f3f46 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🎉 Welcome to mikiOS!</h1>
                        </div>
                        <div class="content">
                            <p>Hello <strong>${userName}</strong>,</p>
                            <p>Your email has been successfully verified! Welcome to mikiOS - your all-in-one smart restaurant management platform.</p>
                            <p>You can now log in and start configuring your digital restaurant, managing your menu, and tracking orders in real-time.</p>
                            <p>If you have any questions, feel free to reach out to our support team.</p>
                            <p>Best regards,<br><strong>mikiOS Team</strong></p>
                        </div>
                        <div class="footer">
                            <p>© ${new Date().getFullYear()} mikiOS. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        await sendMail(mailOptions);
    } catch (error) {
        logger.error(`Welcome email error: ${error.message}`);
    }
};
