import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Users, Store, ShoppingCart, DollarSign, Sparkles,
    Shield, ArrowUpRight, RefreshCw, Activity, CheckCircle, AlertTriangle
} from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/dashboard/DashboardLayout';

const SuperAdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchDashboardData = async () => {
        try {
            setRefreshing(true);
            const [statsRes, actRes] = await Promise.all([
                api.get('/admin/stats'),
                api.get('/admin/activities')
            ]);

            if (statsRes.data?.success) {
                setStats(statsRes.data.data);
            }
            if (actRes.data?.success) {
                setActivities(actRes.data.data);
            }
        } catch (error) {
            console.error('Failed to load super admin stats:', error);
            toast.error('Failed to load system stats');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const statCards = [
        {
            title: 'Total Users',
            value: stats?.totalUsers || 0,
            subtext: `${stats?.rolesCount?.ADMIN || 0} Admins, ${stats?.rolesCount?.OWNER || 0} Owners`,
            icon: Users,
            color: 'from-blue-500/20 to-indigo-500/20 border-blue-500/30 text-blue-400'
        },
        {
            title: 'Active Restaurants',
            value: `${stats?.activeRestaurants || 0} / ${stats?.totalRestaurants || 0}`,
            subtext: 'Platform Total',
            icon: Store,
            color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400'
        },
        {
            title: 'Active Subscriptions',
            value: stats?.activeSubscriptions || 0,
            subtext: 'Pro & Premium Plans',
            icon: Sparkles,
            color: 'from-amber-500/20 to-yellow-500/20 border-amber-500/30 text-amber-400'
        },
        {
            title: 'Total Platform Revenue',
            value: `₹${(stats?.totalRevenue || 0).toLocaleString('en-IN')}`,
            subtext: `${stats?.totalOrders || 0} Processed Orders`,
            icon: DollarSign,
            color: 'from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-400'
        }
    ];

    return (
        <DashboardLayout>
            <div className="p-6 space-y-8 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/40 pb-6">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
                                Super Admin Control Center
                            </h1>
                            <span className="px-3 py-1 text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full flex items-center gap-1.5">
                                <Shield className="w-3.5 h-3.5" /> SYSTEM OVERVIEW
                            </span>
                        </div>
                        <p className="text-muted-foreground text-sm mt-1">
                            Platform-wide management, subscription controls, and system health metrics.
                        </p>
                    </div>

                    <button
                        onClick={fetchDashboardData}
                        disabled={refreshing}
                        className="px-4 py-2 bg-secondary/80 hover:bg-secondary text-foreground text-sm font-medium rounded-xl border border-border/50 flex items-center gap-2 transition-all hover:scale-[1.02]"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh Data
                    </button>
                </div>

                {/* Stat Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {statCards.map((card, idx) => (
                        <motion.div
                            key={card.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: idx * 0.1 }}
                            className={`p-6 rounded-2xl bg-gradient-to-br ${card.color} border backdrop-blur-xl shadow-lg relative overflow-hidden group`}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        {card.title}
                                    </p>
                                    <p className="text-3xl font-extrabold mt-2 text-foreground">
                                        {loading ? '...' : card.value}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {card.subtext}
                                    </p>
                                </div>
                                <div className="p-3 rounded-xl bg-background/50 border border-white/10 shadow-inner">
                                    <card.icon className="w-6 h-6" />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Activity & System Status */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Activity Feed */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
                                <Activity className="w-5 h-5 text-amber-400" /> Live Platform Activity
                            </h2>
                        </div>

                        <div className="p-5 rounded-2xl bg-card/60 border border-border/40 backdrop-blur-xl space-y-4 shadow-sm">
                            {loading ? (
                                <div className="p-8 text-center text-muted-foreground">Loading activity feed...</div>
                            ) : activities.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground">No recent system events</div>
                            ) : (
                                <div className="divide-y divide-border/30">
                                    {activities.map((act) => (
                                        <div key={act.id} className="py-3.5 flex items-start gap-4 hover:bg-muted/20 px-2 rounded-xl transition-colors">
                                            <div className={`p-2 rounded-xl mt-0.5 ${
                                                act.severity === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
                                                act.severity === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                                                'bg-blue-500/20 text-blue-400'
                                            }`}>
                                                {act.severity === 'success' ? <CheckCircle className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-center">
                                                    <p className="text-sm font-semibold text-foreground">{act.title}</p>
                                                    <span className="text-[11px] text-muted-foreground">
                                                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-0.5">{act.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Role Distribution Panel */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
                            <Users className="w-5 h-5 text-blue-400" /> Role Breakdown
                        </h2>

                        <div className="p-5 rounded-2xl bg-card/60 border border-border/40 backdrop-blur-xl space-y-4 shadow-sm">
                            {stats?.rolesCount ? (
                                Object.entries(stats.rolesCount).map(([roleName, count]) => (
                                    <div key={roleName} className="space-y-1.5">
                                        <div className="flex justify-between text-xs font-semibold">
                                            <span className="text-muted-foreground">{roleName}</span>
                                            <span className="text-foreground">{count} users</span>
                                        </div>
                                        <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${
                                                    roleName === 'ADMIN' ? 'bg-amber-500' :
                                                    roleName === 'OWNER' ? 'bg-blue-500' :
                                                    roleName === 'CHEF' ? 'bg-emerald-500' :
                                                    roleName === 'WAITER' ? 'bg-purple-500' : 'bg-gray-400'
                                                }`}
                                                style={{ width: `${Math.min(100, (count / (stats.totalUsers || 1)) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-6 text-center text-muted-foreground">Loading role distribution...</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default SuperAdminDashboard;
