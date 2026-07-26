import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Search, Filter, Shield, Edit3, Trash2, CheckCircle2, XCircle,
    UserCheck, UserX, AlertTriangle, X, RefreshCw
} from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/dashboard/DashboardLayout';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('all');
    const [editingUser, setEditingUser] = useState(null);
    const [newRole, setNewRole] = useState('');

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

    const handleRoleChange = async () => {
        if (!editingUser || !newRole) return;
        try {
            const res = await api.patch(`/admin/users/${editingUser._id}`, { role: newRole });
            if (res.data?.success) {
                toast.success(`Updated ${editingUser.email} role to ${newRole}`);
                setEditingUser(null);
                fetchUsers();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update user role');
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
                                User Management
                            </h1>
                            <span className="px-3 py-1 text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5" /> SYSTEM ACCOUNTS
                            </span>
                        </div>
                        <p className="text-muted-foreground text-sm mt-1">
                            Search, change roles, suspend, or manage platform user access.
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
                                    <th className="py-3.5 px-6">Associated Restaurant</th>
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
                                            <td className="py-4 px-6 text-xs text-muted-foreground">
                                                {u.restaurant ? (
                                                    <span className="text-foreground font-medium">{u.restaurant.name}</span>
                                                ) : (
                                                    <span className="text-muted-foreground/60">N/A</span>
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
                                                    onClick={() => { setEditingUser(u); setNewRole(u.role); }}
                                                    title="Edit Role"
                                                    className="p-1.5 hover:bg-secondary rounded-lg text-blue-400 transition-colors"
                                                >
                                                    <Edit3 className="w-4 h-4" />
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

                {/* Edit Role Modal */}
                <AnimatePresence>
                    {editingUser && (
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-card border border-border/50 p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-5"
                            >
                                <div className="flex justify-between items-center border-b border-border/40 pb-4">
                                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                                        <Shield className="w-5 h-5 text-amber-400" /> Change User Role
                                    </h3>
                                    <button onClick={() => setEditingUser(null)} className="p-1 text-muted-foreground hover:text-foreground">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div>
                                    <p className="text-xs text-muted-foreground">Target User:</p>
                                    <p className="text-sm font-semibold text-foreground">{editingUser.name} ({editingUser.email})</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-muted-foreground">Select New Role:</label>
                                    <select
                                        value={newRole}
                                        onChange={(e) => setNewRole(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-background border border-border/60 rounded-xl text-sm font-medium focus:outline-none focus:border-primary"
                                    >
                                        <option value="ADMIN">ADMIN (Super Admin)</option>
                                        <option value="OWNER">OWNER (Restaurant Manager)</option>
                                        <option value="CHEF">CHEF (Kitchen Staff)</option>
                                        <option value="WAITER">WAITER (Floor Staff)</option>
                                        <option value="CUSTOMER">CUSTOMER (End Diner)</option>
                                    </select>
                                </div>

                                <div className="flex justify-end gap-3 pt-3">
                                    <button
                                        onClick={() => setEditingUser(null)}
                                        className="px-4 py-2 bg-secondary text-muted-foreground text-sm font-medium rounded-xl hover:text-foreground"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleRoleChange}
                                        className="px-5 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl shadow-lg hover:bg-primary/90"
                                    >
                                        Save Role
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
