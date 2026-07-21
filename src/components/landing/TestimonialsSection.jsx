import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { AnimatedSection, StaggerContainer, StaggerItem } from "../ui/animated-section";

const testimonials = [
    {
        name: "Meet Vaghela",
        role: "Founder & Lead Architect, mikiOS",
        content: "We engineered mikiOS to eliminate restaurant operational bottlenecks. Seeing restaurants increase revenue by over 35% with our QR & live order architecture is phenomenal.",
        rating: 5,
        image: "MV",
    },
    {
        name: "Aisha Ahmed",
        role: "Manager, Spice Village",
        content: "Our table turnover rate improved by 30% during peak hours. Customers love the instant digital close, and it frees up my staff.",
        rating: 5,
        image: "AA",
    },
    {
        name: "Vikram Singh",
        role: "Chef-Owner, Tandoori Nights",
        content: "Ordering errors dropped to zero. The KDS is so much cleaner than paper tickets. Setup was surprisingly effortless.",
        rating: 5,
        image: "VS",
    },
];

export const TestimonialsSection = () => {
    return (
        <section className="section-padding bg-muted/30 relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-20 left-10 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute bottom-20 right-10 w-80 h-80 bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 max-w-7xl mx-auto">
                {/* Section Header */}
                <AnimatedSection className="text-center mb-16">
                    <span className="inline-block text-primary font-medium text-sm uppercase tracking-wider mb-4">
                        Testimonials
                    </span>
                    <h2 className="font-display text-3xl md:text-5xl font-bold mb-6">
                        Loved by{" "}
                        <span className="text-gradient">Restaurant Owners</span>
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Don't just take our word for it. Here's what our customers have to say.
                    </p>
                </AnimatedSection>

                {/* Mobile/Tablet: Carousel */}
                <div className="md:hidden relative -mx-4 sm:-mx-6">
                    <div
                        className="overflow-x-auto carousel-scrollbar snap-x snap-mandatory
                                 flex gap-4 sm:gap-6 px-4 sm:px-6 pb-4
                                 scroll-smooth touch-pan-x"
                    >
                        {testimonials.map((testimonial, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ y: -5 }}
                                className="snap-center snap-always flex-none
                                         w-[85vw] sm:w-[60vw]
                                         min-w-0 glass-card p-6 sm:p-8 rounded-3xl flex flex-col h-full"
                            >
                                <Quote className="w-8 h-8 text-primary/20 mb-4" />
                                <p className="text-foreground/80 leading-relaxed flex-1 mb-6 text-sm sm:text-base">
                                    "{testimonial.content}"
                                </p>
                                <div className="flex gap-1 mb-4">
                                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                                        <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                                    ))}
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary text-sm">
                                        {testimonial.image}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm">{testimonial.name}</p>
                                        <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Desktop: Grid */}
                <div className="hidden md:grid md:grid-cols-3 gap-8">
                    {testimonials.map((testimonial, index) => (
                        <AnimatedSection key={index} delay={index * 0.15}>
                            <motion.div
                                whileHover={{ y: -8 }}
                                className="glass-card-hover p-8 h-full flex flex-col"
                            >
                                {/* Quote Icon */}
                                <Quote className="w-10 h-10 text-primary/20 mb-4" />

                                {/* Content */}
                                <p className="text-foreground/80 leading-relaxed flex-1 mb-6">
                                    "{testimonial.content}"
                                </p>

                                {/* Rating */}
                                <div className="flex gap-1 mb-4">
                                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                                        <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                                    ))}
                                </div>

                                {/* Author */}
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                                        {testimonial.image}
                                    </div>
                                    <div>
                                        <p className="font-semibold">{testimonial.name}</p>
                                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatedSection>
                    ))}
                </div>

                {/* Social Proof */}
                <AnimatedSection delay={0.5} className="mt-16">
                    <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
                        <div className="flex items-center gap-2">
                            <div className="flex -space-x-3">
                                {["JD", "AK", "MS", "LP"].map((initials, i) => (
                                    <div
                                        key={i}
                                        className="w-10 h-10 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium"
                                    >
                                        {initials}
                                    </div>
                                ))}
                            </div>
                            <span className="text-muted-foreground ml-2">89+ restaurants already onboard</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex gap-0.5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                                ))}
                            </div>
                            <span className="font-semibold">4.9/5</span>
                            <span className="text-muted-foreground">from 200+ reviews</span>
                        </div>
                    </div>
                </AnimatedSection>
            </div>
        </section>
    );
};
