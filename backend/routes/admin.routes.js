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
    getSystemActivities,
    getUserSessions,
    logoutUserSession,
    toggleSessionSuspend,
    getInquiries,
    updateInquiryStatus,
    deleteInquiry
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

// Device Session & IP Activity Management
router.get('/users/:id/sessions', getUserSessions);
router.post('/users/:id/sessions/logout', logoutUserSession);
router.patch('/users/:id/sessions/suspend', toggleSessionSuspend);

// Contact & Demo Inquiries Management
router.get('/inquiries', getInquiries);
router.patch('/inquiries/:id', updateInquiryStatus);
router.delete('/inquiries/:id', deleteInquiry);

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
