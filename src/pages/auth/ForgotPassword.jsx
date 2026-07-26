import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, ShieldCheck, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../config/api';
import Logo from '../../components/common/Logo';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await api.post('/auth/forgot-password', { email });
            if (response.data.success) {
                toast.success(response.data.message);
                navigate('/reset-password', { state: { email } });
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send reset email');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Visual */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-foreground overflow-hidden items-center justify-center p-12">
                <div className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.2) 1px, transparent 0)`,
                        backgroundSize: '32px 32px'
                    }}
                />

                {/* Gradient Orbs */}
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 8, repeat: Infinity }}
                    className="absolute top-1/4 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[100px]"
                />

                <div className="relative z-10 max-w-lg text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <Link to="/" className="group mb-12 block">
                            <Logo className="w-auto h-12 justify-center" />
                        </Link>

                        <div className="w-20 h-20 rounded-3xl bg-primary/20 flex items-center justify-center mx-auto mb-8">
                            <ShieldCheck className="w-10 h-10 text-primary" />
                        </div>

                        <h2 className="font-display text-4xl font-bold text-background mb-4">
                            Account Recovery
                        </h2>

                        <p className="text-background/70 text-lg leading-relaxed">
                            Don't worry, it happens to the best of us. We'll verify your identity and get you back to your restaurant in no time.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-background">
                <div className="w-full max-w-md">
                    {/* Logo - Centered for Mobile */}
                    <div className="flex justify-center lg:hidden mb-10">
                        <Logo className="w-auto h-12" />
                    </div>

                    <div className="text-center lg:text-left mb-8">
                        <Link to="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Login
                        </Link>
                        <h2 className="font-display text-3xl font-bold mb-2">Forgot Password?</h2>
                        <p className="text-muted-foreground">
                            Enter your email to receive a recovery code.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="email"
                                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-border bg-muted/30 focus:bg-background focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                    placeholder="meet@curryhouse.in"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary py-3.5 text-base rounded-xl flex items-center justify-center gap-2 group"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Send Recovery Code
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
