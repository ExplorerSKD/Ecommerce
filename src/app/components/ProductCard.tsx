import { motion } from 'motion/react';
import { ShoppingCart, Heart, Eye, Star } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { wishlistApi } from '../services/api';
import { useState } from 'react';

interface ProductCardProps {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviews: number;
  badge?: string;
  index: number;
}

export function ProductCard({
  id,
  name,
  price,
  originalPrice,
  image,
  rating,
  reviews,
  badge,
  index
}: ProductCardProps) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setIsAdding(true);
    const result = await addToCart(id, 1);
    setIsAdding(false);

    if (result.success) {
      // Could show a toast here
      console.log('Added to cart!');
    } else {
      alert(result.message || 'Failed to add to cart');
    }
  };

  const handleAddToWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const result = await wishlistApi.toggle(id);
    if (result.success) {
      console.log(result.data?.in_wishlist ? 'Added to wishlist!' : 'Removed from wishlist!');
    } else {
      alert(result.message || 'Failed to update wishlist');
    }
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/product/${id}`);
  };

  return (
    <Link to={`/product/${id}`}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300"
      >
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500';
            }}
          />

          {/* Badge */}
          {badge && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm"
            >
              {badge}
            </motion.div>
          )}

          {/* Quick Actions */}
          <div className="absolute top-4 right-4 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleAddToWishlist}
              className="bg-white p-2 rounded-full shadow-lg hover:bg-purple-600 hover:text-white transition-colors"
              title="Add to Wishlist"
            >
              <Heart className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleQuickView}
              className="bg-white p-2 rounded-full shadow-lg hover:bg-purple-600 hover:text-white transition-colors"
              title="Quick View"
            >
              <Eye className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Add to Cart Button (Appears on Hover) */}
          <motion.button
            initial={{ y: 100 }}
            whileHover={{ y: 0 }}
            onClick={handleAddToCart}
            disabled={isAdding}
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 flex items-center justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 disabled:opacity-50"
          >
            <ShoppingCart className="w-5 h-5" />
            <span>{isAdding ? 'Adding...' : 'Add to Cart'}</span>
          </motion.button>
        </div>

        {/* Product Info */}
        <div className="p-2 sm:p-4 space-y-1 sm:space-y-3">
          <h3 className="text-sm sm:text-base text-gray-800 group-hover:text-purple-600 transition-colors line-clamp-2">
            {name}
          </h3>

          {/* Rating */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 sm:w-4 sm:h-4 ${i < Math.floor(rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                    }`}
                />
              ))}
            </div>
            <span className="text-xs sm:text-sm text-gray-500">({reviews})</span>
          </div>

          {/* Price */}
          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
            <span className="text-lg sm:text-2xl text-purple-600 font-semibold">₹{price.toFixed(0)}</span>
            {originalPrice && (
              <span className="text-xs sm:text-sm text-gray-400 line-through">₹{originalPrice.toFixed(0)}</span>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
