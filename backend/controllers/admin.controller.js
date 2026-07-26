import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import Subscription from '../models/Subscription.js';
import Order from '../models/Order.js';
import MenuItem from '../models/MenuItem.js';
import Table from '../models/Table.js';
import logger from '../utils/logger.js';

// @desc    Get all users with search & filters
// @route   GET /api/admin/users
// @access  Private (ADMIN)
export const getUsers = async (req, res, next) => {
    try {
        const { search, role, status, page = 1, limit = 20 } = req.query;

        const query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        if (role && role !== 'ALL') {
            query.role = role;
        }

        if (status === 'active') {
            query.isActive = true;
        } else if (status === 'inactive') {
            query.isActive = false;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [users, total] = await Promise.all([
            User.find(query)
                .populate('restaurant', 'name logo slug')
                .select('-password -refreshToken')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            User.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            data: {
                users,
                pagination: {
                    total,
                    page: parseInt(page),
                    pages: Math.ceil(total / parseInt(limit))
                }
            }
        });
    } catch (error) {
        logger.error(`Admin getUsers error: ${error.message}`);
        next(error);
    }
};

// @desc    Update user role or active status
// @route   PATCH /api/admin/users/:id
// @access  Private (ADMIN)
export const updateUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { role, isActive, emailVerified, permissions } = req.body;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent admin from removing their own admin role
        if (req.user._id.toString() === id && role && role !== 'ADMIN') {
            return res.status(400).json({
                success: false,
                message: 'Cannot demote your own admin account'
            });
        }

        if (role) user.role = role;
        if (typeof isActive === 'boolean') user.isActive = isActive;
        if (typeof emailVerified === 'boolean') user.emailVerified = emailVerified;
        if (Array.isArray(permissions)) user.permissions = permissions;

        await user.save();

        logger.info(`Admin updated user ${user.email}: Role=${user.role}, Active=${user.isActive}, Permissions=${user.permissions?.join(',')}`);

        res.status(200).json({
            success: true,
            message: 'User updated successfully',
            data: user
        });
    } catch (error) {
        logger.error(`Admin updateUser error: ${error.message}`);
        next(error);
    }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (ADMIN)
export const deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (req.user._id.toString() === id) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete your own admin account'
            });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        await User.findByIdAndDelete(id);

        logger.info(`Admin deleted user ${user.email}`);

        res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        logger.error(`Admin deleteUser error: ${error.message}`);
        next(error);
    }
};

// @desc    Get all restaurants with metrics
// @route   GET /api/admin/restaurants
// @access  Private (ADMIN)
export const getRestaurants = async (req, res, next) => {
    try {
        const { search, page = 1, limit = 20 } = req.query;

        const query = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { slug: { $regex: search, $options: 'i' } },
                { city: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [restaurants, total] = await Promise.all([
            Restaurant.find(query)
                .populate('owner', 'name email role')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Restaurant.countDocuments(query)
        ]);

        // Enrich with counts
        const enriched = await Promise.all(restaurants.map(async (rest) => {
            const restId = rest._id;
            const [tablesCount, menuItemsCount, ordersCount] = await Promise.all([
                Table.countDocuments({ restaurant: restId }),
                MenuItem.countDocuments({ restaurant: restId }),
                Order.countDocuments({ restaurant: restId })
            ]);
            return {
                ...rest.toObject(),
                metrics: {
                    tables: tablesCount,
                    menuItems: menuItemsCount,
                    orders: ordersCount
                }
            };
        }));

        res.status(200).json({
            success: true,
            data: {
                restaurants: enriched,
                pagination: {
                    total,
                    page: parseInt(page),
                    pages: Math.ceil(total / parseInt(limit))
                }
            }
        });
    } catch (error) {
        logger.error(`Admin getRestaurants error: ${error.message}`);
        next(error);
    }
};

// @desc    Toggle restaurant status (Activate/Deactivate)
// @route   PATCH /api/admin/restaurants/:id/status
// @access  Private (ADMIN)
export const toggleRestaurantStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        const restaurant = await Restaurant.findById(id);
        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found'
            });
        }

        restaurant.isActive = typeof isActive === 'boolean' ? isActive : !restaurant.isActive;
        await restaurant.save();

        logger.info(`Admin updated restaurant ${restaurant.name} status: Active=${restaurant.isActive}`);

        res.status(200).json({
            success: true,
            message: `Restaurant ${restaurant.isActive ? 'activated' : 'deactivated'} successfully`,
            data: restaurant
        });
    } catch (error) {
        logger.error(`Admin toggleRestaurantStatus error: ${error.message}`);
        next(error);
    }
};

