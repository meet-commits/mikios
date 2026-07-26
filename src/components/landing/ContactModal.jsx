import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Mail, User, Building, Phone, MessageSquare } from 'lucide-react';
import api from '@/config/api';

export const ContactModal = ({ isOpen, onClose }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        restaurantName: '',
        phone: '',
        message: ''
    });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null); // 'success' | 'error' | null

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus(null);

        try {
            const response = await api.post('/contact/sales', formData);
            setStatus('success');
            setTimeout(() => {
                onClose();
                setFormData({ name: '', email: '', restaurantName: '', phone: '', message: '' });
                setStatus(null);
            }, 2000);
        } catch (error) {
            console.error('Contact form error:', error);
            setStatus('error');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg bg-background rounded-2xl shadow-2xl overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="relative bg-gradient-to-br from-primary/10 to-accent/10 p-6 border-b border-border">
                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-background/50 hover:bg-background flex items-center justify-center transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                                <h2 className="font-display text-2xl font-bold mb-2">Contact Sales</h2>
                                <p className="text-muted-foreground text-sm">
                                    Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
                                </p>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Name */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium flex items-center gap-2">
                                            <User className="w-4 h-4 text-primary" />
                                            Full Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/30 focus:bg-background focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                            placeholder="Chef Rajesh Sharma"
                                            required
                                        />
                                    </div>

                                    {/* Email */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-primary" />
                                            Email *
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/30 focus:bg-background focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                            placeholder="rajesh@spicehub.in"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Restaurant Name */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium flex items-center gap-2">
                                            <Building className="w-4 h-4 text-primary" />
                                            Restaurant Name
                                        </label>
                                        <input
                                            type="text"
                                            name="restaurantName"
                                            value={formData.restaurantName}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/30 focus:bg-background focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                            placeholder="The Royal Tandoor"
                                        />
                                    </div>

                                    {/* Phone */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium flex items-center gap-2">
                                            <Phone className="w-4 h-4 text-primary" />
                                            Phone
                                        </label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/30 focus:bg-background focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                            placeholder="+91 98765 43210"
                                        />
                                    </div>
                                </div>

                                {/* Message */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <MessageSquare className="w-4 h-4 text-primary" />
                                        Message *
                                    </label>
                                    <textarea
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        rows={4}
                                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/30 focus:bg-background focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all outline-none resize-none"
                                        placeholder="Tell us how we can help your restaurant grow..."
                                        required
                                        minLength={10}
                                    />
                                </div>

                                {/* Status Messages */}
                                {status === 'success' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-600 text-sm"
                                    >
                                        ✓ Message sent successfully! We'll get back to you soon.
                                    </motion.div>
                                )}

                                {status === 'error' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-3 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm"
                                    >
                                        ✗ Failed to send message. Please try again.
                                    </motion.div>
                                )}

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={loading || status === 'success'}
                                    className="w-full btn-primary py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            Send Message
                                        </>
                                    )}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};
