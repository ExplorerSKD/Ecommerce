import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Hero } from '../components/Hero';
import { CategoryCard } from '../components/CategoryCard';
import { ProductCard } from '../components/ProductCard';
import { motion } from 'motion/react';
import { TrendingUp, Shield, Truck, HeadphonesIcon, Loader2 } from 'lucide-react';
import { productsApi, categoriesApi, Product, Category } from '../services/api';

interface PromoSettings {
  promo_enabled: boolean;
  promo_badge: string;
  promo_title: string;
  promo_description: string;
  promo_button_text: string;
  promo_button_link: string;
}

export function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [promoSettings, setPromoSettings] = useState<PromoSettings>({
    promo_enabled: true,
    promo_badge: 'Limited Time Offer',
    promo_title: 'Up to 50% Off',
    promo_description: "Don't miss out on our biggest sale of the season. Premium products at unbeatable prices.",
    promo_button_text: 'Shop Sale Now',
    promo_button_link: '/shop',
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      // Load featured products
      const productsResult = await productsApi.getAll({ per_page: 8, featured: true });
      if (productsResult.success && productsResult.data) {
        setProducts(productsResult.data.data || []);
      }

      // Load categories
      const categoriesResult = await categoriesApi.getHome();
      if (categoriesResult.success && categoriesResult.data) {
        setCategories(categoriesResult.data);
      }

      // Load promo settings from localStorage
      const savedSettings = localStorage.getItem('promo_settings');
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          setPromoSettings(parsed);
        } catch (e) {
          // Use defaults
        }
      }

      setLoading(false);
    };

    loadData();
  }, []);

  const features = [
    {
      icon: Truck,
      title: 'Free Shipping',
      description: 'On orders over ₹4,000',
    },
    {
      icon: Shield,
      title: 'Secure Payment',
      description: '100% secure transactions',
    },
    {
      icon: HeadphonesIcon,
      title: '24/7 Support',
      description: 'Dedicated customer service',
    },
    {
      icon: TrendingUp,
      title: 'Best Quality',
      description: 'Premium products only',
    },
  ];

  return (
    <>
      <Hero />

      {/* Features Section */}
      <section className="py-10 sm:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="text-center space-y-2 sm:space-y-3 p-4 sm:p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
                >
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                    className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full"
                  >
                    <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
                  </motion.div>
                  <h3 className="text-sm sm:text-base text-gray-900 font-medium">{feature.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-600">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-12 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8 sm:mb-12"
          >
            <h2 className="text-2xl sm:text-4xl mb-2 sm:mb-4">Shop by Category</h2>
            <p className="text-base sm:text-xl text-gray-600">
              Explore our curated collections
            </p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {categories.map((category, index) => (
              <CategoryCard
                key={category.id}
                title={category.name}
                image={category.image || `https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500`}
                itemCount={`${category.products_count || 50}+ items`}
                slug={category.slug}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-12 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8 sm:mb-12"
          >
            <h2 className="text-2xl sm:text-4xl mb-2 sm:mb-4">Featured Products</h2>
            <p className="text-base sm:text-xl text-gray-600">
              Discover our bestselling items
            </p>
          </motion.div>

          {loading ? (
            <div className="flex justify-center py-12 sm:py-20">
              <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 text-purple-600 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {products.map((product, index) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  price={parseFloat(product.price)}
                  originalPrice={product.original_price ? parseFloat(product.original_price) : undefined}
                  image={product.image_url || product.image || 'https://via.placeholder.com/300'}
                  rating={parseFloat(product.rating)}
                  reviews={product.reviews_count}
                  badge={product.badge || undefined}
                  index={index}
                />
              ))}
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-8 sm:mt-12"
          >
            <Link to="/shop">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 sm:px-10 py-3 sm:py-4 rounded-full shadow-lg hover:shadow-xl transition-shadow text-sm sm:text-base"
              >
                View All Products
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Special Offer Banner */}
      {promoSettings.promo_enabled && (
        <section className="py-12 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative overflow-hidden bg-gradient-to-r from-purple-900 via-blue-900 to-pink-900 rounded-2xl sm:rounded-3xl p-6 sm:p-12 text-center text-white"
            >
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 180, 360],
                }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="absolute top-0 right-0 w-32 sm:w-64 h-32 sm:h-64 bg-purple-500/20 rounded-full blur-3xl"
              />
              <motion.div
                animate={{
                  scale: [1, 1.3, 1],
                  rotate: [360, 180, 0],
                }}
                transition={{
                  duration: 15,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="absolute bottom-0 left-0 w-32 sm:w-64 h-32 sm:h-64 bg-blue-500/20 rounded-full blur-3xl"
              />

              <div className="relative z-10 space-y-4 sm:space-y-6">
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="inline-block bg-white/20 backdrop-blur-sm px-4 sm:px-6 py-1 sm:py-2 rounded-full text-xs sm:text-sm"
                >
                  {promoSettings.promo_badge}
                </motion.div>
                <h2 className="text-3xl sm:text-5xl">
                  {promoSettings.promo_title}
                </h2>
                <p className="text-base sm:text-xl text-white/90 max-w-2xl mx-auto px-2">
                  {promoSettings.promo_description}
                </p>
                <Link to={promoSettings.promo_button_link}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-white text-purple-900 px-8 sm:px-10 py-3 sm:py-4 rounded-full mt-4 sm:mt-6 text-sm sm:text-base font-medium"
                  >
                    {promoSettings.promo_button_text}
                  </motion.button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      )}
    </>
  );
}
