import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import api from '../../config/api';
import toast from 'react-hot-toast';
import {
    Clock, CheckCircle, ChefHat, Bell, XCircle, DollarSign,
    MessageCircle, Mic, QrCode, AlertCircle, Users, Droplet,
    Utensils, HelpCircle, Check, X, Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';


const OrderManagement = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const { socket, joinRestaurant } = useSocket();
    const [restaurantId, setRestaurantId] = useState(() => {
        if (!user?.restaurant) return null;
        return typeof user.restaurant === 'object' ? user.restaurant._id : user.restaurant;
    });
    const [activeTab, setActiveTab] = useState('ACTIVE'); // ACTIVE, HISTORY
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);


    // Initial setup
    useEffect(() => {
        const initRestaurant = async () => {
            if (!restaurantId && user) {
                try {
                    const res = await api.get('/restaurant/my-restaurants');
                    if (res.data.data?.[0]) {
                        const id = res.data.data[0]._id;
                        setRestaurantId(id);
                    }
                } catch (err) {
                    console.error('Failed to fetch restaurant:', err);
                }
            } else if (user?.restaurant) {
                // If user.restaurant exists but restaurantId isn't set yet (or just to keep in sync)
                const id = typeof user.restaurant === 'object' ? user.restaurant._id : user.restaurant;
                if (id !== restaurantId) setRestaurantId(id);
            }
        };
        initRestaurant();
    }, [user, restaurantId]);

    // Ensure we join the room whenever restaurantId OR socket is ready
    useEffect(() => {
        if (restaurantId) {
            joinRestaurant(restaurantId);
            console.log('Requesting room join for:', restaurantId);
        }
    }, [restaurantId, socket?.connected]);

    // Socket Listeners
    useEffect(() => {
        if (socket) {
            const playSound = () => {
                const audio = new Audio('/sounds/notification.mp3');
                audio.play().catch(e => console.log('Audio play failed', e));
            };

            socket.on('order:created', () => {
                playSound();
                toast.success('New Order Received!');
                queryClient.invalidateQueries(['orders']);
            });
            socket.on('order:status-changed', () => {
                queryClient.invalidateQueries(['orders']);
            });
            socket.on('order:payment-updated', () => {
                queryClient.invalidateQueries(['orders']);
                toast.success('Payment Received');
            });
            socket.on('order:cancelled', () => {
                toast.error('Order Cancelled');
                queryClient.invalidateQueries(['orders']);
            });
            socket.on('service:new', (data) => {
                playSound();
                queryClient.invalidateQueries(['service-requests']);
                toast(`New Request: ${data?.type || 'Service'}`, { icon: '🔔' });
            });
            socket.on('service:updated', () => {
                queryClient.invalidateQueries(['service-requests']);
            });

            return () => {
                socket.off('order:created');
                socket.off('order:status-changed');
                socket.off('order:payment-updated');
                socket.off('order:cancelled');
                socket.off('service:new');
                socket.off('service:updated');
            };
        }
    }, [socket, queryClient]);


    // Fetch Orders
    const { data: orders = [], isLoading } = useQuery({
        queryKey: ['orders', restaurantId],
        queryFn: async () => {
            if (!restaurantId) return [];
            const res = await api.get(`/orders/restaurant/${restaurantId}`);
            return res.data.data;
        },
        enabled: !!restaurantId,
        refetchInterval: 30000
    });

    // Fetch Service Requests
    const { data: serviceRequests = [] } = useQuery({
        queryKey: ['service-requests', restaurantId],
        queryFn: async () => {
            if (!restaurantId) return [];
            const res = await api.get(`/service?restaurant=${restaurantId}`);
            return res.data.data;
        },
        enabled: !!restaurantId,
        refetchInterval: 10000
    });

    // Mutations with Optimistic UI
    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }) => api.patch(`/orders/${id}/status`, { status }),
        onMutate: async ({ id, status }) => {
            // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
            await queryClient.cancelQueries({ queryKey: ['orders', restaurantId] });

            // Snapshot the previous value
            const previousOrders = queryClient.getQueryData(['orders', restaurantId]);

            // Optimistically update to the new value
            queryClient.setQueryData(['orders', restaurantId], (old) => {
                if (!old) return [];
                return old.map(order =>
                    order._id === id ? { ...order, status } : order
                );
            });

            // Return a context object with the snapshotted value
            return { previousOrders };
        },
        onError: (err, variables, context) => {
            // If the mutation fails, use the context returned from onMutate to roll back
            queryClient.setQueryData(['orders', restaurantId], context.previousOrders);
            toast.error(err.response?.data?.message || 'Update failed');
        },
        onSettled: () => {
            // Always refetch after error or success to throw away optimistic update
            queryClient.invalidateQueries({ queryKey: ['orders', restaurantId] });
        }
    });

    const updateServiceMutation = useMutation({
        mutationFn: ({ id, status }) => api.patch(`/service/${id}`, { status }),
        onMutate: async ({ id, status }) => {
            await queryClient.cancelQueries({ queryKey: ['service-requests', restaurantId] });
            const previousRequests = queryClient.getQueryData(['service-requests', restaurantId]);

            queryClient.setQueryData(['service-requests', restaurantId], (old) => {
                if (!old) return [];
                return old.map(req =>
                    req._id === id ? { ...req, status } : req
                );
            });

            return { previousRequests };
        },
        onError: (err, variables, context) => {
            queryClient.setQueryData(['service-requests', restaurantId], context.previousRequests);
            toast.error('Update failed');
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['service-requests', restaurantId] });
        }
    });

    // Configuration - 2 Columns Only (removed READY)
    const statusColumns = {
        PENDING: {
            label: 'Pending',
            icon: Bell,
            color: 'text-yellow-500',
            bg: 'bg-yellow-500/10',
            border: 'border-yellow-500/20',
            next: 'PREPARING'
        },
        PREPARING: {
            label: 'Preparing',
            icon: ChefHat,
            color: 'text-orange-500',
            bg: 'bg-orange-500/10',
            border: 'border-orange-500/20',
            next: 'SERVED' // Changed from READY to SERVED
        }
    };

    const getSourceIcon = (source) => {
        switch (source) {
            case 'VOICE': return <Mic size={14} className="text-primary" />;
            case 'WHATSAPP': return <MessageCircle size={14} className="text-green-400" />;
            case 'QR': return <QrCode size={14} className="text-blue-400" />;
            default: return null;
        }
    };

    const getRequestIcon = (type) => {
        switch (type) {
            case 'CALL_WAITER': return <Users size={18} className="text-blue-500" />;
            case 'REQUEST_BILL': return <DollarSign size={18} className="text-green-500" />;
            case 'CLEANING': return <Droplet size={18} className="text-cyan-500" />;
            case 'WATER': return <Droplet size={18} className="text-blue-400" />;
            case 'CUTLERY': return <Utensils size={18} className="text-gray-400" />;
            case 'OTHER': return <HelpCircle size={18} className="text-purple-500" />;
            default: return <Bell size={18} />;
        }
    };

    // Filter Logic
    const activeOrders = useMemo(() => {
        return orders.filter(o =>
            ['PENDING', 'ACCEPTED', 'PREPARING', 'READY'].includes(o.status)
        );
    }, [orders]);

    const historyOrders = useMemo(() => {
        return orders.filter(o =>
            o.status === 'SERVED' ||
            o.status === 'CANCELLED' ||
            o.paymentStatus === 'PAID'
        );
    }, [orders]);

    const activeRequests = useMemo(() => {
        return serviceRequests.filter(r =>
            r.status !== 'COMPLETED' &&
            r.status !== 'CANCELLED' &&
            // Exclude old complaints that were sent as service requests
            !r.comment?.includes('[COMPLAINT:')
        );
    }, [serviceRequests]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Only trigger if not typing in an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            if (e.code === 'KeyS' && activeTab === 'ACTIVE') {
                const firstPreparing = activeOrders.find(o => o.status === 'PREPARING' || o.status === 'READY');
                if (firstPreparing) {
                    updateStatusMutation.mutate({ id: firstPreparing._id, status: 'SERVED' });
                    toast.success(`Served Order #${firstPreparing.orderNumber.split('-')[2]}`);
                }
            }
            if (e.code === 'KeyA' && activeTab === 'ACTIVE') {
                const firstPending = activeOrders.find(o => o.status === 'PENDING' || o.status === 'ACCEPTED');
                if (firstPending) {
                    updateStatusMutation.mutate({ id: firstPending._id, status: 'PREPARING' });
                    toast.success(`Preparing Order #${firstPending.orderNumber.split('-')[2]}`);
                }
            }
            if (e.code === 'KeyD' && activeTab === 'ACTIVE') {
                const firstRequest = activeRequests[0];
                if (firstRequest) {
                    updateServiceMutation.mutate({ id: firstRequest._id, status: 'COMPLETED' });
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeOrders, activeRequests, activeTab]);

    // Live Stats Calculation
    const stats = useMemo(() => {
        const active = activeOrders.length;
        const revenue = activeOrders.reduce((acc, o) => acc + o.total, 0);
        const urgent = activeOrders.filter(o => {
            const created = new Date(o.createdAt).getTime();
            const now = Date.now();
            return (now - created) > 15 * 60 * 1000; // 15 mins
        }).length;
        const requests = activeRequests.length;
        return { active, revenue, urgent, requests };
    }, [activeOrders, activeRequests]);

    const isOrderUrgent = (order) => {
        const created = new Date(order.createdAt).getTime();
        const now = Date.now();
        return (now - created) > 15 * 60 * 1000;
    };

    const isRequestUrgent = (request) => {
        const created = new Date(request.createdAt).getTime();
        const now = Date.now();
        return (now - created) > 5 * 60 * 1000; // 5 mins
    };

    if (isLoading) return (
        <div className="flex bg-background min-h-screen">
            <Sidebar className={mobileMenuOpen ? "flex fixed inset-y-0 left-0 z-50 w-64 bg-card shadow-2xl" : "hidden lg:flex"} />
            <div className="flex-1 flex flex-col min-w-0">
                <Header onMobileMenuClick={() => setMobileMenuOpen(true)} />
                <div className="flex-1 flex items-center justify-center gap-2 text-foreground">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                    Loading Orders...
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex bg-background min-h-screen text-foreground font-sans selection:bg-primary/30 transition-colors duration-300">
            <Sidebar
                open={mobileMenuOpen}
                onClose={() => setMobileMenuOpen(false)}
            />

            {mobileMenuOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Header onMobileMenuClick={() => setMobileMenuOpen(true)} />

                <div className="flex-1 flex flex-col p-3 sm:p-4 md:p-6 overflow-hidden">

                    {/* Top Stats Bar & Toolbar */}
                    <div className="flex flex-col gap-4 sm:gap-6 mb-4 sm:mb-6 flex-shrink-0">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div>
                                    <h1 className="text-xl sm:text-2xl font-bold font-logo-stylish text-foreground flex items-center gap-2">
                                        Live Orders
                                        {socket?.connected && (
                                            <span className="flex items-center gap-1 bg-green-500/10 text-green-500 text-[10px] px-2 py-0.5 rounded-full border border-green-500/20 animate-pulse">
                                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                                LIVE
                                            </span>
                                        )}
                                    </h1>
                                    <p className="text-muted-foreground text-xs sm:text-sm">Real-time kitchen workflow</p>
                                </div>
                                <button
                                    onClick={() => queryClient.invalidateQueries(['orders'])}
                                    className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                                    title="Manual Refresh"
                                >
                                    <Clock size={16} />
                                </button>
                            </div>

                            <div className="flex bg-muted p-1 rounded-lg">
                                <button
                                    onClick={() => setActiveTab('ACTIVE')}
                                    className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-md transition-all text-xs sm:text-sm font-medium ${activeTab === 'ACTIVE' ? 'bg-background text-primary shadow-sm font-bold' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    Active Board
                                </button>
                                <button
                                    onClick={() => setActiveTab('HISTORY')}
                                    className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-md transition-all text-xs sm:text-sm font-medium ${activeTab === 'HISTORY' ? 'bg-background text-primary shadow-sm font-bold' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    History
                                </button>
                            </div>


                        </div>
                    </div>

                    {/* Professional Stats Overview - Horizontal Scroll on Mobile */}
                    {activeTab === 'ACTIVE' && (
                        <div className="flex overflow-x-auto pb-4 -mx-3 px-3 sm:mx-0 sm:px-0 sm:pb-0 sm:grid sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 snap-x snap-mandatory carousel-scrollbar touch-pan-x mb-6">
                            <div className="bg-card border border-border p-4 rounded-xl flex items-center justify-between shadow-sm min-w-[240px] snap-center">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Active Orders</p>
                                    <h3 className="text-2xl font-bold text-foreground">{stats.active}</h3>
                                </div>
                                <div className="p-3 bg-primary/10 rounded-full text-primary">
                                    <ChefHat size={20} />
                                </div>
                            </div>
                            <div className="bg-card border border-border p-4 rounded-xl flex items-center justify-between shadow-sm min-w-[240px] snap-center">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Est. Revenue</p>
                                    <h3 className="text-2xl font-bold text-foreground">₹{stats.revenue.toFixed(2)}</h3>
                                </div>
                                <div className="p-3 bg-green-500/10 rounded-full text-green-500">
                                    <DollarSign size={20} />
                                </div>
                            </div>
                            <div className="bg-card border border-border p-4 rounded-xl flex items-center justify-between shadow-sm min-w-[240px] snap-center">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Attention Needed</p>
                                    <h3 className={`text-2xl font-bold ${stats.urgent > 0 ? 'text-red-500' : 'text-foreground'}`}>{stats.urgent}</h3>
                                </div>
                                <div className={`p-3 rounded-full ${stats.urgent > 0 ? 'bg-red-500/10 text-red-500 animate-pulse' : 'bg-muted text-muted-foreground'}`}>
                                    <AlertCircle size={20} />
                                </div>
                            </div>
                            <div className="bg-card border border-border p-4 rounded-xl flex items-center justify-between shadow-sm min-w-[240px] snap-center">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Pending Requests</p>
                                    <h3 className={`text-2xl font-bold ${stats.requests > 0 ? 'text-blue-500' : 'text-foreground'}`}>{stats.requests}</h3>
                                </div>
                                <div className={`p-3 rounded-full ${stats.requests > 0 ? 'bg-blue-500/10 text-blue-500' : 'bg-muted text-muted-foreground'}`}>
                                    <Bell size={20} />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'ACTIVE' ? (
                        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row gap-4">
                            {/* Orders Section - Swipeable Columns on Mobile */}
                            <div className="flex-1 overflow-x-auto pb-2 custom-scrollbar lg:h-full">
                                <div className="flex flex-col sm:flex-row gap-4 h-full min-w-full sm:min-w-[600px]">
                                    {Object.entries(statusColumns).map(([status, config]) => {
                                        const columnOrders = activeOrders.filter(o => {
                                            if (status === 'PENDING') return o.status === 'PENDING' || o.status === 'ACCEPTED';
                                            return o.status === status || o.status === 'READY'; // Include READY in PREPARING column
                                        });

                                        const Icon = config.icon;

                                        return (
                                            <div key={status} className="flex-1 flex flex-col min-h-[400px] sm:min-h-0 sm:min-w-[280px]">
                                                <div className={`flex items-center gap-2 p-3 rounded-t-xl font-bold border-b transition-colors bg-card border-border ${config.color}`}>
                                                    <div className={`p-1.5 rounded-lg ${config.bg}`}>
                                                        <Icon size={18} />
                                                    </div>
                                                    {config.label}
                                                    <span className="ml-auto bg-muted px-2 py-0.5 rounded text-xs text-foreground font-mono">
                                                        {columnOrders.length}
                                                    </span>
                                                </div>

                                                <div className="flex-1 bg-muted/30 rounded-b-xl p-2 border-x border-b border-border flex sm:flex-col gap-3 overflow-x-auto sm:overflow-y-auto snap-x snap-mandatory sm:snap-none custom-scrollbar">
                                                    <AnimatePresence mode='popLayout'>
                                                        {columnOrders.map(order => {
                                                            const urgent = isOrderUrgent(order);

                                                            return (
                                                                <OrderCard
                                                                    key={order._id}
                                                                    order={order}
                                                                    config={config}
                                                                    urgent={urgent}
                                                                    onUpdateStatus={updateStatusMutation.mutate}
                                                                    getSourceIcon={getSourceIcon}
                                                                />
                                                            );
                                                        })}
                                                    </AnimatePresence>
                                                    {columnOrders.length === 0 && (
                                                        <div className="flex flex-col items-center justify-center py-10 sm:py-10 min-w-full text-muted-foreground/50 gap-2">
                                                            <Icon size={24} className="opacity-20" />
                                                            <span className="text-xs font-medium">No orders</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Customer Requests Section */}
                            <div className="w-full lg:w-80 flex flex-col bg-card border border-border rounded-xl shadow-sm flex-shrink-0 lg:h-full max-h-[400px] lg:max-h-none">
                                <div className="flex items-center gap-2 p-3 border-b border-border bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-t-xl sticky top-0 z-10">
                                    <div className="p-1.5 rounded-lg bg-blue-500/10">
                                        <Bell size={18} className="text-blue-500" />
                                    </div>
                                    <span className="font-bold text-foreground font-display tracking-tight">Requests</span>
                                    <span className="ml-auto bg-blue-500/20 px-2 py-0.5 rounded text-xs text-blue-500 font-mono font-bold">
                                        {activeRequests.length}
                                    </span>
                                    {activeRequests.length > 0 && (
                                        <button
                                            onClick={() => {
                                                if (window.confirm('Clear all active requests?')) {
                                                    activeRequests.forEach(r => updateServiceMutation.mutate({ id: r._id, status: 'COMPLETED' }));
                                                }
                                            }}
                                            className="p-1 hover:bg-red-500/10 text-red-500 rounded transition-colors"
                                            title="Clear All"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>

                                <div className="flex-1 overflow-x-auto sm:overflow-y-auto p-3 flex sm:flex-col gap-2 snap-x snap-mandatory sm:snap-none custom-scrollbar">
                                    <AnimatePresence mode='popLayout'>
                                        {activeRequests.map(request => (
                                            <RequestCard
                                                key={request._id}
                                                request={request}
                                                urgent={isRequestUrgent(request)}
                                                getRequestIcon={getRequestIcon}
                                                onUpdate={updateServiceMutation.mutate}
                                            />
                                        ))}
                                    </AnimatePresence>
                                    {activeRequests.length === 0 && (
                                        <div className="flex flex-col items-center justify-center py-16 min-w-full text-muted-foreground/50 gap-2">
                                            <CheckCircle size={32} className="opacity-20" />
                                            <span className="text-sm font-medium">All caught up!</span>
                                            <span className="text-xs">No pending requests</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        // History View
                        <div className="flex-1 overflow-visible bg-card border border-border rounded-xl shadow-sm overflow-x-auto">
                            <table className="w-full text-left min-w-[800px]">
                                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground font-semibold">
                                    <tr>
                                        <th className="p-4 rounded-tl-xl">Order #</th>
                                        <th className="p-4">Table</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4">Payment</th>
                                        <th className="p-4 text-right">Total</th>
                                        <th className="p-4 rounded-tr-xl">Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border text-sm">
                                    {historyOrders.map(order => (
                                        <tr key={order._id} className="hover:bg-muted/30 transition-colors">
                                            <td className="p-4 font-mono font-medium text-primary">#{order.orderNumber.split('-')[1]}</td>
                                            <td className="p-4 text-foreground">{order.table?.name || 'Takeout'}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${order.status === 'CANCELLED' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                    'bg-green-500/10 text-green-500 border-green-500/20'
                                                    }`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${order.paymentStatus === 'PAID' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                    'bg-gray-500/10 text-gray-500 border-gray-500/20'
                                                    }`}>
                                                    {order.paymentStatus}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right font-bold text-foreground">₹{order.total.toFixed(2)}</td>
                                            <td className="p-4 text-muted-foreground">
                                                {new Date(order.createdAt).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                    {historyOrders.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="p-8 text-center text-muted-foreground">No history found</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>


        </div>
    );
};

// Order Card Component with Improved Typography
const OrderCard = ({ order, config, urgent, onUpdateStatus, getSourceIcon }) => {
    const isNew = (new Date() - new Date(order.createdAt)) < 10000;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={`
                bg-card rounded-[2rem] p-6 shadow-xl border-4 transition-all duration-300 relative overflow-hidden group
                min-w-[320px] sm:min-w-0 snap-center flex-shrink-0
                ${urgent
                    ? 'border-red-500 bg-red-500/5 shadow-[0_0_20px_-5px_rgba(239,68,68,0.4)]'
                    : isNew
                        ? 'border-primary shadow-2xl shadow-primary/20 ring-8 ring-primary/10'
                        : 'border-border/80 hover:border-primary/50'
                }
            `}
        >
            {isNew && (
                <div className="absolute top-0 right-0 z-10">
                    <div className="bg-primary text-primary-foreground text-[10px] font-black px-3 py-1 rounded-bl-xl shadow-sm animate-bounce mt-2 mr-2">
                        NEW ORDER
                    </div>
                </div>
            )}

            {/* Card Header */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-xl font-black text-foreground antialiased italic">
                            #{order.orderNumber.split('-')[2]}
                        </span>
                        {order.table ? (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 uppercase tracking-tighter">
                                Table {order.table.name}
                            </span>
                        ) : (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-500 border border-purple-500/20 uppercase tracking-tighter">
                                Takeout
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5 opacity-60">
                        {getSourceIcon(order.orderSource)}
                        <span className="text-[10px] uppercase font-bold tracking-widest">
                            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                </div>
            </div>

            {urgent && (
                <div className="mb-4 flex items-center gap-2 p-2 bg-red-500/10 rounded-lg text-xs font-black text-red-500 border border-red-500/20">
                    <AlertCircle size={14} className="animate-pulse" />
                    LATENCY CRITICAL: OVER 15 MINS
                </div>
            )}

            {/* Items List */}
            <div className="space-y-2.5 mb-6">
                {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 group/item">
                        <div className="relative">
                            <span className="bg-foreground text-background w-7 h-7 flex items-center justify-center rounded-lg text-xs font-black font-mono shadow-sm group-hover/item:bg-primary group-hover/item:text-primary-foreground transition-colors">
                                {item.quantity}
                            </span>
                        </div>
                        <span className="text-sm font-bold text-foreground/90 truncate leading-tight tracking-tight">
                            {item.name}
                        </span>
                    </div>
                ))}
            </div>

            {/* Footer Actions */}
            <div className="pt-4 border-t border-border/40 flex items-center justify-between gap-4">
                <div className="flex flex-col">
                    <span className="text-[8px] uppercase font-black text-muted-foreground tracking-widest mb-0.5">Total Amount</span>
                    <span className="text-xl font-black text-foreground leading-none tracking-tighter">
                        {order.total.toFixed(2)}
                    </span>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => onUpdateStatus({ id: order._id, status: config.next })}
                        className={`
                            relative flex items-center gap-2 px-5 py-3 rounded-xl transition-all active:scale-95 overflow-hidden font-black text-xs uppercase tracking-widest
                            ${config.next === 'SERVED'
                                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-primary/40 active:shadow-inner'
                                : 'bg-foreground text-background hover:bg-foreground/90'
                            }
                        `}
                    >
                        <span>{config.next === 'SERVED' ? 'Serve Now' : 'Next'}</span>
                        <ArrowRightIcon className="w-4 h-4" />
                    </button>

                    {(order.status === 'PENDING' || order.status === 'ACCEPTED') && (
                        <button
                            onClick={() => onUpdateStatus({ id: order._id, status: 'CANCELLED' })}
                            className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors border border-transparent hover:border-red-500/20"
                            title="Abort Order"
                        >
                            <XCircle size={20} />
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

// Request Card Component
const RequestCard = ({ request, urgent, getRequestIcon, onUpdate }) => {
    const isNew = (new Date() - new Date(request.createdAt)) < 10000;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.95 }}
            className={`
                bg-card rounded-2xl p-5 border-4 transition-all duration-300 relative overflow-hidden group
                min-w-[280px] sm:min-w-0 snap-center flex-shrink-0 shadow-lg
                ${urgent
                    ? 'border-red-500 bg-red-500/5 shadow-[0_0_20px_-5px_rgba(239,68,68,0.4)]'
                    : isNew
                        ? 'border-blue-500 bg-blue-500/5 ring-4 ring-blue-500/20 shadow-blue-500/10'
                        : 'border-border/80 border-l-primary/80 border-l-8'
                }
            `}
        >
            <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-xl bg-muted/50 border border-border/50 group-hover:scale-110 transition-transform ${urgent ? 'text-red-500' : 'text-primary'}`}>
                    {getRequestIcon(request.type)}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-black text-foreground uppercase tracking-tight truncate">
                            {request.type.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] font-mono opacity-50 font-bold">
                            {new Date(request.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-[10px] font-black px-2 py-0.5 rounded bg-foreground/5 text-foreground uppercase tracking-wider">
                            Table {request.table?.name || '??'}
                        </span>
                        {urgent && (
                            <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-red-500 text-white uppercase animate-pulse">
                                URGENT
                            </span>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => onUpdate({ id: request._id, status: 'COMPLETED' })}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-green-500 text-white hover:bg-green-600 text-[10px] font-black uppercase rounded-xl transition-all shadow-sm shadow-green-500/20"
                        >
                            <Check size={14} strokeWidth={3} /> Done
                        </button>
                        <button
                            onClick={() => onUpdate({ id: request._id, status: 'CANCELLED' })}
                            className="p-2.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-xl transition-colors border border-red-500/20"
                        >
                            <X size={14} strokeWidth={3} />
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// Helper for arrow icon
const ArrowRightIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
);

export default OrderManagement;