// @desc    Get all subscriptions across the system
// @route   GET /api/admin/subscriptions
// @access  Private (ADMIN)
export const getSubscriptions = async (req, res, next) => {
    try {
        const restaurants = await Restaurant.find({})
            .populate('owner', 'name email')
            .sort({ createdAt: -1 });

        const existingSubscriptions = await Subscription.find({});
        const subMap = new Map();
        existingSubscriptions.forEach(sub => {
            if (sub.restaurant) {
                subMap.set(sub.restaurant.toString(), sub);
            }
        });

        const result = restaurants.map(rest => {
            const existingSub = subMap.get(rest._id.toString());
            if (existingSub) {
                return {
                    ...existingSub.toObject(),
                    restaurant: {
                        _id: rest._id,
                        name: rest.name,
                        slug: rest.slug,
                        owner: rest.owner
                    }
                };
            } else {
                const now = new Date();
                const defaultEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
                return {
                    _id: `temp-${rest._id}`,
                    restaurant: {
                        _id: rest._id,
                        name: rest.name,
                        slug: rest.slug,
                        owner: rest.owner
                    },
                    plan: {
                        name: 'FREE',
                        displayName: 'Free Tier',
                        price: 0,
                        currency: 'INR',
                        interval: 'month'
                    },
                    status: 'ACTIVE',
                    currentPeriodStart: now,
                    currentPeriodEnd: defaultEnd,
                    isDefaultFree: true
                };
            }
        });

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        logger.error(`Admin getSubscriptions error: ${error.message}`);
        next(error);
    }
};

// @desc    Manage subscription (extend, suspend, change plan tier)
// @route   POST /api/admin/subscriptions/manage
// @access  Private (ADMIN)
export const manageSubscription = async (req, res, next) => {
    try {
        let { subscriptionId, restaurantId, action, daysToAdd, planName, status } = req.body;

        if (subscriptionId && typeof subscriptionId === 'string' && subscriptionId.startsWith('temp-')) {
            restaurantId = subscriptionId.replace('temp-', '');
            subscriptionId = null;
        }

        let sub;
        if (subscriptionId) {
            sub = await Subscription.findById(subscriptionId);
        } else if (restaurantId) {
            sub = await Subscription.findOne({ restaurant: restaurantId });
        }

        if (!sub && restaurantId) {
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + (parseInt(daysToAdd) || 30));

            sub = new Subscription({
                restaurant: restaurantId,
                plan: {
                    name: planName || 'PREMIUM',
                    displayName: planName === 'FREE' ? 'Free Tier' : 'Pro Premium Plan',
                    price: planName === 'FREE' ? 0 : 2999,
                    currency: 'INR',
                    interval: 'month'
                },
                status: status || 'ACTIVE',
                currentPeriodStart: startDate,
                currentPeriodEnd: endDate
            });
        }

        if (!sub) {
            return res.status(404).json({
                success: false,
                message: 'Subscription record or restaurant not found'
            });
        }

        const now = new Date();

        if (action === 'extend') {
            const addDays = parseInt(daysToAdd) || 30;
            const currentEnd = sub.currentPeriodEnd > now ? new Date(sub.currentPeriodEnd) : now;
            currentEnd.setDate(currentEnd.getDate() + addDays);

            sub.currentPeriodEnd = currentEnd;
            sub.status = 'ACTIVE';
        } else if (action === 'changePlan') {
            sub.plan.name = planName || 'PREMIUM';
            sub.plan.displayName = planName === 'FREE' ? 'Free Tier' : 'Pro Premium Plan';
            sub.plan.price = planName === 'FREE' ? 0 : 2999;
            sub.status = 'ACTIVE';
        } else if (action === 'suspend') {
            sub.status = 'CANCELLED';
            sub.canceledAt = now;
        } else if (action === 'activate') {
            sub.status = 'ACTIVE';
            if (sub.currentPeriodEnd < now) {
                const nextMonth = new Date();
                nextMonth.setDate(nextMonth.getDate() + 30);
                sub.currentPeriodEnd = nextMonth;
            }
        } else if (status) {
            sub.status = status;
        }

        await sub.save();

        logger.info(`Admin managed subscription for restaurant ${sub.restaurant}: Action=${action}, Status=${sub.status}`);

        res.status(200).json({
            success: true,
            message: 'Subscription updated successfully',
            data: sub
        });
    } catch (error) {
        logger.error(`Admin manageSubscription error: ${error.message}`);
        next(error);
    }
};

