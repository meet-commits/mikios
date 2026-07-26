import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Star, MessageSquare, User as UserIcon, Send, ChevronRight, ArrowLeft } from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const RateStaff = () => {
    const { restaurant } = useOutletContext();
    const navigate = useNavigate();
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [customerName, setCustomerName] = useState('');

    // Fetch Staff
    const { data: staff, isLoading } = useQuery({
        queryKey: ['staff', restaurant?._id],
        queryFn: async () => {
            const res = await api.get(`/staff?restaurantId=${restaurant._id}`);
            return res.data.data;
        },
        enabled: !!restaurant?._id
    });

    const submitMutation = useMutation({
        mutationFn: (data) => api.post(`/staff/${selectedStaff._id}/review`, data),
        onSuccess: () => {
            toast.success('Thank you for your feedback!');
            setSelectedStaff(null);
            setRating(0);
            setComment('');
            navigate(-1);
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Submission failed');
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (rating === 0) return toast.error('Please select a rating');
        submitMutation.mutate({
            rating,
            comment,
            customerName: customerName || 'Guest Customer',
            restaurantId: restaurant._id
        });
    };

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">Finding Team...</p>
        </div>
    );

    return (
        <div className="max-w-2xl mx-auto pb-24">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors mb-6"
            >
                <ArrowLeft size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">Back to Menu</span>
            </button>

            <header className="mb-10 text-center">
                <h1 className="text-3xl font-black italic uppercase tracking-tight mb-2">Rate Our Service</h1>
                <p className="text-muted-foreground text-sm font-medium px-4">
                    Your feedback helps us recognize our top performers and improve your experience.
                </p>
            </header>

            {!selectedStaff ? (
                <div className="space-y-4 px-2">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary px-4">Select Staff Member</h3>
                    {staff?.map((member, i) => (
                        <motion.button
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            key={member._id}
                            onClick={() => setSelectedStaff(member)}
                            className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 hover:border-primary/30 transition-all group active:scale-[0.98]"
                        >
                            <div className="flex items-center gap-4">
                                <div
                                    className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-lg overflow-hidden bg-white/10"
                                >
                                    {member.profileImage ? (
                                        <img src={member.profileImage} alt={member.name} className="w-full h-full object-cover" />
                                    ) : (
                                        member.name.charAt(0)
                                    )}
                                </div>
                                <div className="text-left">
                                    <h4 className="font-bold text-white uppercase tracking-tight">{member.name}</h4>
                                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">{member.role}</p>
                                </div>
                            </div>
                            <ChevronRight size={20} className="text-white/20 group-hover:text-primary transition-colors" />
                        </motion.button>
                    ))}
                    {(!staff || staff.length === 0) && (
                        <div className="text-center py-20 bg-white/5 rounded-3xl border-2 border-dashed border-white/5">
                            <p className="text-muted-foreground text-sm italic">No staff profiles available for review today.</p>
                        </div>
                    )}
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white/5 border border-white/10 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-8 text-primary/5 -z-10">
                        <Star size={120} fill="currentColor" />
                    </div>

                    <div className="flex flex-col items-center mb-10">
                        <div
                            className="w-24 h-24 rounded-[2.5rem] flex items-center justify-center font-black text-4xl text-white shadow-2xl mb-4 border-4 border-white/10 overflow-hidden bg-white/10"
                        >
                            {selectedStaff.profileImage ? (
                                <img src={selectedStaff.profileImage} alt={selectedStaff.name} className="w-full h-full object-cover" />
                            ) : (
                                selectedStaff.name.charAt(0)
                            )}
                        </div>
                        <h2 className="text-2xl font-black italic uppercase tracking-tight">{selectedStaff.name}</h2>
                        <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-lg uppercase tracking-widest mt-2 border border-primary/20">
                            {selectedStaff.role}
                        </span>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Rating Selection */}
                        <div className="flex justify-center gap-3">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${rating >= star
                                        ? 'bg-primary text-black shadow-lg shadow-primary/20 scale-110'
                                        : 'bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10'
                                        }`}
                                >
                                    <Star size={24} fill={rating >= star ? "currentColor" : "none"} strokeWidth={3} />
                                </button>
                            ))}
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-primary px-1">Your Name (Optional)</label>
                                <input
                                    type="text"
                                    value={customerName}
                                    onChange={e => setCustomerName(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 outline-none focus:border-primary/50 transition-all text-sm"
                                    placeholder="e.g. Rahul Verma"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-primary px-1">Feedback</label>
                                <textarea
                                    value={comment}
                                    onChange={e => setComment(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 outline-none focus:border-primary/50 transition-all text-sm min-h-[120px] resize-none"
                                    placeholder="Exceptional service! Very attentive and friendly..."
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                type="button"
                                onClick={() => setSelectedStaff(null)}
                                className="flex-1 py-4 font-black uppercase tracking-widest text-[10px] bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitMutation.isPending}
                                className="flex-1 py-4 font-black uppercase tracking-widest text-[10px] bg-primary text-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {submitMutation.isPending ? 'Submitting...' : 'Submit Review'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            )}

            <div className="mt-12 text-center p-8 bg-black/40 rounded-[2.5rem] border border-white/5">
                <SparklesIcon className="mx-auto text-primary mb-4 animate-pulse" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Excellence Program</p>
                <p className="text-xs text-white/20 mt-2 italic px-8">Participate in our excellence program to win special rewards and discounts on your next visit.</p>
            </div>
        </div>
    );
};

// Internal Helper Component
const SparklesIcon = ({ className }) => (
    <div className={className}>
        <div className="flex gap-1 justify-center">
            <Star size={12} fill="currentColor" strokeWidth={0} />
            <Star size={20} fill="currentColor" strokeWidth={0} />
            <Star size={12} fill="currentColor" strokeWidth={0} />
        </div>
    </div>
);

export default RateStaff;
