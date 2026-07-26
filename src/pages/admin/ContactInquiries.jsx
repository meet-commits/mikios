import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, Building, MessageSquare, Clock, CheckCircle2, Trash2, RefreshCw, Filter, Search, Sparkles } from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/dashboard/DashboardLayout';

const ContactInquiries = () => {
    const [inquiries, setInquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState('ALL');
    const [search, setSearch] = useState('');

    const fetchInquiries = async () => {
        try {
            setLoading(true);
            const res = await api.get('/admin/inquiries');
            if (res.data?.success) {
                setInquiries(res.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch inquiries:', error);
            toast.error('Failed to load contact inquiries');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInquiries();
    }, []);

    const handleUpdateStatus = async (id, newStatus) => {
        try {
            const res = await api.patch(`/admin/inquiries/${id}`, { status: newStatus });
            if (res.data?.success) {
                toast.success(`Status updated to ${newStatus}`);
                fetchInquiries();
            }
        } catch (error) {
            toast.error('Failed to update inquiry status');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this inquiry record permanently?')) return;
        try {
            const res = await api.delete(`/admin/inquiries/${id}`);
            if (res.data?.success) {
                toast.success('Inquiry deleted');
                fetchInquiries();
            }
        } catch (error) {
            toast.error('Failed to delete inquiry');
        }
    };

    const filteredInquiries = inquiries.filter(i => {
        const matchesType = filterType === 'ALL' || i.type === filterType;
        const matchesSearch = !search ||
            (i.name && i.name.toLowerCase().includes(search.toLowerCase())) ||
            (i.email && i.email.toLowerCase().includes(search.toLowerCase())) ||
            (i.restaurantName && i.restaurantName.toLowerCase().includes(search.toLowerCase()));
        return matchesType && matchesSearch;
    });

    return (
        <DashboardLayout>
            <div className="p-6 space-y-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/40 pb-6">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                                Contact & Demo Inquiries
                            </h1>
                            <span className="px-3 py-1 text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5" /> SUPER ADMIN FEED
                            </span>
                        </div>
                        <p className="text-muted-foreground text-sm mt-1">
                            Review and manage all incoming Sales Contact form submissions and Get Demo Link requests.
                        </p>
                    </div>

                    <button
                        onClick={fetchInquiries}
                        className="px-4 py-2 bg-secondary/80 hover:bg-secondary text-foreground text-sm font-medium rounded-xl border border-border/50 flex items-center gap-2"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                    </button>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-card/40 p-4 rounded-2xl border border-border/40 backdrop-blur-xl">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search by name, email or restaurant..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-background/60 border border-border/50 rounded-xl text-sm focus:outline-none focus:border-primary"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="w-full px-3 py-2 bg-background/60 border border-border/50 rounded-xl text-sm focus:outline-none focus:border-primary"
                        >
                            <option value="ALL">All Inquiry Types</option>
                            <option value="DEMO_REQUEST">Demo Link Requests</option>
                            <option value="CONTACT_SALES">Contact Sales Forms</option>
                        </select>
                    </div>
                </div>

                {/* Inquiries Table */}
                <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl overflow-hidden shadow-lg">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-muted/40 text-muted-foreground uppercase text-[11px] tracking-wider font-semibold border-b border-border/40">
                                <tr>
                                    <th className="py-3.5 px-6">Sender Details</th>
                                    <th className="py-3.5 px-6">Type</th>
                                    <th className="py-3.5 px-6">Message / Details</th>
                                    <th className="py-3.5 px-6">Status</th>
                                    <th className="py-3.5 px-6">Date</th>
                                    <th className="py-3.5 px-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30">
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="py-12 text-center text-muted-foreground">Loading inquiries...</td>
                                    </tr>
                                ) : filteredInquiries.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="py-12 text-center text-muted-foreground">No inquiries found.</td>
                                    </tr>
                                ) : (
                                    filteredInquiries.map((inq) => (
                                        <tr key={inq._id} className="hover:bg-muted/20 transition-colors">
                                            <td className="py-4 px-6 font-medium">
                                                <div>
                                                    <p className="text-foreground font-semibold">{inq.name}</p>
                                                    <p className="text-xs text-primary font-medium flex items-center gap-1 mt-0.5">
                                                        <Mail className="w-3 h-3" /> {inq.email}
                                                    </p>
                                                    {inq.phone && (
                                                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                            <Phone className="w-3 h-3" /> {inq.phone}
                                                        </p>
                                                    )}
                                                    {inq.restaurantName && (
                                                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                            <Building className="w-3 h-3 text-amber-400" /> {inq.restaurantName}
                                                        </p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`px-2.5 py-1 text-[11px] font-bold border rounded-lg ${
                                                    inq.type === 'DEMO_REQUEST'
                                                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                                                        : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                                                }`}>
                                                    {inq.type === 'DEMO_REQUEST' ? 'GET DEMO LINK' : 'CONTACT SALES'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-xs max-w-xs">
                                                <p className="text-foreground/90 leading-relaxed italic line-clamp-3">
                                                    "{inq.message}"
                                                </p>
                                            </td>
                                            <td className="py-4 px-6">
                                                <select
                                                    value={inq.status}
                                                    onChange={(e) => handleUpdateStatus(inq._id, e.target.value)}
                                                    className={`px-2.5 py-1 text-xs font-bold rounded-xl border bg-background ${
                                                        inq.status === 'RESOLVED' ? 'text-emerald-400 border-emerald-500/40' :
                                                        inq.status === 'CONTACTED' ? 'text-blue-400 border-blue-500/40' :
                                                        'text-amber-400 border-amber-500/40'
                                                    }`}
                                                >
                                                    <option value="PENDING">PENDING</option>
                                                    <option value="CONTACTED">CONTACTED</option>
                                                    <option value="RESOLVED">RESOLVED</option>
                                                    <option value="CLOSED">CLOSED</option>
                                                </select>
                                            </td>
                                            <td className="py-4 px-6 text-xs text-muted-foreground">
                                                {new Date(inq.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <button
                                                    onClick={() => handleDelete(inq._id)}
                                                    className="p-1.5 hover:bg-secondary rounded-lg text-red-400 transition-colors"
                                                    title="Delete Inquiry"
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
            </div>
        </DashboardLayout>
    );
};

export default ContactInquiries;
