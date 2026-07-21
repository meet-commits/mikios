import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Loader, Mail, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('');
    const token = searchParams.get('token');

    useEffect(() => {
        const verifyEmail = async () => {
            if (!token) {
                setStatus('error');
                setMessage('Invalid verification link. No token found.');
                return;
            }

            try {
                const res = await api.post('/auth/verify-email', { token });
                if (res.data.success) {
                    setStatus('success');
                    setMessage(res.data.message || 'Your email has been successfully verified! You can now access your account.');
                    toast.success('Email verified successfully!');
                }
            } catch (error) {
                setStatus('error');
                setMessage(error.response?.data?.message || 'Failed to verify email. The link may be expired or invalid.');
                toast.error('Verification failed');
            }
        };

        verifyEmail();
    }, [token]);

    return (
        <div className="min-h-screen relative flex items-center justify-center p-6 bg-black overflow-hidden font-sans">
            {/* Ambient Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(120,0,255,0.1),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_100%,rgba(50,200,255,0.05),transparent_40%)]" />

            {/* Animated Orbs */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3],
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-[100px]"
            />
            <motion.div
                animate={{
                    scale: [1.1, 0.9, 1.1],
                    opacity: [0.2, 0.4, 0.2]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px]"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10 w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl overflow-hidden"
            >
                {/* Shine Effect */}
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

                <div className="relative z-10 text-center space-y-8">
                    {/* Header Icon */}
                    <div className="flex justify-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 15 }}
                            className={`p-6 rounded-3xl ${status === 'verifying' ? 'bg-white/5 text-primary' :
                                status === 'success' ? 'bg-emerald-500/10 text-emerald-500' :
                                    'bg-red-500/10 text-red-500'
                                } border border-white/10 shadow-xl`}
                        >
                            <AnimatePresence mode="wait">
                                {status === 'verifying' && (
                                    <motion.div
                                        key="verifying"
                                        initial={{ opacity: 0, rotate: -180 }}
                                        animate={{ opacity: 1, rotate: 0 }}
                                        exit={{ opacity: 0, rotate: 180 }}
                                    >
                                        <Loader className="animate-spin w-12 h-12" />
                                    </motion.div>
                                )}
                                {status === 'success' && (
                                    <motion.div
                                        key="success"
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 1.5 }}
                                    >
                                        <CheckCircle2 className="w-12 h-12" />
                                    </motion.div>
                                )}
                                {status === 'error' && (
                                    <motion.div
                                        key="error"
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 1.5 }}
                                    >
                                        <XCircle className="w-12 h-12" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </div>

                    {/* Status Text */}
                    <div className="space-y-3">
                        <h1 className="text-3xl font-black text-white tracking-tight">
                            {status === 'verifying' ? 'Verifying Email' :
                                status === 'success' ? 'Email Verified!' :
                                    'Verification Failed'}
                        </h1>
                        <p className="text-white/60 leading-relaxed font-medium">
                            {status === 'verifying' ? 'Please wait while we confirm your email address...' : message}
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-4 space-y-4">
                        <AnimatePresence mode="wait">
                            {status === 'success' ? (
                                <motion.div
                                    key="success-btn"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <Link
                                        to="/login"
                                        className="btn-primary w-full py-4 text-black font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/20"
                                    >
                                        Proceed to Login <ArrowRight size={18} />
                                    </Link>
                                </motion.div>
                            ) : status === 'error' ? (
                                <motion.div
                                    key="error-btn"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-4"
                                >
                                    <Link
                                        to="/register"
                                        className="btn-primary w-full py-4 text-black font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/20"
                                    >
                                        Back to Registration <ArrowRight size={18} />
                                    </Link>
                                    <p className="text-white/40 text-xs">
                                        Need help? <Link to="/contact" className="text-primary hover:underline">Contact Support</Link>
                                    </p>
                                </motion.div>
                            ) : null}
                        </AnimatePresence>
                    </div>

                    {/* Trust Indicators */}
                    <div className="pt-8 border-t border-white/5 flex items-center justify-center gap-6 opacity-40">
                        <div className="flex items-center gap-2 text-[10px] text-white font-bold uppercase tracking-widest">
                            <ShieldCheck size={14} /> Secure
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-white font-bold uppercase tracking-widest">
                            <Sparkles size={14} /> Verified
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Attribution */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
                <p className="text-white/20 text-[10px] font-bold uppercase tracking-[0.3em]">
                    Powered by mikiOS intelligence
                </p>
            </div>
        </div>
    );
};

export default VerifyEmail;
