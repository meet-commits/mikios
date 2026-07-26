import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Search, Filter, Shield, Edit3, Trash2, CheckCircle2, XCircle,
    UserCheck, UserX, AlertTriangle, X, RefreshCw, Lock, CheckSquare, Square,
    Smartphone, Monitor, Globe, LogOut, Ban, Clock
} from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/dashboard/DashboardLayout';

const AVAILABLE_PERMISSIONS = [
    { key: 'dashboard', label: 'Overview Dashboard', desc: 'Main restaurant metrics & stats' },
    { key: 'orders', label: 'Live Orders', desc: 'Take orders & manage kitchen status' },
    { key: 'revenue', label: 'Billing & Payments', desc: 'Manual bills & payment processing' },
    { key: 'menu', label: 'Menu Management', desc: 'Create & update dishes & prices' },
    { key: 'tables', label: 'Table Management', desc: 'Manage dining tables & floorplan' },
    { key: 'inventory', label: 'Inventory Engine', desc: 'Track stock & ingredient levels' },
    { key: 'qr-codes', label: 'QR Management', desc: 'Table QR code generation' },
    { key: 'analytics', label: 'Analytics', desc: 'Sales, revenue & performance analytics' },
    { key: 'staff', label: 'Staff Management', desc: 'Manage chefs, waiters & floor staff' },
    { key: 'reviews', label: 'Reviews & Feedback', desc: 'View diner ratings & reviews' },
    { key: 'complaints', label: 'Customer Complaints', desc: 'View & resolve customer complaints' },
    { key: 'service', label: 'Service Requests', desc: 'Live waiter call alerts' },
    { key: 'settings', label: 'Restaurant Settings', desc: 'Update restaurant details & hours' },
    { key: 'subscription', label: 'Subscription Plan', desc: 'View plan tier & billing status' },
];

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('all');

    // Role & Permission Modal State
    const [editingUser, setEditingUser] = useState(null);
    const [newRole, setNewRole] = useState('');
    const [selectedPermissions, setSelectedPermissions] = useState([]);

    // Device Session Modal State
    const [sessionModalUser, setSessionModalUser] = useState(null);
    const [userSessions, setUserSessions] = useState([]);
    const [loadingSessions, setLoadingSessions] = useState(false);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const params = {};
            if (search) params.search = search;
            if (roleFilter !== 'ALL') params.role = roleFilter;
            if (statusFilter !== 'all') params.status = statusFilter;

            const res = await api.get('/admin/users', { params });
            if (res.data?.success) {
                setUsers(res.data.data.users);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
            toast.error('Failed to load user records');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchUsers();
        }, 300);
        return () => clearTimeout(timeout);
    }, [search, roleFilter, statusFilter]);

    const handleOpenEditModal = (user) => {
        setEditingUser(user);
        setNewRole(user.role);
        setSelectedPermissions(user.permissions || []);
    };

    const handleOpenSessionsModal = async (user) => {
        setSessionModalUser(user);
        setLoadingSessions(true);
        try {
            const res = await api.get(`/admin/users/${user._id}/sessions`);
            if (res.data?.success) {
                setUserSessions(res.data.data.sessions || []);
            }
        } catch (error) {
            toast.error('Failed to load active device sessions');
        } finally {
            setLoadingSessions(false);
        }
    };

    const handleLogoutSession = async (sessionId, all = false) => {
        if (!sessionModalUser) return;
        try {
            const res = await api.post(`/admin/users/${sessionModalUser._id}/sessions/logout`, { sessionId, all });
            if (res.data?.success) {
                toast.success(all ? 'All device sessions revoked' : 'Device session revoked');
                setUserSessions(res.data.data || []);
            }
        } catch (error) {
            toast.error('Failed to revoke session');
        }
    };

    const handleToggleSuspendSession = async (sessionId, currentSuspended) => {
        if (!sessionModalUser) return;
        try {
            const res = await api.patch(`/admin/users/${sessionModalUser._id}/sessions/suspend`, {
                sessionId,
                isSuspended: !currentSuspended
            });
            if (res.data?.success) {
                toast.success(res.data.message || 'Session updated');
                setUserSessions(res.data.data || []);
            }
        } catch (error) {
            toast.error('Failed to update device status');
        }
    };

    const handleTogglePermission = (permKey) => {
        setSelectedPermissions(prev =>
            prev.includes(permKey)
                ? prev.filter(k => k !== permKey)
                : [...prev, permKey]
        );
    };

    const handleSelectAllPermissions = () => {
        setSelectedPermissions(AVAILABLE_PERMISSIONS.map(p => p.key));
    };

    const handleClearAllPermissions = () => {
        setSelectedPermissions([]);
    };

    const handleToggleStatus = async (user) => {
        try {
            const updatedStatus = !user.isActive;
            const res = await api.patch(`/admin/users/${user._id}`, { isActive: updatedStatus });
            if (res.data?.success) {
                toast.success(`User ${user.email} ${updatedStatus ? 'activated' : 'suspended'}`);
                fetchUsers();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update user status');
        }
    };

    const handleSaveUserPermissions = async () => {
        if (!editingUser) return;
        try {
            const res = await api.patch(`/admin/users/${editingUser._id}`, {
                role: newRole,
                permissions: selectedPermissions
            });
            if (res.data?.success) {
                toast.success(`Role & Permissions saved for ${editingUser.email}`);
                setEditingUser(null);
                fetchUsers();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update user permissions');
        }
    };

    const handleDeleteUser = async (user) => {
        if (!window.confirm(`Are you sure you want to permanently delete user ${user.email}?`)) return;
        try {
            const res = await api.delete(`/admin/users/${user._id}`);
            if (res.data?.success) {
                toast.success(`User ${user.email} deleted`);
                fetchUsers();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete user');
        }
    };

    const roleBadgeColor = (role) => {
        switch (role) {
            case 'ADMIN': return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
            case 'OWNER': return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
            case 'CHEF': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
            case 'WAITER': return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
            default: return 'bg-gray-500/20 text-gray-300 border-gray-500/40';
        }
    };

    return (
        <DashboardLayout>
            <div className="p-6 space-y-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/40 pb-6">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                                User & Device Management
                            </h1>
                            <span className="px-3 py-1 text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5" /> ROLE & DEVICE CONTROL
                            </span>
                        </div>
                        <p className="text-muted-foreground text-sm mt-1">
                            Manage user roles, feature permissions, active IP sessions, and remote device logouts.
                        </p>
                    </div>

                    <button
                        onClick={fetchUsers}
                        className="px-4 py-2 bg-secondary/80 hover:bg-secondary text-foreground text-sm font-medium rounded-xl border border-border/50 flex items-center gap-2"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                    </button>
                </div>

                {/* Search & Filter Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-card/40 p-4 rounded-2xl border border-border/40 backdrop-blur-xl">
                    {/* Search Input */}
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-background/60 border border-border/50 rounded-xl text-sm focus:outline-none focus:border-primary"
                        />
                    </div>

                    {/* Role Filter */}
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="w-full px-3 py-2 bg-background/60 border border-border/50 rounded-xl text-sm focus:outline-none focus:border-primary"
                        >
                            <option value="ALL">All Roles</option>
                            <option value="ADMIN">ADMIN</option>
                            <option value="OWNER">OWNER</option>
                            <option value="CHEF">CHEF</option>
                            <option value="WAITER">WAITER</option>
                            <option value="CUSTOMER">CUSTOMER</option>
                        </select>
                    </div>

                    {/* Status Filter */}
                    <div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-3 py-2 bg-background/60 border border-border/50 rounded-xl text-sm focus:outline-none focus:border-primary"
                        >
                            <option value="all">All Statuses</option>
                            <option value="active">Active Only</option>
                            <option value="inactive">Suspended Only</option>
                        </select>
                    </div>
                </div>

                {/* Users Table */}
                <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl overflow-hidden shadow-lg">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-muted/40 text-muted-foreground uppercase text-[11px] tracking-wider font-semibold border-b border-border/40">
                                <tr>
                                    <th className="py-3.5 px-6">User</th>
                                    <th className="py-3.5 px-6">Role</th>
                                    <th className="py-3.5 px-6">Feature Access Rights</th>
                                    <th className="py-3.5 px-6">Status</th>
                                    <th className="py-3.5 px-6">Registered</th>
                                    <th className="py-3.5 px-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30">
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="py-12 text-center text-muted-foreground">
                                            Loading users...
                                        </td>
                                    </tr>
                                ) : users.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="py-12 text-center text-muted-foreground">
                                            No user records found matching your filters.
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((u) => (
                                        <tr key={u._id} className="hover:bg-muted/20 transition-colors">
                                            <td className="py-4 px-6 font-medium">
                                                <div>
                                                    <p className="text-foreground font-semibold">{u.name}</p>
                                                    <p className="text-xs text-muted-foreground">{u.email}</p>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`px-2.5 py-1 text-xs font-bold border rounded-lg ${roleBadgeColor(u.role)}`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-xs">
                                                {u.role === 'ADMIN' ? (
                                                    <span className="text-amber-400 font-semibold flex items-center gap-1">
                                                        <Shield className="w-3.5 h-3.5" /> Full Unrestricted System Access
                                                    </span>
                                                ) : u.role === 'OWNER' && (!u.permissions || u.permissions.length === 0) ? (
                                                    <span className="text-blue-400 font-medium">Full Owner Workspace Rights</span>
                                                ) : u.permissions && u.permissions.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1 max-w-xs">
                                                        {u.permissions.slice(0, 4).map(p => (
                                                            <span key={p} className="px-2 py-0.5 text-[10px] bg-secondary/80 text-foreground border border-border/50 rounded-md">
                                                                {p}
                                                            </span>
                                                        ))}
                                                        {u.permissions.length > 4 && (
                                                            <span className="px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                                                +{u.permissions.length - 4} more
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground/60">Default Role Permissions</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border inline-flex items-center gap-1 ${
                                                    u.isActive
                                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                                        : 'bg-red-500/10 text-red-400 border-red-500/30'
                                                }`}>
                                                    {u.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                    {u.isActive ? 'Active' : 'Suspended'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-xs text-muted-foreground">
                                                {new Date(u.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="py-4 px-6 text-right space-x-2">
                                                <button
                                                    onClick={() => handleOpenSessionsModal(u)}
                                                    title="View Active Devices & IP Activity"
                                                    className="px-3 py-1.5 bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 text-xs font-semibold rounded-xl border border-purple-500/30 transition-colors inline-flex items-center gap-1.5"
                                                >
                                                    <Smartphone className="w-3.5 h-3.5" /> Devices
                                                </button>
                                                <button
                                                    onClick={() => handleOpenEditModal(u)}
                                                    title="Manage Role & Granular Permissions"
                                                    className="px-3 py-1.5 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 text-xs font-semibold rounded-xl border border-blue-500/30 transition-colors inline-flex items-center gap-1.5"
                                                >
                                                    <Edit3 className="w-3.5 h-3.5" /> Access
                                                </button>
                                                <button
                                                    onClick={() => handleToggleStatus(u)}
                                                    title={u.isActive ? 'Suspend User' : 'Activate User'}
                                                    className={`p-1.5 hover:bg-secondary rounded-lg transition-colors ${u.isActive ? 'text-amber-400' : 'text-emerald-400'}`}
                                                >
                                                    {u.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(u)}
                                                    title="Delete User"
                                                    className="p-1.5 hover:bg-secondary rounded-lg text-red-400 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Edit Role & Granular Permissions Matrix Modal */}
                <AnimatePresence>
                    {editingUser && (
                        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-card border border-border/50 p-6 rounded-2xl max-w-2xl w-full shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto custom-scrollbar"
                            >
                                <div className="flex justify-between items-center border-b border-border/40 pb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                                            <Shield className="w-5 h-5 text-amber-400" /> Manage Role & Access Matrix
                                        </h3>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Configure system role and permissions for <span className="text-foreground font-semibold">{editingUser.name} ({editingUser.email})</span>
                                        </p>
                                    </div>
                                    <button onClick={() => setEditingUser(null)} className="p-1 text-muted-foreground hover:text-foreground">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-foreground uppercase tracking-wider">System Role:</label>
                                    <select
                                        value={newRole}
                                        onChange={(e) => setNewRole(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-background border border-border/60 rounded-xl text-sm font-semibold focus:outline-none focus:border-primary"
                                    >
                                        <option value="ADMIN">ADMIN (Super Administrator - Full Unrestricted Bypass)</option>
                                        <option value="OWNER">OWNER (Restaurant Manager)</option>
                                        <option value="CHEF">CHEF (Kitchen Operations)</option>
                                        <option value="WAITER">WAITER (Floor Service Staff)</option>
                                        <option value="CUSTOMER">CUSTOMER (End User Diner)</option>
                                    </select>
                                </div>

                                <div className="space-y-3 pt-2 border-t border-border/40">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                                                <Lock className="w-4 h-4 text-blue-400" /> Granular Page & Feature Permissions
                                            </h4>
                                            <p className="text-xs text-muted-foreground">Select which pages and tools this user can see and interact with.</p>
                                        </div>
                                        <div className="flex gap-2 text-xs">
                                            <button
                                                type="button"
                                                onClick={handleSelectAllPermissions}
                                                className="px-2.5 py-1 bg-secondary hover:bg-secondary/80 text-foreground font-semibold rounded-lg border border-border/50"
                                            >
                                                Select All
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleClearAllPermissions}
                                                className="px-2.5 py-1 bg-secondary hover:bg-secondary/80 text-muted-foreground font-semibold rounded-lg border border-border/50"
                                            >
                                                Clear All
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                        {AVAILABLE_PERMISSIONS.map((perm) => {
                                            const isChecked = selectedPermissions.includes(perm.key);
                                            return (
                                                <div
                                                    key={perm.key}
                                                    onClick={() => handleTogglePermission(perm.key)}
                                                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                                                        isChecked
                                                            ? 'bg-primary/10 border-primary/40 text-foreground'
                                                            : 'bg-background/40 border-border/40 text-muted-foreground hover:bg-muted/30'
                                                    }`}
                                                >
                                                    <div className="mt-0.5 text-primary">
                                                        {isChecked ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-muted-foreground" />}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-xs font-bold leading-tight text-foreground">{perm.label}</p>
                                                        <p className="text-[11px] text-muted-foreground mt-0.5">{perm.desc}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
                                    <button
                                        onClick={() => setEditingUser(null)}
                                        className="px-4 py-2 bg-secondary text-muted-foreground text-sm font-medium rounded-xl hover:text-foreground"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveUserPermissions}
                                        className="px-6 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-xl shadow-lg hover:bg-primary/90"
                                    >
                                        Save Role & Access Matrix
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Device Sessions & IP Activity Modal */}
                <AnimatePresence>
                    {sessionModalUser && (
                        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-card border border-border/50 p-6 rounded-2xl max-w-3xl w-full shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto custom-scrollbar"
                            >
                                <div className="flex justify-between items-center border-b border-border/40 pb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                                            <Smartphone className="w-5 h-5 text-purple-400" /> Active Devices & IP Activity Log
                                        </h3>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Logged-in devices, IP addresses & remote session revocation for <span className="text-foreground font-semibold">{sessionModalUser.name} ({sessionModalUser.email})</span>
                                        </p>
                                    </div>
                                    <button onClick={() => setSessionModalUser(null)} className="p-1 text-muted-foreground hover:text-foreground">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="flex justify-between items-center bg-muted/20 p-3 rounded-xl border border-border/30">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Globe className="w-4 h-4 text-purple-400" />
                                        <span>Total Sessions Tracked: <strong className="text-foreground">{userSessions.length}</strong></span>
                                    </div>
                                    {userSessions.length > 0 && (
                                        <button
                                            onClick={() => handleLogoutSession(null, true)}
                                            className="px-3 py-1 bg-red-500/20 text-red-300 hover:bg-red-500/30 text-xs font-bold rounded-lg border border-red-500/30 transition-colors flex items-center gap-1.5"
                                        >
                                            <LogOut className="w-3.5 h-3.5" /> Logout All Devices
                                        </button>
                                    )}
                                </div>

                                {/* Sessions List */}
                                <div className="space-y-3">
                                    {loadingSessions ? (
                                        <div className="py-12 text-center text-muted-foreground">Loading active sessions...</div>
                                    ) : userSessions.length === 0 ? (
                                        <div className="py-12 text-center text-muted-foreground space-y-2">
                                            <Monitor className="w-8 h-8 mx-auto text-muted-foreground/40" />
                                            <p>No active device sessions recorded for this user yet.</p>
                                            <p className="text-xs text-muted-foreground/60">Device & IP logs are captured automatically on next login.</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-border/30">
                                            {userSessions.map((sess, idx) => (
                                                <div key={sess.sessionId || idx} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/20 px-3 rounded-xl transition-colors">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <Monitor className="w-4 h-4 text-blue-400" />
                                                            <span className="text-sm font-bold text-foreground">{sess.device || 'Unknown Device'}</span>
                                                            <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${
                                                                sess.isSuspended
                                                                    ? 'bg-red-500/10 text-red-400 border-red-500/30'
                                                                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                                            }`}>
                                                                {sess.isSuspended ? 'SUSPENDED' : 'ACTIVE'}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                                            <span className="flex items-center gap-1">
                                                                <Globe className="w-3.5 h-3.5 text-purple-400" /> IP: <strong className="text-foreground">{sess.ipAddress || '127.0.0.1'}</strong>
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="w-3.5 h-3.5" /> Login: {new Date(sess.loginAt).toLocaleDateString()} {new Date(sess.loginAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <button
                                                            onClick={() => handleToggleSuspendSession(sess.sessionId, sess.isSuspended)}
                                                            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors flex items-center gap-1.5 ${
                                                                sess.isSuspended
                                                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                                                                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30'
                                                            }`}
                                                        >
                                                            <Ban className="w-3.5 h-3.5" />
                                                            {sess.isSuspended ? 'Unsuspend' : 'Suspend Device'}
                                                        </button>
                                                        <button
                                                            onClick={() => handleLogoutSession(sess.sessionId)}
                                                            className="px-3 py-1.5 bg-red-500/20 text-red-300 hover:bg-red-500/30 text-xs font-semibold rounded-xl border border-red-500/30 transition-colors flex items-center gap-1.5"
                                                        >
                                                            <LogOut className="w-3.5 h-3.5" /> Remote Logout
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end pt-4 border-t border-border/40">
                                    <button
                                        onClick={() => setSessionModalUser(null)}
                                        className="px-4 py-2 bg-secondary text-foreground text-sm font-medium rounded-xl hover:bg-secondary/80"
                                    >
                                        Close
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

export default UserManagement;
