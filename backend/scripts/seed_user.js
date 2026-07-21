import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chefos';

async function run() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Check if there are any users
        const users = await User.find({});
        console.log(`Found ${users.length} existing users.`);

        if (users.length > 0) {
            console.log('Existing users:');
            users.forEach(u => {
                console.log(`- Email: ${u.email}, Role: ${u.role}, Verified: ${u.emailVerified}`);
            });
        }

        // Check if our default owner user exists
        const defaultEmail = 'owner@chefos.com';
        let defaultUser = await User.findOne({ email: defaultEmail });
        
        if (!defaultUser) {
            defaultUser = await User.create({
                name: 'Default Owner',
                email: defaultEmail,
                password: 'password123',
                role: 'OWNER',
                emailVerified: true,
                isActive: true
            });
            console.log(`Created default user: ${defaultEmail} with password: password123`);
        } else {
            console.log(`Default user ${defaultEmail} already exists.`);
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
}

run();