// @desc    Get aggregated platform metrics
// @route   GET /api/admin/stats
// @access  Private (ADMIN)
export const getPlatformStats = async (req, res, next) => {
    try {
        const [
            totalUsers,
            totalRestaurants,
            activeRestaurants,
            totalOrders,
            roleAggregation,
            subscriptionsList,
            revenueAggregation
        ] = await Promise.all([
            User.countDocuments(),
            Restaurant.countDocuments(),
            Restaurant.countDocuments({ isActive: true }),
            Order.countDocuments(),
            User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
            Subscription.find({}),
            Order.aggregate([
                { $match: { paymentStatus: 'PAID' } },
                { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
            ])
        ]);

        const rolesCount = roleAggregation.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
        }, {});

        const activeSubscriptions = subscriptionsList.filter(s => s.status === 'ACTIVE' && s.currentPeriodEnd > new Date()).length;
        const totalRevenue = revenueAggregation[0]?.totalRevenue || 0;

        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                totalRestaurants,
                activeRestaurants,
                totalOrders,
                activeSubscriptions,
                totalRevenue,
                rolesCount
            }
        });
    } catch (error) {
        logger.error(`Admin getPlatformStats error: ${error.message}`);
        next(error);
    }
};

// @desc    Get system activity & audit log
// @route   GET /api/admin/activities
// @access  Private (ADMIN)
export const getSystemActivities = async (req, res, next) => {
    try {
        const [recentUsers, recentOrders, recentRestaurants] = await Promise.all([
            User.find({}).sort({ createdAt: -1 }).limit(10).select('name email role createdAt'),
            Order.find({}).sort({ createdAt: -1 }).limit(10).populate('restaurant', 'name').select('orderNumber totalAmount orderStatus createdAt'),
            Restaurant.find({}).sort({ createdAt: -1 }).limit(5).populate('owner', 'name email').select('name slug createdAt')
        ]);

        const activities = [];

        recentUsers.forEach(u => {
            activities.push({
                id: `user-${u._id}`,
                type: 'USER_REGISTERED',
                title: `New User Registration`,
                description: `${u.name} (${u.email}) joined as ${u.role}`,
                timestamp: u.createdAt,
                severity: 'info'
            });
        });

        recentOrders.forEach(o => {
            activities.push({
                id: `order-${o._id}`,
                type: 'ORDER_PLACED',
                title: `New Order Placed`,
                description: `Order #${o.orderNumber} for ₹${o.totalAmount} at ${o.restaurant?.name || 'Restaurant'}`,
                timestamp: o.createdAt,
                severity: 'success'
            });
        });

        recentRestaurants.forEach(r => {
            activities.push({
                id: `rest-${r._id}`,
                type: 'RESTAURANT_CREATED',
                title: `New Restaurant Created`,
                description: `${r.name} created by ${r.owner?.name || 'Owner'}`,
                timestamp: r.createdAt,
                severity: 'warning'
            });
        });

        // Sort combined activities by timestamp descending
        activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        res.status(200).json({
            success: true,
            data: activities.slice(0, 20)
        });
    } catch (error) {
        logger.error(`Admin getSystemActivities error: ${error.message}`);
        next(error);
    }
};
