import { motion } from 'framer-motion';
import { ChefHat, Sparkles } from 'lucide-react';

const Logo = ({ className = "w-auto h-10", iconOnly = false, variant = "default" }) => {
    const textColor = variant === "inverse" ? "text-background" : "text-foreground";
    const subTextColor = variant === "inverse" ? "text-background/60" : "text-muted-foreground";

    return (
        <div className={`flex items-center gap-3.5 ${className}`}>
            <div className="relative group shrink-0">
                {/* Glow Aura */}
                <div className="absolute -inset-1 bg-gradient-to-r from-primary via-accent to-purple-500 rounded-2xl blur-md opacity-60 group-hover:opacity-100 transition-opacity duration-500" />

                <motion.div
                    whileHover={{ scale: 1.05, rotate: 2 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative w-11 h-11 flex items-center justify-center bg-gradient-to-br from-indigo-600 via-primary to-cyan-500 rounded-xl shadow-xl overflow-hidden border border-white/20"
                >
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/30" />
                    <ChefHat className="text-white relative z-10 w-6 h-6 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]" strokeWidth={2.5} />
                    <Sparkles className="absolute top-1 right-1 w-3 h-3 text-cyan-200 animate-pulse z-20" />
                </motion.div>
            </div>

            {!iconOnly && (
                <div className="flex flex-col -space-y-1 text-left">
                    <div className="flex items-center gap-1">
                        <span className={`font-display text-2xl font-black tracking-tight ${textColor}`}>
                            miki<span className="bg-gradient-to-r from-primary via-indigo-400 to-cyan-400 bg-clip-text text-transparent italic">OS</span>
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping inline-block mb-3" />
                    </div>
                    <span className={`text-[8px] font-extrabold uppercase tracking-[0.35em] ${subTextColor} pl-0.5`}>
                        SMART RESTAURANT OS
                    </span>
                </div>
            )}
        </div>
    );
};

export default Logo;
