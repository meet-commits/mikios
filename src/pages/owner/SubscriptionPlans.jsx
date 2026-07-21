import React, { useState, useEffect } from 'react';
import { Check, Zap, Rocket, Building2, Loader } from 'lucide-react';
import { motion } from 'framer-motion';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import axios from 'axios';
import StripeCheckout from '../../components/payment/StripeCheckout';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

const PLANS = [
    {
        id: 'FREE',
        name: 'Free',
        price: 0,
        priceId: 'free_plan',
        icon: Check,
        features: [
            'Up to 2 tables',
            'Basic QR Menu',
            'Digital Ordering',
            'Email support'
        ]
    },
    {
        id: 'PREMIUM',
        name: 'Premium',
        price: 25,
        priceId: 'premium_monthly',
        icon: Rocket,
        popular: true,
        features: [
            'Unlimited tables',
            'Advanced analytics',
            'Priority support',
            'Voice ordering',
            'Custom theming',
            'Inventory management',
            'White-label solution'
        ]
    }
];

const SubscriptionPlans = ({ restaurantId }) => {
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [clientSecret, setClientSecret] = useState('');
    const [loading, setLoading] = useState(false);
    const [currentSubscription, setCurrentSubscription] = useState(null);

    useEffect(() => {
        fetchCurrentSubscription();
    }, [restaurantId]);

    const fetchCurrentSubscription = async () => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const response = await axios.get(`${API_URL}/restaurants/${restaurantId}`);

            if (response.data.data.subscription) {
                setCurrentSubscription(response.data.data.subscription);
            }
        } catch (error) {
            console.error('Failed to fetch subscription:', error);
        }
    };

    const handleSelectPlan = async (plan) => {
        setSelectedPlan(plan);
        setLoading(true);

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const response = await axios.post(`${API_URL}/payments/subscription/create`, {
                restaurantId,
                planName: plan.id,
                priceId: plan.priceId
            });

            if (response.data.data.clientSecret) {
                setClientSecret(response.data.data.clientSecret);
            } else if (response.data.data.checkoutUrl) {
                // For Safepay or other redirect-based gateways
                window.location.href = response.data.data.checkoutUrl;
            } else {
                // For free plans or non-Stripe plans
                handlePaymentSuccess();
            }
        } catch (error) {
            console.error('Failed to create subscription:', error);
            const message = error.response?.data?.message || 'Failed to initiate subscription. Please try again.';
            alert(message);
            setSelectedPlan(null);
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentSuccess = () => {
        alert('Subscription activated successfully!');
        fetchCurrentSubscription();
        setSelectedPlan(null);
        setClientSecret('');
    };

    if (clientSecret && selectedPlan) {
        return (
            <div className="max-w-2xl mx-auto p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    Complete Your Subscription
                </h2>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-gray-600 dark:text-gray-400">Plan</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                            {selectedPlan.name}
                        </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
                        <span className="text-gray-900 dark:text-white font-medium">
                            Monthly Total
                        </span>
                        <span className="text-2xl font-bold text-primary-500">
                            ₹{selectedPlan.price}
                        </span>
                    </div>
                </div>

                <Elements stripe={stripePromise}>
                    <StripeCheckout
                        clientSecret={clientSecret}
                        amount={selectedPlan.price}
                        currency="usd"
                        onSuccess={handlePaymentSuccess}
                    />
                </Elements>

                <button
                    onClick={() => {
                        setSelectedPlan(null);
                        setClientSecret('');
                    }}
                    className="mt-4 w-full btn-secondary"
                >
                    Cancel
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                    Choose Your Plan
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                    Select the perfect plan for your restaurant
                </p>
            </div>

            {currentSubscription && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-8">
                    <p className="text-green-800 dark:text-green-300 text-center">
                        You are currently on the <strong>{currentSubscription.plan?.displayName}</strong> plan
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {PLANS.map((plan) => {
                    const Icon = plan.icon;
                    const isCurrentPlan = currentSubscription?.plan?.name === plan.id;

                    return (
                        <motion.div
                            key={plan.id}
                            whileHover={{ y: -8 }}
                            className={`
                                relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden
                                ${plan.popular ? 'ring-4 ring-primary-500' : 'border border-gray-200 dark:border-gray-700'}
                            `}
                        >
                            {plan.popular && (
                                <div className="absolute top-0 right-0 bg-primary-500 text-white px-4 py-1 text-sm font-semibold rounded-bl-lg">
                                    Most Popular
                                </div>
                            )}

                            <div className="p-8">
                                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center mb-4">
                                    <Icon className="w-6 h-6 text-primary-500" />
                                </div>

                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                    {plan.name}
                                </h3>

                                <div className="flex items-baseline mb-6">
                                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                                        ₹{plan.price}
                                    </span>
                                    <span className="text-gray-600 dark:text-gray-400 ml-2">
                                        /month
                                    </span>
                                </div>

                                <ul className="space-y-3 mb-8">
                                    {plan.features.map((feature, index) => (
                                        <li key={index} className="flex items-start gap-3">
                                            <Check className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" />
                                            <span className="text-gray-600 dark:text-gray-300">
                                                {feature}
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={() => handleSelectPlan(plan)}
                                    disabled={loading || isCurrentPlan}
                                    className={`
                                        w-full py-3 rounded-lg font-semibold transition-all
                                        ${plan.popular
                                            ? 'bg-primary-500 hover:bg-primary-600 text-white'
                                            : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
                                        }
                                        disabled:opacity-50 disabled:cursor-not-allowed
                                    `}
                                >
                                    {loading ? (
                                        <Loader className="w-5 h-5 animate-spin mx-auto" />
                                    ) : isCurrentPlan ? (
                                        'Current Plan'
                                    ) : (
                                        'Get Started'
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default SubscriptionPlans;
