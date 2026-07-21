import { motion } from 'framer-motion';
import { ChefHat } from 'lucide-react';

const Logo = ({ className = "w-auto h-10", iconOnly = false, variant = "default" }) => {
    const textColor = variant === "inverse" ? "text-background" : "text-foreground";
    const subTextColor = variant === "inverse" ? "text-background/60" : "text-muted-foreground";

    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <div className="relative group shrink-0">
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative w-12 h-12 flex items-center justify-center bg-primary rounded-xl shadow-lg shadow-primary/20 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                    <ChefHat className="text-black relative z-10 w-7 h-7" strokeWidth={2.5} />
                </motion.div>
            </div>

            {!iconOnly && (
                <div className="flex flex-col -space-y-1 text-left">
                    <span className={`font-display text-2xl font-black tracking-tight ${textColor}`}>
                        miki<span className="text-primary italic">OS</span>
                    </span>
                    <span className={`text-[8px] font-bold uppercase tracking-[0.3em] ${subTextColor} pl-0.5`}>
                        Modern Restaurant OS
                    </span>
                </div>
            )}
        </div>
    );
};

export default Logo;
