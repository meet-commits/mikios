import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, Calendar, Zap, AlertCircle, CheckCircle, Clock,
    X, RefreshCw, Shield, ArrowUpRight, Ban, Play
} from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/dashboard/DashboardLayout';

const SubscriptionManagement = () => {
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modals state
    const [selectedSub, setSelectedSub] = useState(null);
    const [modalMode, setModalMode] = useState(null); // 'extend' | 'tier'
    const [daysToAdd, setDaysToAdd] = useState(30);
    const [targetPlan, setTargetPlan] = useState('PREMIUM');

    const fetchSubscriptions = async () => {
        try {
            setLoading(true);
            const res = await api.get('/admin/subscriptions');
            if (res.data?.success) {
                setSubscriptions(res.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch subscriptions:', error);
            toast.error('Failed to load subscription records');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubscriptions();
    }, []);

    const handleManageSubscription = async (payload) => {
        try {
            const res = await api.post('/admin/subscriptions/manage', payload);
            if (res.data?.success) {
                toast.success(res.data.message || 'Subscription updated');
                setSelectedSub(null);
                setModalMode(null);
                fetchSubscriptions();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Action failed');
        }
    };

    return (
        <DashboardLayout>
            <div className="p-6 space-y-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/40 pb-6">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent">
                                Subscription Controls
                            </h1>
                            <span className="px-3 py-1 text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5" /> BILLING OVERRIDE
                            </span>
                        </div>
                        <p className="text-muted-foreground text-sm mt-1">
                            Extend subscription validity, change plan tiers, or manage suspension states for any restaurant.
                        </p>
                    </div>

                    <button
                        onClick={fetchSubscriptions}
                        className="px-4 py-2 bg-secondary/80 hover:bg-secondary text-foreground text-sm font-medium rounded-xl border border-border/50 flex items-center gap-2"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                    </button>
                </div>

                {/* Subscriptions Table */}
                <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl overflow-hidden shadow-lg">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-muted/40 text-muted-foreground uppercase text-[11px] tracking-wider font-semibold border-b border-border/40">
                                <tr>
                                    <th className="py-3.5 px-6">Restaurant</th>
                                    <th className="py-3.5 px-6">Owner</th>
                                    <th className="py-3.5 px-6">Plan Tier</th>
                                    <th className="py-3.5 px-6">Status</th>
                                    <th className="py-3.5 px-6">Period End</th>
                                    <th className="py-3.5 px-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30">
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="py-12 text-center text-muted-foreground">
                                            Loading subscriptions...
                                        </td>
                                    </tr>
                                ) : subscriptions.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="py-12 text-center text-muted-foreground">
                                            No active subscription records found.
                                        </td>
                                    </tr>
                                ) : (
                                    subscriptions.map((sub) => {
                                        const isExpired = new Date(sub.currentPeriodEnd) < new Date();
                                        return (
                                            <tr key={sub._id} className="hover:bg-muted/20 transition-colors">
                                                <td className="py-4 px-6 font-semibold text-foreground">
                                                    {sub.restaurant?.name || 'Unknown Restaurant'}
                                                </td>
                                                <td className="py-4 px-6 text-xs text-muted-foreground">
                                                    <div>
                                                        <p className="text-foreground font-medium">{sub.restaurant?.owner?.name || 'N/A'}</p>
                                                        <p>{sub.restaurant?.owner?.email}</p>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className={`px-2.5 py-1 text-xs font-extrabold rounded-lg border ${
                                                        sub.plan?.name === 'PREMIUM'
                                                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                                            : 'bg-gray-500/20 text-gray-300 border-gray-500/40'
                                                    }`}>
                                                        {sub.plan?.displayName || sub.plan?.name || 'FREE'}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border inline-flex items-center gap-1 ${
                                                        sub.status === 'ACTIVE' && !isExpired
                                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                                            : 'bg-red-500/10 text-red-400 border-red-500/30'
                                                    }`}>
                                                        {sub.status === 'ACTIVE' && !isExpired ? 'ACTIVE' : (isExpired ? 'EXPIRED' : sub.status)}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-xs font-medium text-muted-foreground">
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                                        {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-right space-x-2">
                                                    <button
                                                        onClick={() => { setSelectedSub(sub); setModalMode('extend'); }}
                                                        className="px-3 py-1 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-xs font-semibold rounded-lg border border-amber-500/30 transition-colors"
                                                    >
                                                        + Extend Days
                                                    </button>
                                                    <button
                                                        onClick={() => { setSelectedSub(sub); setModalMode('tier'); setTargetPlan(sub.plan?.name || 'PREMIUM'); }}
                                                        className="px-3 py-1 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 text-xs font-semibold rounded-lg border border-blue-500/30 transition-colors"
                                                    >
                                                        Change Tier
                                                    </button>
                                                    {sub.status === 'ACTIVE' ? (
                                                        <button
                                                            onClick={() => handleManageSubscription({ subscriptionId: sub._id, action: 'suspend' })}
                                                            className="px-2.5 py-1 bg-red-500/20 text-red-300 hover:bg-red-500/30 text-xs font-semibold rounded-lg border border-red-500/30 transition-colors"
                                                            title="Suspend Subscription"
                                                        >
                                                            Suspend
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleManageSubscription({ subscriptionId: sub._id, action: 'activate' })}
                                                            className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-xs font-semibold rounded-lg border border-emerald-500/30 transition-colors"
                                                            title="Activate Subscription"
                                                        >
                                                            Activate
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Extend Modal */}
                <AnimatePresence>
                    {selectedSub && modalMode === 'extend' && (
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-card border border-border/50 p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-5"
                            >
                                <div className="flex justify-between items-center border-b border-border/40 pb-4">
                                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-amber-400" /> Extend Subscription Duration
                                    </h3>
                                    <button onClick={() => setSelectedSub(null)} className="p-1 text-muted-foreground hover:text-foreground">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div>
                                    <p className="text-xs text-muted-foreground">Target Restaurant:</p>
                                    <p className="text-sm font-semibold text-foreground">{selectedSub.restaurant?.name}</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-muted-foreground">Days to Add:</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {[30, 90, 180, 365].map((d) => (
                                            <button
                                                key={d}
                                                type="button"
                                                onClick={() => setDaysToAdd(d)}
                                                className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                                                    daysToAdd === d
                                                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                                                        : 'bg-background border-border/60 text-muted-foreground hover:text-foreground'
                                                }`}
                                            >
                                                +{d} Days
                                            </button>
                                        ))}
                                    </div>
                                    <input
                                        type="number"
                                        value={daysToAdd}
                                        onChange={(e) => setDaysToAdd(e.target.value)}
                                        className="w-full mt-2 px-4 py-2 bg-background border border-border/60 rounded-xl text-sm font-medium focus:outline-none focus:border-primary"
                                        placeholder="Or enter custom number of days"
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-3">
                                    <button
                                        onClick={() => setSelectedSub(null)}
                                        className="px-4 py-2 bg-secondary text-muted-foreground text-sm font-medium rounded-xl hover:text-foreground"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => handleManageSubscription({
                                            subscriptionId: selectedSub._id,
                                            action: 'extend',
                                            daysToAdd
                                        })}
                                        className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-black text-sm font-bold rounded-xl shadow-lg"
                                    >
                                        Add {daysToAdd} Days
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}

                    {/* Change Tier Modal */}
                    {selectedSub && modalMode === 'tier' && (
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-card border border-border/50 p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-5"
                            >
                                <div className="flex justify-between items-center border-b border-border/40 pb-4">
                                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-blue-400" /> Change Subscription Plan Tier
                                    </h3>
                                    <button onClick={() => setSelectedSub(null)} className="p-1 text-muted-foreground hover:text-foreground">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div>
                                    <p className="text-xs text-muted-foreground">Target Restaurant:</p>
                                    <p className="text-sm font-semibold text-foreground">{selectedSub.restaurant?.name}</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-muted-foreground">Select Plan Tier:</label>
                                    <select
                                        value={targetPlan}
                                        onChange={(e) => setTargetPlan(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-background border border-border/60 rounded-xl text-sm font-medium focus:outline-none focus:border-primary"
                                    >
                                        <option value="PREMIUM">PREMIUM (Pro Restaurant Plan - Full Access)</option>
                                        <option value="FREE">FREE (Limited Features Tier)</option>
                                    </select>
                                </div>

                                <div className="flex justify-end gap-3 pt-3">
                                    <button
                                        onClick={() => setSelectedSub(null)}
                                        className="px-4 py-2 bg-secondary text-muted-foreground text-sm font-medium rounded-xl hover:text-foreground"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => handleManageSubscription({
                                            subscriptionId: selectedSub._id,
                                            action: 'changePlan',
                                            planName: targetPlan
                                        })}
                                        className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold rounded-xl shadow-lg"
                                    >
                                        Save Tier
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </DashboardLayout>
    );
};

export default SubscriptionManagement;
