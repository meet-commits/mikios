import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import MenuItem from '../models/MenuItem.js';
import Table from '../models/Table.js';
import Subscription from '../models/Subscription.js';
import Order from '../models/Order.js';
import Review from '../models/Review.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chefos';

async function run() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Create or reset Owner Users (both owner@mikios.com and owner@chefos.com to ensure login works for either!)
        await User.deleteMany({ email: { $in: ['owner@mikios.com', 'owner@chefos.com'] } });

        const ownerUser = new User({
            name: 'Meet Vaghela',
            email: 'owner@mikios.com',
            password: 'password123',
            role: 'OWNER',
            emailVerified: true,
            isActive: true
        });
        await ownerUser.save();

        const ownerAliasUser = new User({
            name: 'Meet Vaghela',
            email: 'owner@chefos.com',
            password: 'password123',
            role: 'OWNER',
            emailVerified: true,
            isActive: true
        });
        await ownerAliasUser.save();

        console.log('Owner users created/updated: owner@mikios.com & owner@chefos.com with password: password123');

        // 2. Create Staff Accounts
        await User.deleteMany({ email: { $in: ['waiter@mikios.com', 'chef@mikios.com', 'manager@mikios.com'] } });

        const waiterStaff = new User({
            name: 'Rahul Sharma',
            email: 'waiter@mikios.com',
            password: 'password123',
            role: 'WAITER',
            emailVerified: true,
            isActive: true
        });
        await waiterStaff.save();

        const chefStaff = new User({
            name: 'Chef Amit Patel',
            email: 'chef@mikios.com',
            password: 'password123',
            role: 'CHEF',
            emailVerified: true,
            isActive: true
        });
        await chefStaff.save();

        console.log('Staff accounts created: waiter@mikios.com, chef@mikios.com');

        // 3. Create/Update Restaurant
        let restaurant = await Restaurant.findOne({});
        if (!restaurant) {
            restaurant = new Restaurant({
                name: 'mikiOS Fine Dining',
                owner: ownerUser._id,
                description: 'Curated dining experience curated by Meet Vaghela. Powered by mikiOS.',
                cuisine: 'Indian Fusion & International',
                logo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&auto=format&fit=crop&q=80',
                coverImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80',
                address: {
                    street: '42 Marine Drive',
                    city: 'Mumbai',
                    state: 'Maharashtra',
                    zipCode: '400020',
                    country: 'India'
                },
                contact: {
                    phone: '+91 98765 43210',
                    email: 'meet.vaghela@mikios.com'
                },
                currency: 'INR',
                taxRate: 5.0
            });
        } else {
            restaurant.name = 'mikiOS Fine Dining';
            restaurant.owner = ownerUser._id;
            restaurant.currency = 'INR';
        }
        await restaurant.save();

        ownerUser.restaurant = restaurant._id;
        await ownerUser.save();
        ownerAliasUser.restaurant = restaurant._id;
        await ownerAliasUser.save();
        waiterStaff.restaurant = restaurant._id;
        await waiterStaff.save();
        chefStaff.restaurant = restaurant._id;
        await chefStaff.save();

        // 4. Create Subscription
        let subscription = await Subscription.findOne({ restaurant: restaurant._id });
        if (!subscription) {
            subscription = await Subscription.create({
                restaurant: restaurant._id,
                plan: {
                    name: 'PREMIUM',
                    displayName: 'mikiOS Enterprise Plan',
                    price: 2999,
                    currency: 'INR',
                    interval: 'month'
                },
                status: 'ACTIVE',
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
            });
        }
        restaurant.subscription = subscription._id;
        await restaurant.save();

        // 5. Seed Tables
        await Table.deleteMany({ restaurant: restaurant._id });
        const tablesData = [
            { name: 'Table 1', capacity: 2, location: 'Indoor', status: 'FREE' },
            { name: 'Table 2', capacity: 4, location: 'Indoor', status: 'OCCUPIED' },
            { name: 'Table 3', capacity: 4, location: 'Outdoor', status: 'OCCUPIED' },
            { name: 'Table 4', capacity: 6, location: 'Indoor', status: 'FREE' },
            { name: 'Table 5', capacity: 6, location: 'Outdoor', status: 'CLEANING' },
            { name: 'VIP Suite 1', capacity: 10, location: 'VIP', status: 'RESERVED' }
        ];
        const createdTables = [];
        for (const t of tablesData) {
            const newTable = await Table.create({ restaurant: restaurant._id, ...t });
            createdTables.push(newTable);
        }
        console.log(`Seeded ${createdTables.length} tables.`);

        // 6. Seed Menu Items
        await MenuItem.deleteMany({ restaurant: restaurant._id });
        const menuItemsData = [
            {
                name: 'Paneer Butter Masala',
                description: 'Cottage cheese cubes cooked in rich tomato gravy with real butter and aromatic Indian spices.',
                category: 'Main Course',
                price: 340,
                image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&auto=format&fit=crop&q=80',
                dietaryInfo: { isVegetarian: true, spiceLevel: 'Medium' }
            },
            {
                name: 'Dal Makhani Royale',
                description: 'Slow-cooked black lentils simmered overnight with cream, butter, and mild spices.',
                category: 'Main Course',
                price: 280,
                image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=80',
                dietaryInfo: { isVegetarian: true, spiceLevel: 'Mild' }
            },
            {
                name: 'Truffle Garlic Naan',
                description: 'Traditional tandoori flatbread brushed with garlic butter and white truffle infusion.',
                category: 'Side Dish',
                price: 90,
                image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=80',
                dietaryInfo: { isVegetarian: true, spiceLevel: 'None' }
            },
            {
                name: 'Hyderabadi Dum Biryani',
                description: 'Fragrant basmati rice layered with spiced vegetables, saffron, and crispy onions.',
                category: 'Main Course',
                price: 380,
                image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=80',
                dietaryInfo: { isVegetarian: true, spiceLevel: 'Hot' }
            },
            {
                name: 'Crispy Szechuan Paneer',
                description: 'Wok-tossed cottage cheese with bell peppers, green chilies, and Szechuan sauce.',
                category: 'Appetizer',
                price: 290,
                image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=500&auto=format&fit=crop&q=80',
                dietaryInfo: { isVegetarian: true, spiceLevel: 'Hot' }
            },
            {
                name: 'Gulab Jamun with Ice Cream',
                description: 'Hot fried milk dumplings in cardamom syrup served with premium vanilla ice cream.',
                category: 'Dessert',
                price: 160,
                image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop&q=80',
                dietaryInfo: { isVegetarian: true }
            },
            {
                name: 'Masala Mint Lassi',
                description: 'Refreshing churned yogurt drink flavoured with fresh mint, cumin, and rock salt.',
                category: 'Beverage',
                price: 130,
                image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=80',
                dietaryInfo: { isVegetarian: true }
            }
        ];
        const createdMenuItems = [];
        for (const item of menuItemsData) {
            const newItem = await MenuItem.create({ restaurant: restaurant._id, ...item });
            createdMenuItems.push(newItem);
        }
        console.log(`Seeded ${createdMenuItems.length} menu items.`);

        // 7. Seed Orders
        await Order.deleteMany({ restaurant: restaurant._id });
        const ordersData = [
            {
                table: createdTables[1]._id,
                items: [
                    { menuItem: createdMenuItems[0]._id, name: createdMenuItems[0].name, price: 340, quantity: 2 },
                    { menuItem: createdMenuItems[2]._id, name: createdMenuItems[2].name, price: 90, quantity: 4 }
                ],
                subtotal: 1040,
                tax: 52,
                total: 1092,
                status: 'PREPARING',
                paymentStatus: 'UNPAID',
                customerName: 'Aarav Mehta'
            },
            {
                table: createdTables[2]._id,
                items: [
                    { menuItem: createdMenuItems[3]._id, name: createdMenuItems[3].name, price: 380, quantity: 2 },
                    { menuItem: createdMenuItems[6]._id, name: createdMenuItems[6].name, price: 130, quantity: 2 }
                ],
                subtotal: 1020,
                tax: 51,
                total: 1071,
                status: 'SERVED',
                paymentStatus: 'PAID',
                paymentMethod: 'ONLINE',
                customerName: 'Ananya Sharma'
            },
            {
                table: createdTables[0]._id,
                items: [
                    { menuItem: createdMenuItems[4]._id, name: createdMenuItems[4].name, price: 290, quantity: 1 },
                    { menuItem: createdMenuItems[5]._id, name: createdMenuItems[5].name, price: 160, quantity: 2 }
                ],
                subtotal: 610,
                tax: 30.5,
                total: 640.5,
                status: 'SERVED',
                paymentStatus: 'PAID',
                paymentMethod: 'CASH',
                customerName: 'Karan Vaghela'
            }
        ];

        for (const ord of ordersData) {
            await Order.create({ restaurant: restaurant._id, ...ord });
        }
        console.log(`Seeded orders.`);

        // 8. Seed Reviews
        await Review.deleteMany({ restaurant: restaurant._id });
        const reviewsData = [
            {
                restaurant: restaurant._id,
                rating: 5,
                comment: 'Absolute top class hospitality! Meet Vaghela and the mikiOS team have created a seamless dining setup. The Paneer Butter Masala was extraordinary!',
                customerName: 'Vikramaditya Roy',
                customerEmail: 'vikram@gmail.com',
                ownerReply: {
                    message: 'Thank you Vikramaditya! Glad you enjoyed your meal at mikiOS Fine Dining.',
                    repliedAt: new Date(),
                    repliedBy: ownerUser._id
                }
            },
            {
                restaurant: restaurant._id,
                rating: 5,
                comment: 'The QR ordering powered by mikiOS was super fast! Delicious food and instant service.',
                customerName: 'Sneha Patel',
                customerEmail: 'sneha.patel@gmail.com'
            },
            {
                restaurant: restaurant._id,
                rating: 5,
                comment: 'Modern ambience and amazing Gulab Jamun dessert! Kudos to Meet Vaghela for managing such a flawless system.',
                customerName: 'Rohan Shah',
                customerEmail: 'rohan.shah@gmail.com'
            }
        ];

        for (const rev of reviewsData) {
            await Review.create(rev);
        }
        console.log('Seeded customer reviews.');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
}

run();
