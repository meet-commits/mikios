import { motion } from "framer-motion";

const Privacy = () => {
    return (
        <div className="min-h-screen bg-background pt-32 pb-20 px-4">
            <div className="max-w-4xl mx-auto glass-card p-8 md:p-12 rounded-3xl">
                <h1 className="text-4xl font-display font-bold mb-8 text-gradient">Privacy Policy</h1>

                <div className="space-y-6 text-muted-foreground leading-relaxed">
                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-3">1. Information We Collect</h2>
                        <p>We collect restaurant details, menu data, and business contact information provided during registration. We also collect usage data to improve our service.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-3">2. How We Use Data</h2>
                        <p>Your data is used to provide the mikiOS platform services, process subscriptions, and communicate important updates regarding your account.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-3">3. Payment Information</h2>
                        <p>We do not store credit card details. All payment processing is handled securely by our licensed payment partners.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-3">4. Third-Party Services</h2>
                        <p>We may use third-party tools for analytics (e.g. Google Analytics) and AI processing (e.g. Google Gemini for Chef AI). These services handle data according to their own privacy policies.</p>
                    </section>

                    <p className="text-sm pt-8 border-t border-border">Last updated: February 9, 2026</p>
                </div>
            </div>
        </div>
    );
};

export default Privacy;
