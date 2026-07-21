import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sparkles, Zap, ArrowRight, ShieldCheck, CreditCard, MessageCircle, X, BarChart3, Table, Store, MessageSquare, Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import Sidebar from '../../components/dashboard/Sidebar';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const Subscription = () => {
    const { user, fetchMe } = useAuth();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [subscriptionData, setSubscriptionData] = useState(null);

    // Fetch live subscription status
    useEffect(() => {
        const fetchSubscription = async () => {
            try {
                const response = await api.get('/subscriptions/status');
                if (response.data.success) {
                    setSubscriptionData(response.data.data);
                }
            } catch (error) {
                console.error('Failed to fetch subscription:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSubscription();

        // Check for cancellation or success query params
        const query = new URLSearchParams(window.location.search);
        if (query.get('success')) {
            toast.success('Subscription updated successfully! Welcome to Premium.');
        }
        if (query.get('canceled')) {
            toast.error('Subscription update canceled.');
        }
    }, []);

    const isPremium = subscriptionData?.isPremium;
    const daysRemaining = subscriptionData?.daysRemaining || 0;

    // Format renewal date
    const renewalDate = subscriptionData?.currentPeriodEnd
        ? new Date(subscriptionData.currentPeriodEnd).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        })
        : 'N/A';

    const handleUpgrade = async () => {
        setProcessing(true);
        try {
            const response = await api.post('/subscriptions/create-checkout', {
                planId: 'PREMIUM',
                interval: 'month'
            });

            if (response.data.success && response.data.url) {
                window.location.href = response.data.url;
            }
        } catch (error) {
            console.error('Upgrade failed:', error);
            toast.error(error.response?.data?.message || 'Failed to initiate upgrade');
            setProcessing(false);
        }
    };

    const handleManageBilling = async () => {
        setProcessing(true);
        try {
            const response = await api.get('/subscriptions/portal');
            if (response.data.success && response.data.url) {
                window.location.href = response.data.url;
            }
        } catch (error) {
            console.error('Portal failed:', error);
            toast.error('Failed to access billing portal');
            setProcessing(false);
        }
    };

    const handleSync = async () => {
        setProcessing(true);
        const toastId = toast.loading('Syncing subscription status...');
        try {
            const response = await api.post('/subscriptions/sync');
            if (response.data.success) {
                toast.success('Subscription synced successfully!', { id: toastId });

                // Refresh local component data
                const statusRes = await api.get('/subscriptions/status');
                if (statusRes.data.success) {
                    setSubscriptionData(statusRes.data.data);
                }

                // IMPORTANT: Refresh global user state to unlock features immediately
                await fetchMe();

            } else {
                toast.error(response.data.message || 'Sync failed', { id: toastId });
            }
        } catch (error) {
            console.error('Sync failed:', error);
            toast.error('Failed to sync subscription', { id: toastId });
        } finally {
            setProcessing(false);
        }
    };

    const features = [
        { name: "Unlimited Tables & Menus", premium: true, icon: Table },
        { name: "Chef AI Assistant", premium: true, icon: Sparkles },
        { name: "Live Ordering System", premium: true, icon: Zap },
        { name: "Advanced Analytics", premium: true, icon: BarChart3 },
        { name: "Inventory Engine", premium: true, icon: Store },
        { name: "Service Request Hub", premium: true, icon: MessageSquare },
    ];

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-background text-foreground selection:bg-primary/30">
            <Sidebar open={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <main className="flex-1 lg:pl-0 overflow-x-hidden">
                <div className="p-4 md:p-8 max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <h1 className="text-4xl font-black tracking-tight mb-2 italic uppercase">Billing & Plan</h1>
                            <p className="text-muted-foreground font-medium">Powering your kitchen with professional-grade tools.</p>
                        </motion.div>

                        <div className="flex gap-4">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleSync}
                                disabled={processing}
                                className="bg-card border-2 border-border p-3 rounded-2xl text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors shadow-sm"
                                title="Sync Subscription Status"
                            >
                                <RefreshCw size={20} className={cn(processing && "animate-spin")} />
                            </motion.button>

                            {isPremium && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-emerald-500/10 border-2 border-emerald-500/20 px-6 py-3 rounded-2xl flex items-center gap-4"
                                >
                                    <div className="text-right">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-emerald-500/60">Subscription Life</div>
                                        <div className="text-xl font-black text-emerald-500">{daysRemaining} Days Left</div>
                                    </div>
                                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-inner">
                                        <ShieldCheck size={24} strokeWidth={2.5} />
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                        {/* Status Column */}
                        <div className="xl:col-span-4 space-y-6">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={cn(
                                    "relative overflow-hidden rounded-[2.5rem] border-4 p-8 shadow-2xl transition-all duration-500",
                                    isPremium
                                        ? "border-primary bg-card/50 backdrop-blur-xl"
                                        : "border-border bg-card"
                                )}
                            >
                                {isPremium && (
                                    <div className="absolute top-0 right-0 p-6 opacity-10">
                                        <Sparkles size={80} className="text-primary" />
                                    </div>
                                )}

                                <div className="relative z-10">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-6">Current Tier</h3>

                                    <div className="flex items-center gap-5 mb-8">
                                        <div className={cn(
                                            "w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-transform hover:scale-110 duration-300",
                                            isPremium ? "bg-primary text-primary-foreground shadow-primary/20" : "bg-muted text-muted-foreground"
                                        )}>
                                            {isPremium ? <Sparkles size={32} strokeWidth={2.5} /> : <Zap size={32} />}
                                        </div>
                                        <div>
                                            <div className="text-3xl font-black tracking-tighter truncate">{isPremium ? 'PREMIUM' : 'FREE'}</div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={cn(
                                                    "w-2 h-2 rounded-full animate-pulse",
                                                    isPremium ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,1)]" : "bg-orange-500"
                                                )} />
                                                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                                                    {isPremium ? 'Active Plan' : 'Limited Access'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-6 border-t border-border/50 mb-8">
                                        <div className="flex justify-between items-center bg-muted/20 p-4 rounded-2xl border border-border/30 group hover:border-primary/30 transition-colors">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Renewal Date</span>
                                            <span className="text-sm font-bold text-foreground">{renewalDate}</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-muted/20 p-4 rounded-2xl border border-border/30 group hover:border-primary/30 transition-colors">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Monthly Billed</span>
                                            <span className="text-sm font-bold text-foreground">{isPremium ? '₹2,499' : '₹0'}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        {isPremium ? (
                                            <button
                                                onClick={handleManageBilling}
                                                disabled={processing}
                                                className="btn-primary w-full h-14 rounded-2xl text-[11px] font-black tracking-[0.15em] uppercase flex items-center justify-center gap-3 group shadow-xl shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {processing ? <Loader2 className="animate-spin" /> : <CreditCard size={18} />}
                                                Manage Subscription
                                                {!processing && <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={handleUpgrade}
                                                disabled={processing}
                                                className="btn-primary w-full h-14 rounded-2xl text-[11px] font-black tracking-[0.15em] uppercase flex items-center justify-center gap-3 group shadow-xl shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {processing ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                                                Upgrade to Premium
                                                {!processing && <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />}
                                            </button>
                                        )}
                                        <div className="flex items-center justify-center gap-2 mt-4 text-muted-foreground">
                                            <ShieldCheck size={14} className="text-emerald-500" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">
                                                {isPremium ? 'Secure Stripe Portal' : 'Secure Checkout by Stripe'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Business Insight Card */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2 }}
                                className="bg-gradient-to-br from-primary/10 to-transparent border-2 border-primary/20 rounded-[2.5rem] p-8 relative overflow-hidden group transition-all hover:scale-[1.02]"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-10 translate-x-4">
                                    <BarChart3 size={120} className="text-primary" strokeWidth={1} />
                                </div>
                                <div className="relative z-10 flex flex-col items-center text-center">
                                    <h4 className="text-[10px] font-black tracking-[0.2em] text-primary uppercase mb-3">Kitchen Metric</h4>
                                    <p className="text-2xl font-black text-foreground mb-4 leading-tight italic">AI RESTAURANTS SEE 30% FASTER TURNOVER</p>
                                    <p className="text-xs font-medium text-muted-foreground/80 leading-relaxed italic">"Premium users access advanced analytics to optimize peak hours."</p>
                                </div>
                            </motion.div>
                        </div>

                        {/* Features Column */}
                        <div className="xl:col-span-8 space-y-8">
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-card border-4 border-border rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />

                                <div className="relative z-10">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                                        <div>
                                            <h3 className="text-3xl font-black tracking-tighter mb-2 italic uppercase">Premium Perks Dashboard</h3>
                                            <p className="text-muted-foreground font-medium text-sm">Professional tools configured for your restaurant.</p>
                                        </div>
                                        {isPremium && (
                                            <div className="flex gap-2 bg-muted/30 p-1.5 rounded-2xl border border-border/50">
                                                <div className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">Active</div>
                                                <div className="px-4 py-2 text-muted-foreground rounded-xl text-[10px] font-black uppercase tracking-widest">History</div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {features.map((feature, i) => (
                                            <motion.div
                                                key={i}
                                                whileHover={{ y: -5 }}
                                                className={cn(
                                                    "flex items-center gap-5 p-6 rounded-[2rem] border-2 transition-all group",
                                                    isPremium
                                                        ? "bg-muted/10 border-border/50 hover:border-primary/40 hover:bg-card shadow-sm"
                                                        : "bg-muted/5 border-dashed border-border/30 opacity-60"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform",
                                                    isPremium ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                                                )}>
                                                    <feature.icon size={26} strokeWidth={2.5} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <span className={cn(
                                                            "text-[10px] font-black uppercase tracking-widest",
                                                            isPremium ? "text-primary" : "text-muted-foreground underline decoration-1"
                                                        )}>
                                                            {feature.name}
                                                        </span>
                                                        {isPremium && <Check size={12} className="text-emerald-500" strokeWidth={3} />}
                                                    </div>
                                                    <p className="text-[10px] text-muted-foreground font-medium">
                                                        {isPremium ? 'FULLY CONFIGURED' : 'PRO VERSION REQUIRED'}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div >
            </main >
        </div >
    );
};

export default Subscription;
