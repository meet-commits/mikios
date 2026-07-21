import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import MenuItem from '../models/MenuItem.js';
import Table from '../models/Table.js';
import Subscription from '../models/Subscription.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chefos';

async function run() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Get default owner
        const ownerEmail = 'owner@chefos.com';
        const owner = await User.findOne({ email: ownerEmail });
        if (!owner) {
            console.error('Owner user owner@chefos.com not found. Run seed_user.js first.');
            process.exit(1);
        }

        // 2. Create or update restaurant
        let restaurant = await Restaurant.findOne({ owner: owner._id });
        if (!restaurant) {
            restaurant = await Restaurant.create({
                name: 'MikiOS Bistro',
                owner: owner._id,
                description: 'A culinary journey through smart gastronomy and premium flavours, powered by MikiOS.',
                cuisine: 'International Fusion',
                logo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&auto=format&fit=crop&q=80',
                coverImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80',
                address: {
                    street: '123 Smart Gastronomy Way',
                    city: 'Miki City',
                    state: 'Tech State',
                    zipCode: '90210',
                    country: 'Techland'
                },
                contact: {
                    phone: '+1 555-MIKIOS',
                    email: 'hello@mikiosbistro.com'
                },
                businessHours: [
                    { day: 'Monday', openTime: '09:00', closeTime: '22:00' },
                    { day: 'Tuesday', openTime: '09:00', closeTime: '22:00' },
                    { day: 'Wednesday', openTime: '09:00', closeTime: '22:00' },
                    { day: 'Thursday', openTime: '09:00', closeTime: '22:00' },
                    { day: 'Friday', openTime: '09:00', closeTime: '23:00' },
                    { day: 'Saturday', openTime: '09:00', closeTime: '23:00' },
                    { day: 'Sunday', openTime: '10:00', closeTime: '21:00' }
                ],
                features: {
                    orderingEnabled: true,
                    voiceOrderingEnabled: true,
                    tableQREnabled: true,
                    reviewsEnabled: true,
                    autoConfirmOrders: true,
                    allowStaffReviews: true,
                    inventoryAlerts: true
                },
                currency: 'USD',
                taxRate: 8.25
            });
            console.log('Created restaurant: MikiOS Bistro');
        } else {
            restaurant.name = 'MikiOS Bistro';
            await restaurant.save();
            console.log('Updated existing restaurant name to MikiOS Bistro');
        }

        // 3. Create subscription
        let subscription = await Subscription.findOne({ restaurant: restaurant._id });
        if (!subscription) {
            subscription = await Subscription.create({
                restaurant: restaurant._id,
                plan: {
                    name: 'PREMIUM',
                    displayName: 'Premium Plan',
                    price: 49.00,
                    currency: 'USD',
                    interval: 'month'
                },
                status: 'ACTIVE',
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            });
            console.log('Created premium subscription');
        }

        // Update restaurant with subscription ID
        restaurant.subscription = subscription._id;
        await restaurant.save();

        // Update owner restaurant ID reference
        owner.restaurant = restaurant._id;
        await owner.save();

        // 4. Seed tables
        const existingTablesCount = await Table.countDocuments({ restaurant: restaurant._id });
        if (existingTablesCount === 0) {
            const tablesToCreate = [
                { name: 'Table 1', capacity: 2, location: 'Indoor' },
                { name: 'Table 2', capacity: 4, location: 'Indoor' },
                { name: 'Table 3', capacity: 4, location: 'Outdoor' },
                { name: 'Table 4', capacity: 6, location: 'Indoor' },
                { name: 'VIP Lounge', capacity: 8, location: 'VIP' }
            ];

            for (const tableData of tablesToCreate) {
                await Table.create({
                    restaurant: restaurant._id,
                    ...tableData
                });
            }
            console.log('Seeded tables');
        }

        // 5. Seed Menu Items
        const existingMenuItemsCount = await MenuItem.countDocuments({ restaurant: restaurant._id });
        if (existingMenuItemsCount === 0) {
            const menuItemsToCreate = [
                {
                    name: 'Truffle Garlic Edamame',
                    description: 'Steamed green soy beans tossed in premium white truffle oil, sea salt flakes, and roasted garlic.',
                    category: 'Appetizer',
                    price: 9.50,
                    image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500&auto=format&fit=crop&q=80',
                    dietaryInfo: { isVegetarian: true, isVegan: true, isGlutenFree: true, spiceLevel: 'None' }
                },
                {
                    name: 'Szechuan Calamari',
                    description: 'Crispy flash-fried calamari dust-coated with wild Szechuan peppercorn, served with a chili lime dipping aioli.',
                    category: 'Appetizer',
                    price: 14.00,
                    image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=500&auto=format&fit=crop&q=80',
                    dietaryInfo: { spiceLevel: 'Medium' }
                },
                {
                    name: 'MikiOS Signature Wagyu Burger',
                    description: 'Flame-grilled 200g premium A5 Wagyu beef patty, double melted cheddar, caramelized red onion confit, secret truffle-mayo sauce, inside a toasted house brioche bun. Served with hand-cut rosemary fries.',
                    category: 'Main Course',
                    price: 24.99,
                    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80',
                    dietaryInfo: { spiceLevel: 'None' }
                },
                {
                    name: 'Crispy Skin Salmon & Asparagus',
                    description: 'Pan-seared Atlantic salmon fillet, served over smooth garlic-infused mashed potatoes, buttered local baby asparagus, topped with fresh dill lemon-butter reduction.',
                    category: 'Main Course',
                    price: 27.50,
                    image: 'https://images.unsplash.com/photo-1485921325814-a5341afa7f48?w=500&auto=format&fit=crop&q=80',
                    dietaryInfo: { isGlutenFree: true }
                },
                {
                    name: 'Mediterranean Avocado Quinoa Salad',
                    description: 'Tri-color organic quinoa, fresh cubed Hass avocado, sweet cherry tomatoes, sliced kalamata olives, crunchy Persian cucumbers, imported feta crumbles, tossed in extra-virgin olive oil and wild oregano lemon vinaigrette.',
                    category: 'Salad',
                    price: 15.50,
                    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80',
                    dietaryInfo: { isVegetarian: true, isGlutenFree: true }
                },
                {
                    name: 'Molten Lava Cake with Madagascan Vanilla Ice Cream',
                    description: 'Warm, gooey Belgian dark chocolate cake, with a molten lava center, paired with a scoop of premium Madagascan vanilla bean ice cream.',
                    category: 'Dessert',
                    price: 11.00,
                    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop&q=80',
                    dietaryInfo: { isVegetarian: true }
                },
                {
                    name: 'Passionfruit Mint Cooler',
                    description: 'Muddled fresh sweet passionfruit pulp, dynamic mint leaves, clean lime juice, splash of organic agave, topped with dynamic sparkling water over crushed ice.',
                    category: 'Beverage',
                    price: 6.50,
                    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=80',
                    dietaryInfo: { isVegetarian: true, isVegan: true, isGlutenFree: true }
                }
            ];

            for (const itemData of menuItemsToCreate) {
                await MenuItem.create({
                    restaurant: restaurant._id,
                    ...itemData
                });
            }
            console.log('Seeded menu items');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
}

run();
