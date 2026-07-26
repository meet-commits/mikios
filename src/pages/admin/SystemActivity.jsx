import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, RefreshCw, CheckCircle, AlertTriangle, Info, Clock } from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/dashboard/DashboardLayout';

const SystemActivity = () => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchActivities = async () => {
        try {
            setLoading(true);
            const res = await api.get('/admin/activities');
            if (res.data?.success) {
                setActivities(res.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch system activities:', error);
            toast.error('Failed to load audit logs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivities();
    }, []);

    return (
        <DashboardLayout>
            <div className="p-6 space-y-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/40 pb-6">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
                                System Audit & Activity Logs
                            </h1>
                            <span className="px-3 py-1 text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full flex items-center gap-1.5">
                                <Activity className="w-3.5 h-3.5" /> LIVE STREAM
                            </span>
                        </div>
                        <p className="text-muted-foreground text-sm mt-1">
                            Real-time platform activity log, registration events, and audit history.
                        </p>
                    </div>

                    <button
                        onClick={fetchActivities}
                        className="px-4 py-2 bg-secondary/80 hover:bg-secondary text-foreground text-sm font-medium rounded-xl border border-border/50 flex items-center gap-2"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                    </button>
                </div>

                {/* Audit Stream Panel */}
                <div className="p-6 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl space-y-4 shadow-lg">
                    {loading ? (
                        <div className="py-12 text-center text-muted-foreground">Loading audit logs...</div>
                    ) : activities.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground">No recent system events logged.</div>
                    ) : (
                        <div className="divide-y divide-border/30">
                            {activities.map((act) => (
                                <motion.div
                                    key={act.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="py-4 flex items-start gap-4 hover:bg-muted/20 px-3 rounded-xl transition-colors"
                                >
                                    <div className={`p-2.5 rounded-xl mt-0.5 border ${
                                        act.severity === 'success' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                                        act.severity === 'warning' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                                        'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                    }`}>
                                        {act.severity === 'success' ? <CheckCircle className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex justify-between items-center">
                                            <h4 className="text-sm font-bold text-foreground">{act.title}</h4>
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5" />
                                                {new Date(act.timestamp).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">{act.description}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default SystemActivity;
