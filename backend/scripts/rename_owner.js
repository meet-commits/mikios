import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mikios';

async function run() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Update the owner user's name to "mikiOS"
        const result = await User.updateOne(
            { email: 'owner@mikios.com' },
            { $set: { name: 'mikiOS' } }
        );

        if (result.matchedCount > 0) {
            console.log(`Successfully updated owner user name to mikiOS.`);
        } else {
            console.log(`Owner user owner@mikios.com not found.`);
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
}

run();
