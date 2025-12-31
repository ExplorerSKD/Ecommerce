import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Star, Heart, Share2, ShoppingCart, Truck, Shield, RotateCcw, Check, Loader2, ArrowLeft, User, Zap } from 'lucide-react';
import { productsApi, reviewsApi, Product, Review } from '../services/api';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('M');
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const [wishlist, setWishlist] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewStats, setReviewStats] = useState<{
    average_rating: number;
    total_reviews: number;
    rating_distribution: Record<number, number>;
  } | null>(null);

  useEffect(() => {
    const loadProduct = async () => {
      if (!id) return;

      setLoading(true);
      setError('');

      const result = await productsApi.getOne(parseInt(id));

      if (result.success && result.data) {
        // API returns { product: Product, related_products: Product[] }
        setProduct(result.data.product);

        // Load reviews for this product
        loadReviews(parseInt(id));
      } else {
        setError(result.message || 'Product not found');
      }

      setLoading(false);
    };

    loadProduct();
  }, [id]);

  const loadReviews = async (productId: number) => {
    setReviewsLoading(true);
    const result = await reviewsApi.getForProduct(productId);
    if (result.success) {
      setReviews(result.data?.data || []);
      if (result.data?.stats) {
        setReviewStats(result.data.stats);
      }
    }
    setReviewsLoading(false);
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!product) return;

    setIsAddingToCart(true);
    await addToCart(product.id, quantity, selectedSize);
    setIsAddingToCart(false);
    setAddedToCart(true);

    // Reset after 2 seconds
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!product) return;

    setIsBuyingNow(true);
    await addToCart(product.id, quantity, selectedSize);
    setIsBuyingNow(false);

    // Navigate directly to checkout
    navigate('/checkout');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.name,
          text: product?.description,
          url: window.location.href,
        });
      } catch (err) {
        // Copy to clipboard fallback
        navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  const features = [
    { icon: Truck, text: 'Free shipping on orders over ₹4,000' },
    { icon: RotateCcw, text: '30-day return policy' },
    { icon: Shield, text: '2-year warranty included' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-white py-12 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-2xl mb-4">Product Not Found</h1>
          <p className="text-gray-600 mb-8">{error || 'The product you are looking for does not exist.'}</p>
          <Link
            to="/shop"
            className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  const images = [
    product.image_url || product.image || 'https://via.placeholder.com/800',
    // Placeholder additional images
    'https://images.unsplash.com/photo-1519976691384-bd9c1d4a95fd?w=800',
    'https://images.unsplash.com/photo-1670177257750-9b47927f68eb?w=800',
  ];

  const price = parseFloat(product.price);
  const originalPrice = product.original_price ? parseFloat(product.original_price) : null;
  const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-purple-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Images */}
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="aspect-square rounded-2xl overflow-hidden bg-gray-100"
            >
              <img
                src={images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </motion.div>

            <div className="grid grid-cols-3 gap-4">
              {images.map((img, index) => (
                <motion.button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`aspect-square rounded-lg overflow-hidden border-2 ${selectedImage === index ? 'border-purple-600' : 'border-gray-200'
                    }`}
                >
                  <img src={img} alt={`View ${index + 1}`} className="w-full h-full object-cover" />
                </motion.button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center space-x-2 mb-2">
                {product.badge && (
                  <span className="bg-purple-100 text-purple-700 text-sm px-3 py-1 rounded-full">
                    {product.badge}
                  </span>
                )}
                <span className={`text-sm px-3 py-1 rounded-full ${product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                  {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>

              <h1 className="text-4xl mb-4">{product.name}</h1>

              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${i < Math.floor(parseFloat(product.rating))
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'fill-gray-200 text-gray-200'
                        }`}
                    />
                  ))}
                </div>
                <span className="text-gray-600">{product.rating} ({product.reviews_count} reviews)</span>
              </div>

              <div className="flex items-center space-x-4 mb-6">
                <span className="text-4xl text-purple-600">₹{price.toFixed(2)}</span>
                {originalPrice && (
                  <>
                    <span className="text-2xl text-gray-400 line-through">₹{originalPrice.toFixed(2)}</span>
                    <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full">Save {discount}%</span>
                  </>
                )}
              </div>

              <p className="text-gray-600 mb-6">
                {product.description || 'High-quality product with premium materials and excellent craftsmanship.'}
              </p>
            </motion.div>

            {/* Size Selection */}
            <div>
              <h3 className="mb-3">Select Size</h3>
              <div className="flex flex-wrap gap-3">
                {sizes.map((size) => (
                  <motion.button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-12 h-12 rounded-lg border-2 transition-colors ${selectedSize === size
                      ? 'border-purple-600 bg-purple-50 text-purple-600'
                      : 'border-gray-300 hover:border-purple-400'
                      }`}
                  >
                    {size}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <h3 className="mb-3">Quantity</h3>
              <div className="flex items-center space-x-4">
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2 hover:bg-gray-100 transition-colors"
                  >
                    -
                  </button>
                  <span className="px-6 py-2 border-x border-gray-300">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="px-4 py-2 hover:bg-gray-100 transition-colors"
                  >
                    +
                  </button>
                </div>
                <span className="text-gray-600">Only {product.stock} items left!</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAddToCart}
                disabled={isAddingToCart || product.stock === 0}
                className={`flex-1 py-4 rounded-xl flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transition-all ${addedToCart
                  ? 'bg-green-500 text-white'
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                  } disabled:opacity-50`}
              >
                {isAddingToCart ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : addedToCart ? (
                  <>
                    <Check className="w-5 h-5" />
                    <span>Added to Cart!</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5" />
                    <span>Add to Cart</span>
                  </>
                )}
              </motion.button>

              {/* Buy Now Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleBuyNow}
                disabled={isBuyingNow || product.stock === 0}
                className="flex-1 py-4 rounded-xl flex items-center justify-center space-x-2 bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
              >
                {isBuyingNow ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    <span>Buy Now</span>
                  </>
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setWishlist(!wishlist)}
                className={`p-4 border-2 rounded-xl transition-colors ${wishlist
                  ? 'border-red-500 bg-red-50 text-red-500'
                  : 'border-gray-300 hover:border-purple-600 hover:text-purple-600'
                  }`}
              >
                <Heart className={`w-6 h-6 ${wishlist ? 'fill-red-500' : ''}`} />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleShare}
                className="p-4 border-2 border-gray-300 rounded-xl hover:border-purple-600 hover:text-purple-600 transition-colors"
              >
                <Share2 className="w-6 h-6" />
              </motion.button>
            </div>

            {/* Features */}
            <div className="border-t border-gray-200 pt-6 space-y-4">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-purple-600" />
                    </div>
                    <span className="text-gray-700">{feature.text}</span>
                  </div>
                );
              })}
            </div>

            {/* Category Link */}
            {product.category && (
              <div className="border-t border-gray-200 pt-6">
                <p className="text-gray-600">
                  Category:{' '}
                  <Link
                    to={`/shop?category=${product.category.slug}`}
                    className="text-purple-600 hover:underline"
                  >
                    {product.category.name}
                  </Link>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Customer Reviews Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-16"
        >
          <h2 className="text-2xl font-bold mb-8">Customer Reviews</h2>

          {reviewsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="bg-gray-50 rounded-2xl p-8 text-center">
              <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No reviews yet</h3>
              <p className="text-gray-600">Be the first to review this product after purchasing!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Reviews Summary */}
              {reviewStats && (
                <div className="bg-gray-50 rounded-2xl p-6 mb-8">
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-purple-600">{reviewStats.average_rating.toFixed(1)}</div>
                      <div className="flex items-center justify-center space-x-1 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${i < Math.floor(reviewStats.average_rating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'fill-gray-200 text-gray-200'
                              }`}
                          />
                        ))}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">{reviewStats.total_reviews} reviews</div>
                    </div>
                    <div className="flex-1 space-y-2">
                      {[5, 4, 3, 2, 1].map((star) => {
                        const count = reviewStats.rating_distribution[star] || 0;
                        const percentage = reviewStats.total_reviews > 0
                          ? (count / reviewStats.total_reviews) * 100
                          : 0;
                        return (
                          <div key={star} className="flex items-center space-x-2">
                            <span className="text-sm w-3">{star}</span>
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-yellow-400 rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-500 w-8">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Individual Reviews */}
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-white border border-gray-200 rounded-xl p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{review.user?.name || 'Customer'}</p>
                          <div className="flex items-center space-x-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${i < review.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'fill-gray-200 text-gray-200'
                                  }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {review.title && (
                      <h4 className="font-semibold mb-2">{review.title}</h4>
                    )}
                    {review.comment && (
                      <p className="text-gray-600">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
