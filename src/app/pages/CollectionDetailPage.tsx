import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { collectionsApi, productsApi, Collection, Product } from '../services/api';
import { Loader2, ArrowRight, ShoppingCart, Heart } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { wishlistApi, cartApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

export function CollectionDetailPage() {
    const { slug } = useParams<{ slug: string }>();
    const [collection, setCollection] = useState<Collection | null>(null);
    const [loading, setLoading] = useState(true);
    const { isAuthenticated } = useAuth();
    const { refreshCart } = useCart();

    useEffect(() => {
        if (slug) {
            loadCollection();
        }
    }, [slug]);

    const loadCollection = async () => {
        setLoading(true);
        const result = await collectionsApi.getOne(slug!);
        if (result.success && result.data) {
            setCollection(result.data);
        }
        setLoading(false);
    };

    const handleAddToCart = async (productId: number) => {
        if (!isAuthenticated) return;
        await cartApi.addItem(productId, 1);
        refreshCart();
    };

    const handleToggleWishlist = async (productId: number) => {
        if (!isAuthenticated) return;
        await wishlistApi.toggle(productId);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
            </div>
        );
    }

    if (!collection) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Collection Not Found</h2>
                    <Link to="/collections" className="text-purple-600 hover:underline">
                        Browse all collections
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-12">
                    <Link to="/collections" className="text-purple-600 hover:underline mb-4 inline-block">
                        ← Back to Collections
                    </Link>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl font-bold text-gray-900 mb-4"
                    >
                        {collection.name}
                    </motion.h1>
                    {collection.description && (
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-gray-600 max-w-2xl"
                        >
                            {collection.description}
                        </motion.p>
                    )}
                </div>

                {/* Products Grid */}
                {collection.products && collection.products.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {collection.products.map((product, index) => (
                            <motion.div
                                key={product.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-white rounded-xl shadow-sm overflow-hidden group"
                            >
                                <Link to={`/product/${product.id}`}>
                                    <div className="aspect-square bg-gray-100 relative overflow-hidden">
                                        {product.image && (
                                            <img
                                                src={product.image}
                                                alt={product.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        )}
                                        {product.badge && (
                                            <span className="absolute top-3 left-3 bg-purple-600 text-white text-xs px-3 py-1 rounded-full">
                                                {product.badge}
                                            </span>
                                        )}
                                    </div>
                                </Link>
                                <div className="p-4">
                                    <Link to={`/product/${product.id}`}>
                                        <h3 className="font-semibold text-gray-900 mb-1 hover:text-purple-600 transition-colors">
                                            {product.name}
                                        </h3>
                                    </Link>
                                    <p className="text-purple-600 font-bold mb-4">
                                        ₹{parseFloat(product.price).toFixed(2)}
                                    </p>
                                    <div className="flex space-x-2">
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => handleAddToCart(product.id)}
                                            className="flex-1 flex items-center justify-center space-x-2 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
                                        >
                                            <ShoppingCart className="w-4 h-4" />
                                            <span>Add to Cart</span>
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleToggleWishlist(product.id)}
                                            className="p-2 border border-gray-200 rounded-lg hover:bg-red-50 hover:border-red-200 transition-colors"
                                        >
                                            <Heart className="w-5 h-5 text-gray-400 hover:text-red-500" />
                                        </motion.button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-xl p-12 text-center text-gray-500">
                        No products in this collection yet.
                    </div>
                )}
            </div>
        </div>
    );
}
