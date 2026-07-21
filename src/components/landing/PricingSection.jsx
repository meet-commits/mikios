import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Globe, Sparkles, ArrowRight, Zap, Star, ShieldCheck, Heart } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import AnimatedSection, { StaggerContainer, StaggerItem } from "../ui/animated-section";

const BASE_PRICE = 25;

const CURRENCY_MAP = {
    USD: { symbol: "$", rate: 1, name: "United States" },
    GBP: { symbol: "£", rate: 0.8, name: "United Kingdom" },
    EUR: { symbol: "€", rate: 0.92, name: "Europe" },
    INR: { symbol: "₹", rate: 83, name: "India" },
    PKR: { symbol: "Rs. ", rate: 120, name: "Pakistan" },
    CAD: { symbol: "C$", rate: 1.35, name: "Canada" },
    AUD: { symbol: "A$", rate: 1.5, name: "Australia" },
};

const getPlanFeatures = (isPremium) => {
    if (!isPremium) {
        return [
            "Digital Menu (Unlimited items)",
            "Up to 5 Smart QR Tables",
            "Real-time QR Scanning",
            "Basic Restaurant Dashboard",
            "Single User Access",
            "Standard Support",
        ];
    }
    return [
        "Unlimited Tables & Menus",
        "Live Ordering System (Real-time)",
        "Chef AI Assistant (Gemini)",
        "Inventory & Stock Engine",
        "Service Request Hub",
        "Advanced Sales Analytics",
        "Founding Partner Benefits",
        "Staff Roles (Chef/Admin)",
        "24/7 Priority Support",
    ];
};

