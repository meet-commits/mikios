import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chefos';

async function run() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Delete any existing owner@chefos.com or owner@mikios.com to ensure clean state
        await User.deleteMany({ email: { $in: ['owner@chefos.com', 'owner@mikios.com'] } });
        console.log('Deleted old owner accounts.');

        // Create new user with owner@mikios.com and password123
        const user = new User({
            name: 'meet vaghela', // Setting the name as requested: "meet vaghela"
            email: 'owner@mikios.com',
            password: 'password123',
            role: 'OWNER',
            emailVerified: true,
            isActive: true
        });

        await user.save();
        console.log('Created owner@mikios.com with password: password123');

        // Update restaurant to point to this new owner
        const restaurant = await Restaurant.findOne({});
        if (restaurant) {
            restaurant.owner = user._id;
            await restaurant.save();
            user.restaurant = restaurant._id;
            await user.save();
            console.log(`Updated restaurant ${restaurant.name} owner reference.`);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
}

run();
