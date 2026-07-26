import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Store, Search, Filter, CheckCircle2, XCircle, RefreshCw,
    Building, UtensilsCrossed, Table, ShoppingBag
} from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/dashboard/DashboardLayout';

const RestaurantManagement = () => {
    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fetchRestaurants = async () => {
        try {
            setLoading(true);
            const params = {};
            if (search) params.search = search;

            const res = await api.get('/admin/restaurants', { params });
            if (res.data?.success) {
                setRestaurants(res.data.data.restaurants);
            }
        } catch (error) {
            console.error('Failed to fetch restaurants:', error);
            toast.error('Failed to load restaurant list');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchRestaurants();
        }, 300);
        return () => clearTimeout(timeout);
    }, [search]);

    const handleToggleStatus = async (restaurant) => {
        try {
            const updatedStatus = !restaurant.isActive;
            const res = await api.patch(`/admin/restaurants/${restaurant._id}/status`, { isActive: updatedStatus });
            if (res.data?.success) {
                toast.success(`Restaurant ${restaurant.name} ${updatedStatus ? 'activated' : 'suspended'}`);
                fetchRestaurants();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update restaurant status');
        }
    };

    return (
        <DashboardLayout>
            <div className="p-6 space-y-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/40 pb-6">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                                Platform Restaurants
                            </h1>
                            <span className="px-3 py-1 text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full flex items-center gap-1.5">
                                <Store className="w-3.5 h-3.5" /> SYSTEM VENUES
                            </span>
                        </div>
                        <p className="text-muted-foreground text-sm mt-1">
                            Overview of all onboarded restaurants, assigned owners, table counts, and operational status.
                        </p>
                    </div>

                    <button
                        onClick={fetchRestaurants}
                        className="px-4 py-2 bg-secondary/80 hover:bg-secondary text-foreground text-sm font-medium rounded-xl border border-border/50 flex items-center gap-2"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                    </button>
                </div>

                {/* Search */}
                <div className="bg-card/40 p-4 rounded-2xl border border-border/40 backdrop-blur-xl">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search by restaurant name, slug, or city..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-background/60 border border-border/50 rounded-xl text-sm focus:outline-none focus:border-primary"
                        />
                    </div>
                </div>

                {/* Restaurants Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        <div className="col-span-full py-12 text-center text-muted-foreground">
                            Loading restaurants...
                        </div>
                    ) : restaurants.length === 0 ? (
                        <div className="col-span-full py-12 text-center text-muted-foreground">
                            No restaurants found.
                        </div>
                    ) : (
                        restaurants.map((r) => (
                            <motion.div
                                key={r._id}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-6 rounded-2xl bg-card/60 border border-border/40 backdrop-blur-xl shadow-lg flex flex-col justify-between space-y-4 relative overflow-hidden"
                            >
                                <div className="space-y-3">
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center font-bold text-primary text-lg">
                                                {r.name?.charAt(0) || 'R'}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-foreground text-base leading-tight">{r.name}</h3>
                                                <p className="text-xs text-muted-foreground">Slug: /{r.slug}</p>
                                            </div>
                                        </div>

                                        <span className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-full border inline-flex items-center gap-1 ${
                                            r.isActive
                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                                : 'bg-red-500/10 text-red-400 border-red-500/30'
                                        }`}>
                                            {r.isActive ? 'Active' : 'Suspended'}
                                        </span>
                                    </div>

                                    <div className="border-t border-border/30 pt-3 space-y-1.5 text-xs text-muted-foreground">
                                        <div className="flex justify-between">
                                            <span>Owner:</span>
                                            <span className="font-semibold text-foreground">{r.owner?.name || 'N/A'} ({r.owner?.email})</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Location:</span>
                                            <span className="text-foreground">{r.address?.city || r.city || 'N/A'}</span>
                                        </div>
                                    </div>

                                    {/* Metrics pill */}
                                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/30 text-center">
                                        <div className="p-2 rounded-xl bg-background/50 border border-border/30">
                                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Tables</p>
                                            <p className="text-sm font-extrabold text-foreground">{r.metrics?.tables || 0}</p>
                                        </div>
                                        <div className="p-2 rounded-xl bg-background/50 border border-border/30">
                                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Menu</p>
                                            <p className="text-sm font-extrabold text-foreground">{r.metrics?.menuItems || 0}</p>
                                        </div>
                                        <div className="p-2 rounded-xl bg-background/50 border border-border/30">
                                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Orders</p>
                                            <p className="text-sm font-extrabold text-foreground">{r.metrics?.orders || 0}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-border/30 flex justify-end">
                                    <button
                                        onClick={() => handleToggleStatus(r)}
                                        className={`px-4 py-1.5 text-xs font-semibold rounded-xl border transition-colors ${
                                            r.isActive
                                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30'
                                                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                                        }`}
                                    >
                                        {r.isActive ? 'Suspend Restaurant' : 'Activate Restaurant'}
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default RestaurantManagement;
