import express from 'express';
import {
    getUsers,
    updateUser,
    deleteUser,
    getRestaurants,
    toggleRestaurantStatus,
    getSubscriptions,
    manageSubscription,
    getPlatformStats,
    getSystemActivities
} from '../controllers/admin.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Guard all admin routes with authentication and ADMIN role requirement
router.use(protect);
router.use(authorize('ADMIN'));

// User Management
router.get('/users', getUsers);
router.patch('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Restaurant Management
router.get('/restaurants', getRestaurants);
router.patch('/restaurants/:id/status', toggleRestaurantStatus);

// Subscription Lifecycle Management
router.get('/subscriptions', getSubscriptions);
router.post('/subscriptions/manage', manageSubscription);

// Platform Overview & Activity Audit
router.get('/stats', getPlatformStats);
router.get('/activities', getSystemActivities);

export default router;
