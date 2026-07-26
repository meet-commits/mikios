import { useState } from 'react';
import { useSearchParams, useNavigate, useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, MessageSquare, ArrowLeft, Loader2, User, Clock, CheckCircle, Send, X } from 'lucide-react';
import api from '../../config/api';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const CustomerReviews = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { restaurant } = useOutletContext();
    const restaurantId = restaurant?._id;
    const orderId = searchParams.get('order');

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [name, setName] = useState('');

    const { data: reviewData, isLoading } = useQuery({
        queryKey: ['reviews', restaurantId],
        queryFn: async () => {
            const res = await api.get(`/reviews?restaurant=${restaurantId}`);
            return res.data;
        },
        enabled: !!restaurantId
    });

    const submitReview = useMutation({
        mutationFn: async (newReview) => {
            const res = await api.post('/reviews', newReview);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['reviews', restaurantId]);
            toast.success('Thank you for your feedback!');
            setIsFormOpen(false);
            setComment('');
            setName('');
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Failed to submit review');
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        // Ensure IDs are properly handled as null if they are "null" strings
        const cleanRestaurantId = restaurantId && restaurantId !== 'null' ? restaurantId : null;
        const cleanOrderId = orderId && orderId !== 'null' ? orderId : null;

        if (!cleanRestaurantId) {
            toast.error("Restaurant context is missing.");
            return;
        }

        submitReview.mutate({
            restaurant: cleanRestaurantId,
            order: cleanOrderId,
            rating,
            comment,
            customerName: name
        });
    };

    if (isLoading) return (
        <div className="flex items-center justify-center min-h-screen bg-[#121212]">
            <Loader2 className="animate-spin text-primary" size={40} />
        </div>
    );

    const reviews = reviewData?.data || [];
    const stats = {
        averageRating: reviewData?.averageRating?.toFixed(1) || 0,
        totalReviews: reviewData?.totalReviews || 0,
        recommendationRate: Math.round(((reviews.filter(r => r.rating >= 4).length) / (reviews.length || 1)) * 100)
    };

    return (
        <div className="pb-20 max-w-lg mx-auto px-4 pt-6 min-h-screen bg-[#121212] text-white">
            <button
                onClick={() => navigate(-1)}
                className="mb-6 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
            >
                <ArrowLeft size={20} />
            </button>

            {/* Header / Stats Card */}
            <div className="mb-10 text-center relative overflow-hidden p-8 rounded-[2.5rem] bg-gradient-to-br from-primary/20 to-transparent border border-white/5 shadow-2xl">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-primary/20 blur-[60px] rounded-full -z-10" />

                <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-4">{restaurant?.name || 'Restaurant'} Reviews</h1>

                <div className="flex items-center justify-center gap-2 mb-2">
                    {[1, 2, 3, 4, 5].map(star => (
                        <Star key={star} size={24} className={star <= Math.round(stats.averageRating) ? "text-primary fill-primary" : "text-gray-600"} strokeWidth={3} />
                    ))}
                </div>
                <div className="text-2xl font-bold mb-1">{stats.averageRating}</div>
                <p className="text-gray-400 text-sm font-medium tracking-wide">Based on {stats.totalReviews} guest experiences</p>

                <div className="mt-6 flex bg-white/5 p-4 rounded-2xl border border-white/5 items-center justify-between">
                    <div className="text-left">
                        <div className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Success Rate</div>
                        <div className="text-lg font-bold text-primary">{stats.recommendationRate}% Happy Guests</div>
                    </div>
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                        <CheckCircle size={24} strokeWidth={2.5} />
                    </div>
                </div>
            </div>

            {/* Review List */}
            <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-6 px-2">Recent Guest Stories</h3>
            <div className="space-y-4">
                {reviews.length === 0 ? (
                    <div className="text-center py-10 bg-white/5 rounded-3xl border border-dashed border-white/10">
                        <p className="text-gray-500 text-sm italic">No stories shared yet. Be the first!</p>
                    </div>
                ) : (
                    reviews.map((review) => (
                        <motion.div
                            key={review._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/5 border border-white/5 p-6 rounded-[2rem] hover:border-primary/20 transition-all group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                        {review.customerName?.charAt(0) || <User size={20} />}
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold flex items-center gap-2">
                                            {review.customerName || 'Guest Customer'}
                                            {review.order && <CheckCircle size={12} className="text-emerald-500" strokeWidth={3} />}
                                        </div>
                                        <div className="text-[10px] text-gray-500 flex items-center gap-1">
                                            <Clock size={10} /> {new Date(review.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <Star key={star} size={12} className={star <= review.rating ? "text-primary fill-primary" : "text-gray-700"} />
                                    ))}
                                </div>
                            </div>
                            <p className="text-sm text-gray-300 leading-relaxed font-medium italic mb-4">"{review.comment}"</p>

                            {review.ownerReply && (
                                <div className="mt-4 p-4 bg-primary/5 rounded-2xl border-l-4 border-primary">
                                    <div className="text-[10px] font-black uppercase text-primary mb-1">Reply from Owner</div>
                                    <p className="text-xs text-gray-400 italic">"{review.ownerReply.message}"</p>
                                </div>
                            )}
                        </motion.div>
                    ))
                )}
            </div>

            {/* Footer CTA / Add Review Form */}
            <div className="mt-12">
                <AnimatePresence mode="wait">
                    {!isFormOpen ? (
                        <motion.div
                            key="cta"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="p-8 rounded-[2.5rem] bg-card border-4 border-dashed border-primary/20 text-center relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-primary/5 -z-10" />
                            <MessageSquare className="mx-auto mb-4 text-primary" size={32} />
                            <h4 className="text-lg font-black italic uppercase mb-2">Share Your Experience</h4>
                            <p className="text-xs text-gray-400 mb-6 leading-relaxed px-4">Your feedback helps us cook better and helps others find their next favorite meal!</p>
                            <button
                                onClick={() => setIsFormOpen(true)}
                                className="btn-primary w-full h-12 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20"
                            >
                                Write a Review
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="p-8 rounded-[2.5rem] bg-white text-black relative"
                        >
                            <button
                                onClick={() => setIsFormOpen(false)}
                                className="absolute top-6 right-6 p-2 bg-black/5 rounded-full hover:bg-black/10"
                            >
                                <X size={20} />
                            </button>

                            <h4 className="text-xl font-black italic uppercase mb-6 pr-8 tracking-tighter">Your Feedback</h4>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 block">Rating</label>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setRating(star)}
                                                className="transition-transform active:scale-90"
                                            >
                                                <Star
                                                    size={32}
                                                    className={star <= rating ? "text-primary fill-primary" : "text-gray-200"}
                                                    strokeWidth={3}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 block">Display Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. Aarav P."
                                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl py-3 px-4 outline-none focus:border-primary font-medium"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 block">Review</label>
                                    <textarea
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        placeholder="Tell us about your experience..."
                                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl py-4 px-4 h-32 outline-none focus:border-primary font-medium resize-none"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitReview.isPending}
                                    className="w-full py-4 bg-black text-white rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-black/10 disabled:opacity-50"
                                >
                                    {submitReview.isPending ? <Loader2 className="animate-spin" /> : <Send size={18} />}
                                    {submitReview.isPending ? 'Submitting...' : 'Post Story'}
                                </button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default CustomerReviews;
