import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogIn, ArrowRight, CheckCircle2, Star, QrCode } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Logo from '../../components/common/Logo';
import ThemeToggle from '../../components/common/ThemeToggle';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [notVerified, setNotVerified] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);
    const { login, resendVerification, setUser, checkRestaurantStatus, user: authUser } = useAuth();
    const navigate = useNavigate();

    // Timer logic for resend email
    useEffect(() => {
        let interval;
        if (resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [resendTimer]);

    // Handle social login redirect tokens and errors
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        const refreshToken = params.get('refreshToken');
        const userStr = params.get('user');
        const error = params.get('error');

        if (error) {
            toast.error(error);
            if (error === 'Email not registered') {
                navigate('/register');
            }
            // Clear URL
            window.history.replaceState({}, document.title, window.location.pathname);
            return;
        }

        if (token && refreshToken && userStr) {
            try {
                const userData = JSON.parse(decodeURIComponent(userStr));

                // Save to local storage
                localStorage.setItem('token', token);
                localStorage.setItem('refreshToken', refreshToken);
                localStorage.setItem('user', JSON.stringify(userData));

                // Clear the URL to prevent processing again
                window.history.replaceState({}, document.title, window.location.pathname);

                // Update context
                setUser(userData);

                // Redirect based on role
                if (userData.role === 'OWNER') {
                    checkRestaurantStatus().then(hasRestaurant => {
                        navigate(hasRestaurant ? '/dashboard' : '/onboarding');
                    });
                } else if (userData.role === 'CHEF' || userData.role === 'WAITER' || (userData.permissions && userData.permissions.length > 0)) {
                    navigate('/orders');
                } else {
                    console.warn('[Login] Social login user has no staff role:', userData.role);
                    toast.error("Access restricted: This account does not have staff permissions.");
                }
            } catch (err) {
                console.error('Error parsing social login data:', err);
                toast.error('Failed to process login');
            }
        }
    }, [navigate, setUser, checkRestaurantStatus]);

    // Auto-redirect if already logged in (standard flow)
    useEffect(() => {
        if (authUser) {
            console.log('[Login] User already logged in, redirecting...', authUser.role);
            if (authUser.role === 'OWNER') {
                navigate('/dashboard');
            } else if (authUser.role === 'CHEF' || authUser.role === 'WAITER' || (authUser.permissions && authUser.permissions.length > 0)) {
                navigate('/orders');
            } else {
                console.warn('[Login] User has no recognized role/permissions:', authUser);
                if (authUser.role === 'CUSTOMER') {
                    // Prevent loop: Do nothing or show message
                    // toast('Customer account detected. Please use the mobile menu to order.', { icon: '📱' });
                }
            }
        }
    }, [authUser, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await login(email, password);

            if (result?.notVerified) {
                setNotVerified(true);
                return;
            }

            const user = result;
            if (user.role === 'OWNER') {
                const hasRestaurant = await checkRestaurantStatus();
                navigate(hasRestaurant ? '/dashboard' : '/onboarding');
            } else if (user.role === 'CHEF' || user.role === 'WAITER') {
                navigate('/orders');
            } else if (user.permissions?.includes('orders')) {
                navigate('/orders');
            } else if (user.permissions && user.permissions.length > 0) {
                // Redirect to first allowed permission
                const firstPerm = user.permissions[0];
                const routeMap = {
                    'dashboard': '/dashboard',
                    'tables': '/tables',
                    'menu': '/menu',
                    'inventory': '/inventory',
                    'staff': '/staff',
                    'analytics': '/analytics',
                    'reviews': '/reviews',
                    'service': '/service',
                    'complaints': '/complaints',
                    'settings': '/settings'
                };
                navigate(routeMap[firstPerm] || '/dashboard');
            } else {
                navigate('/orders');
            }
        } catch (error) {
            console.error('Login error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setLoading(true);
        try {
            await resendVerification(email);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        window.location.href = `${API_URL}/auth/google?intent=login`;
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Visual & Social Proof (Hidden on mobile) */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-foreground overflow-hidden items-center justify-center p-12">
                {/* Background Pattern */}
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
                    className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[100px]"
                />
                <motion.div
                    animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
                    transition={{ duration: 10, repeat: Infinity, delay: 2 }}
                    className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/20 rounded-full blur-[120px]"
                />

                <div className="relative z-10 max-w-lg">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="mb-12"
                    >
                        <Link to="/" className="group mb-12 block">
                            <Logo className="w-auto h-12" variant="inverse" />
                        </Link>

                        <h2 className="font-display text-4xl font-bold text-background mb-6 leading-tight">
                            Manage Your Restaurant <br />
                            <span className="text-primary italic">Like a Pro</span>
                        </h2>

                        <p className="text-background/70 text-lg leading-relaxed mb-8">
                            Join 89+ restaurants using mikiOS to <span className="text-primary font-semibold">streamline operations, improve guest experience, and simplify management</span> with effortless ordering.
                        </p>

                        <div className="bg-background/10 backdrop-blur-xl rounded-3xl p-6 border border-background/15 space-y-5 shadow-2xl">
                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                                    <span className="text-xs font-black uppercase tracking-widest text-background">Chef AI Live Intelligence</span>
                                </div>
                                <span className="px-2.5 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> LIVE SYSTEM
                                </span>
                            </div>

                            {/* Metric Ticker */}
                            <div className="grid grid-cols-3 gap-3 bg-background/10 p-3.5 rounded-2xl border border-background/10">
                                <div className="text-center">
                                    <p className="text-[10px] text-background/60 font-semibold uppercase">Prep Speed</p>
                                    <p className="text-lg font-black text-primary italic">3.8m</p>
                                </div>
                                <div className="text-center border-x border-background/10">
                                    <p className="text-[10px] text-background/60 font-semibold uppercase">Rev Lift</p>
                                    <p className="text-lg font-black text-emerald-400 italic">+24%</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] text-background/60 font-semibold uppercase">Active QRs</p>
                                    <p className="text-lg font-black text-purple-300 italic">1,420+</p>
                                </div>
                            </div>

                            {/* Dynamic AI Tip */}
                            <div className="bg-background/15 p-4 rounded-2xl border border-background/10 space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-primary flex items-center gap-1">
                                        💡 Smart Upselling & Kitchen Speed
                                    </span>
                                </div>
                                <p className="text-xs text-background/90 italic leading-relaxed">
                                    "AI automatically pairs Butter Chicken with Garlic Naan & Lassi, boosting check size by ₹180 per table while reducing ordering friction."
                                </p>
                            </div>

                            {/* Live Order Simulation Ticker */}
                            <div className="flex items-center gap-3 text-xs bg-black/30 px-3.5 py-2.5 rounded-xl border border-white/10">
                                <QrCode className="w-4 h-4 text-primary shrink-0" />
                                <p className="text-background/80 truncate">
                                    <strong className="text-background">Table #04:</strong> Ordered Paneer Tikka • Sent to KDS 👨‍🍳
                                </p>
                            </div>
                        </div>
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

                    <div className="flex justify-between items-center mb-8">
                        <div className="text-left">
                            <h2 className="font-display text-3xl font-bold mb-2">Welcome Back</h2>
                            <p className="text-muted-foreground">Join 89+ restaurants growing with mikiOS.</p>
                        </div>
                        <ThemeToggle className="theme-toggle-container" />
                    </div>

                    <AnimatePresence>
                        {notVerified && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6"
                            >
                                <div className="flex flex-col gap-3">
                                    <p className="text-amber-500 text-sm font-medium">
                                        Your email is not verified yet. Please check your inbox.
                                    </p>
                                    <button
                                        onClick={() => {
                                            handleResend();
                                            setResendTimer(40);
                                        }}
                                        disabled={loading || resendTimer > 0}
                                        className="text-primary text-xs font-bold uppercase tracking-widest hover:underline text-left flex items-center gap-2 disabled:opacity-50 disabled:no-underline"
                                    >
                                        {loading ? 'Sending...' : resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Verification Link'}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email Address</label>
                            <input
                                type="email"
                                className="w-full px-4 py-3 rounded-xl border border-border bg-muted/30 focus:bg-background focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                placeholder="name@restaurant.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-medium">Password</label>
                                <Link to="/forgot-password" className="text-xs font-semibold text-primary hover:underline">
                                    Forgot Password?
                                </Link>
                            </div>
                            <input
                                type="password"
                                className="w-full px-4 py-3 rounded-xl border border-border bg-muted/30 focus:bg-background focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
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
                                    Sign In
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>

                        <div className="relative py-4 flex items-center">
                            <div className="flex-grow border-t border-border"></div>
                            <span className="flex-shrink mx-4 text-muted-foreground text-xs uppercase tracking-widest font-black">or</span>
                            <div className="flex-grow border-t border-border"></div>
                        </div>

                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            className="w-full bg-white text-black hover:bg-neutral-100 py-3.5 text-sm font-bold rounded-xl flex items-center justify-center gap-3 transition-all border border-neutral-200"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path
                                    fill="#4285F4"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="#34A853"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="#FBBC05"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                                />
                                <path
                                    fill="#EA4335"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                            Continue with Google
                        </button>
                    </form>

                    <p className="text-center mt-8 text-sm text-muted-foreground">
                        Don't have an account?{' '}
                        <Link to="/register" className="font-semibold text-foreground hover:text-primary transition-colors">
                            Create an account
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