export const PricingSection = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [currency, setCurrency] = useState({ code: "INR", symbol: "₹", rate: 83, name: "India" });
    const [isDetecting, setIsDetecting] = useState(true);

    useEffect(() => {
        const detectCurrency = async () => {
            setIsDetecting(true);

            // Priority 1: GeoJS (CORS friendly, HTTPS free)
            try {
                const response = await fetch('https://get.geojs.io/v1/ip/geo.json');
                const data = await response.json();

                if (data.country_code) {
                    const countryCode = data.country_code;
                    // Map common currencies
                    const currencyCode = countryCode === 'PK' ? 'PKR' :
                        countryCode === 'GB' ? 'GBP' :
                            countryCode === 'CA' ? 'CAD' :
                                countryCode === 'IN' ? 'INR' :
                                    countryCode === 'AU' ? 'AUD' : 'USD';

                    if (CURRENCY_MAP[currencyCode]) {
                        setCurrency({
                            code: currencyCode,
                            ...CURRENCY_MAP[currencyCode],
                            name: data.country || "Global"
                        });
                        setIsDetecting(false);
                        return;
                    }
                }
            } catch (error) {
                // Silent fail to avoid console noise
            }

            // Fallback: Browser Locale
            const locale = navigator.language || "en-US";
            const region = locale.split("-")[1] || "US";
            const code = region === "PK" ? "PKR" : region === "GB" ? "GBP" : region === "IN" ? "INR" : "USD";

            setCurrency({
                code,
                ...CURRENCY_MAP[code],
                name: region === "PK" ? "Pakistan" : region === "GB" ? "United Kingdom" : "Global"
            });
            setIsDetecting(false);
        };

        detectCurrency();
    }, []);

    const handlePlanClick = (plan) => {
        // Since it's manual activation, scroll to contact
        const contactSection = document.getElementById('contact');
        if (contactSection) {
            contactSection.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const formatPrice = (price) => {
        if (price === "0") return "0";
        const converted = (parseFloat(price) * currency.rate).toFixed(0);
        return converted;
    };

    const plans = [
        {
            name: "Starter",
            price: "0",
            description: "Essential tools for family-owned cafes and small bistros.",
            features: getPlanFeatures(false),
            highlighted: false,
        },
        {
            name: "Business OS",
            price: BASE_PRICE.toString(),
            description: "The complete engine for high-volume dining operations.",
            features: getPlanFeatures(true),
            highlighted: true,
        },
    ];

    return (
        <section id="pricing" className="section-padding relative overflow-hidden">
            {/* Background */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />

            <div className="relative z-10 max-w-7xl mx-auto">
                {/* Section Header */}
                <AnimatedSection className="text-center mb-12 sm:mb-16">
                    <div className="flex items-center justify-center gap-2 text-primary font-medium text-sm uppercase tracking-wider mb-3 sm:mb-4">
                        <Star className="w-4 h-4" />
                        <span>Founding Partner Offer - Unlimited Lifetime Access Plans</span>
                    </div>
                    <h2 className="font-display text-3xl md:text-5xl font-bold mb-4 sm:mb-6 leading-tight">
                        Built to <span className="text-gradient">Scale Your Profits</span>
                    </h2>
                    <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto leading-relaxed italic">
                        No hidden fees. No complicated tiers. Choose the plan that fits your current volume and grow from there.
                    </p>
                </AnimatedSection>

                {/* Mobile/Tablet: Carousel | Desktop: Grid */}
                <div className="md:hidden relative max-w-6xl mx-auto -mx-4 sm:-mx-6">
                    <div
                        className="overflow-x-auto carousel-scrollbar snap-x snap-mandatory
                                 flex gap-6 sm:gap-8 px-4 sm:px-6 pb-4
                                 scroll-smooth touch-pan-x"
                    >
                        {plans.map((plan, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.15 }}
                                whileHover={{ y: -8 }}
                                className={`snap-center snap-always flex-none
                                          w-[90vw] sm:w-[70vw]
                                          min-w-0 relative rounded-3xl p-6 sm:p-8 transition-all duration-300 ${plan.highlighted
                                        ? "bg-foreground text-background shadow-2xl"
                                        : "glass-card"
                                    }`}
                            >
                                {plan.highlighted && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                        <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                                            <Sparkles className="w-4 h-4" />
                                            Most Popular
                                        </div>
                                    </div>
                                )}

                                <div className="mb-6 sm:mb-8">
                                    <h3 className="font-display text-xl sm:text-2xl font-semibold mb-2 leading-tight">{plan.name}</h3>
                                    <p className={`text-sm leading-relaxed ${plan.highlighted ? "text-background/60" : "text-muted-foreground"}`}>
                                        {plan.description}
                                    </p>
                                </div>

                                <div className="mb-6 sm:mb-8">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl md:text-5xl font-bold">{currency.symbol}{formatPrice(plan.price)}</span>
                                        <span className={`${plan.highlighted ? "text-background/60" : "text-muted-foreground"}`}>
                                            /month
                                        </span>
                                    </div>
                                </div>

                                <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${plan.highlighted ? "bg-primary" : "bg-primary/10"
                                                }`}>
                                                <Check className={`w-3 h-3 ${plan.highlighted ? "text-primary-foreground" : "text-primary"}`} />
                                            </div>
                                            <span className={`text-sm leading-relaxed ${plan.highlighted ? "text-background/80" : "text-muted-foreground"}`}>
                                                {feature}
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                    <button
                                        onClick={() => handlePlanClick(plan)}
                                        className={`w-full h-11 sm:h-12 rounded-xl font-medium transition-all ${plan.highlighted
                                            ? "btn-primary"
                                            : "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                                            }`}
                                    >
                                        Get Started
                                    </button>
                                </motion.div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Desktop: Grid */}
                <StaggerContainer className="hidden md:grid grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {plans.map((plan, index) => (
                        <StaggerItem key={index}>
                            <motion.div
                                whileHover={{ y: -8 }}
                                className={`relative h-full rounded-3xl p-8 transition-all duration-300 ${plan.highlighted
                                    ? "bg-foreground text-background shadow-2xl scale-105"
                                    : "glass-card"
                                    }`}
                            >
                                {plan.highlighted && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                        <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                                            <Sparkles className="w-4 h-4" />
                                            Most Popular
                                        </div>
                                    </div>
                                )}

                                <div className="mb-8">
                                    <h3 className="font-display text-2xl font-semibold mb-2 leading-tight">{plan.name}</h3>
                                    <p className={`text-sm leading-relaxed ${plan.highlighted ? "text-background/60" : "text-muted-foreground"}`}>
                                        {plan.description}
                                    </p>
                                </div>

                                <div className="mb-8">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl md:text-5xl font-bold">{currency.symbol}{formatPrice(plan.price)}</span>
                                        <span className={`${plan.highlighted ? "text-background/60" : "text-muted-foreground"}`}>
                                            /month
                                        </span>
                                    </div>
                                </div>

                                <ul className="space-y-4 mb-8">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${plan.highlighted ? "bg-primary" : "bg-primary/10"
                                                }`}>
                                                <Check className={`w-3 h-3 ${plan.highlighted ? "text-primary-foreground" : "text-primary"}`} />
                                            </div>
                                            <span className={`text-sm leading-relaxed ${plan.highlighted ? "text-background/80" : "text-muted-foreground"}`}>
                                                {feature}
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                    <button
                                        onClick={() => handlePlanClick(plan)}
                                        className={`w-full h-12 rounded-xl font-medium transition-all ${plan.highlighted
                                            ? "btn-primary"
                                            : "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                                            }`}
                                    >
                                        Get Started
                                    </button>
                                </motion.div>
                            </motion.div>
                        </StaggerItem>
                    ))}
                </StaggerContainer>

                {/* FAQ Link */}
                <AnimatedSection delay={0.4} className="text-center mt-10 sm:mt-12">
                    <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                        Have questions?{" "}
                        <a href="#contact" className="text-primary hover:underline font-medium">
                            Contact our sales team
                        </a>
                    </p>
                </AnimatedSection>
            </div>
        </section>
    );
};
