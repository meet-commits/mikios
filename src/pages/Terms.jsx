import { motion } from "framer-motion";

const Terms = () => {
    return (
        <div className="min-h-screen bg-background pt-32 pb-20 px-4">
            <div className="max-w-4xl mx-auto glass-card p-8 md:p-12 rounded-3xl">
                <h1 className="text-4xl font-display font-bold mb-8 text-gradient">Terms of Service</h1>

                <div className="space-y-6 text-muted-foreground leading-relaxed">
                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
                        <p>By accessing and using mikiOS, you agree to be bound by these Terms of Service. If you do not agree, please do not use our services.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-3">2. Description of Service</h2>
                        <p>mikiOS provides a restaurant management platform including digital menus, order tracking, and kitchen management systems.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-3">3. Subscription and Billing</h2>
                        <p>Our Premium plan is billed monthly at ₹2,499 INR (or local equivalent). Payments are processed securely via our billing partners or manual invoice. You can cancel your subscription at any time.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-3">4. Refund Policy</h2>
                        <p>We offer a 14-day money-back guarantee for new subscriptions. If you are not satisfied, contact our support team within 14 days of your first payment for a full refund.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-3">5. User Responsibilities</h2>
                        <p>Users are responsible for maintaining the confidentiality of their account. mikiOS is not liable for any loss or damage arising from unauthorized access to your account.</p>
                    </section>

                    <p className="text-sm pt-8 border-t border-border">Last updated: February 9, 2026</p>
                </div>
            </div>
        </div>
    );
};

export default Terms;
