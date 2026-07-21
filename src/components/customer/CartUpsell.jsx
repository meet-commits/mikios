import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import api from '../../config/api';
import { useCart } from '../../context/CartContext';
import toast from 'react-hot-toast';

const CartUpsell = ({ restaurantId }) => {
    const { addToCart } = useCart();

    // Fetch potential upsell items (e.g., Drinks, Desserts, or low price items)
    const { data: upsellItems } = useQuery({
        queryKey: ['menu', 'upsell', restaurantId],
        queryFn: async () => {
            const res = await api.get(`/menu?restaurant=${restaurantId}`);
            // Simple logic: Get items < $15 that are Beverages or Desserts, or just random low cost.
            // For now, filtering by price < 15 to find "add-ons"
            const allItems = res.data.data || [];
            return allItems
                .filter(item => item.price < 15 && item.isAvailable)
                .sort(() => 0.5 - Math.random()) // Shuffle
                .slice(0, 5); // Take 5
        },
        enabled: !!restaurantId,
        staleTime: 1000 * 60 * 5 // 5 mins
    });

    if (!upsellItems || upsellItems.length === 0) return null;

    const handleQuickAdd = (item) => {
        addToCart(item, 1);
        toast.success(`Added ${item.name}!`);
    };

    return (
        <div className="mt-8 mb-24">
            <h3 className="text-lg font-bold mb-4 px-1">Complete your meal</h3>
            <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar px-1">
                {upsellItems.map(item => (
                    <div
                        key={item._id}
                        className="flex-shrink-0 w-40 bg-white/5 border border-white/5 rounded-xl overflow-hidden p-3 flex flex-col gap-2 hover:bg-white/10 transition-colors"
                    >
                        <div className="h-24 w-full bg-gray-800 rounded-lg overflow-hidden">
                            {item.image ? (
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gray-700" />
                            )}
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-sm line-clamp-1">{item.name}</h4>
                            <p className="text-xs text-gray-400 font-mono">₹{item.price}</p>
                        </div>
                        <button
                            onClick={() => handleQuickAdd(item)}
                            className="w-full bg-white/10 hover:bg-white/20 text-primary py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                        >
                            <Plus size={14} /> Add
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CartUpsell;
