import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Heart, Trash2, ShoppingCart, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { wishlistApi, cartApi, Product } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

export function WishlistPage() {
    const navigate = useNavigate();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const { refreshCart } = useCart();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [removing, setRemoving] = useState<number | null>(null);
    const [addingToCart, setAddingToCart] = useState<number | null>(null);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            navigate('/login');
        }
    }, [isAuthenticated, authLoading, navigate]);

    useEffect(() => {
        if (isAuthenticated) {
            loadWishlist();
        }
    }, [isAuthenticated]);

    const loadWishlist = async () => {
        setLoading(true);
        const result = await wishlistApi.getAll();
        if (result.success && result.data) {
            setProducts(result.data);
        }
        setLoading(false);
    };

    const handleRemove = async (productId: number) => {
        setRemoving(productId);
        const result = await wishlistApi.remove(productId);
        if (result.success) {
            setProducts(products.filter(p => p.id !== productId));
        }
        setRemoving(null);
    };

    const handleAddToCart = async (product: Product) => {
        setAddingToCart(product.id);
        const result = await cartApi.addItem(product.id, 1);
        if (result.success) {
            await refreshCart();
            // Optionally remove from wishlist after adding to cart
            // await handleRemove(product.id);
        }
        setAddingToCart(null);
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center space-x-3 mb-8">
                    <Heart className="w-8 h-8 text-purple-600" />
                    <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
                    <span className="bg-purple-100 text-purple-600 px-3 py-1 rounded-full text-sm">
                        {products.length} items
                    </span>
                </div>

                {products.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl shadow-sm p-12 text-center"
                    >
                        <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your wishlist is empty</h2>
                        <p className="text-gray-600 mb-6">Save items you love to your wishlist</p>
                        <Link
                            to="/shop"
                            className="inline-block bg-purple-600 text-white px-8 py-3 rounded-full hover:bg-purple-700 transition-colors"
                        >
                            Start Shopping
                        </Link>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {products.map((product, index) => (
                            <motion.div
                                key={product.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white rounded-xl shadow-sm overflow-hidden group"
                            >
                                <Link to={`/product/${product.id}`}>
                                    <div className="aspect-square bg-gray-100 relative">
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
                                        {product.original_price && (
                                            <span className="text-gray-400 line-through text-sm ml-2">
                                                ₹{parseFloat(product.original_price).toFixed(2)}
                                            </span>
                                        )}
                                    </p>
                                    <div className="flex space-x-2">
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => handleAddToCart(product)}
                                            disabled={addingToCart === product.id || product.stock === 0}
                                            className="flex-1 flex items-center justify-center space-x-2 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {addingToCart === product.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <ShoppingCart className="w-4 h-4" />
                                                    <span>{product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}</span>
                                                </>
                                            )}
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleRemove(product.id)}
                                            disabled={removing === product.id}
                                            className="p-2 border border-gray-200 rounded-lg hover:bg-red-50 hover:border-red-200 transition-colors"
                                        >
                                            {removing === product.id ? (
                                                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                                            ) : (
                                                <Trash2 className="w-5 h-5 text-red-500" />
                                            )}
                                        </motion.button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
