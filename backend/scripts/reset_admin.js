import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

async function run() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const email = 'vagh1747@gmail.com';
        let user = await User.findOne({ email });

        if (!user) {
            console.error(`User with email ${email} not found!`);
            process.exit(1);
        }

        user.password = 'admin123';
        user.role = 'ADMIN';
        user.isActive = true;
        user.emailVerified = true;

        await user.save();

        console.log(`\nSUCCESS! User ${email} password reset to: admin123 and role set to: ADMIN`);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

run();
