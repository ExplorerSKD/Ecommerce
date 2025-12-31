import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { bannersApi, Banner } from '../services/api';

export function Hero() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const loadBanners = async () => {
      const result = await bannersApi.getAll();
      if (result.success && result.data && result.data.length > 0) {
        setBanners(result.data);
      }
    };
    loadBanners();
  }, []);

  // Auto-slide functionality
  useEffect(() => {
    if (banners.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length, isPaused]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  // Show dynamic banner carousel if banners exist
  if (banners.length > 0) {
    const currentBanner = banners[currentIndex];

    return (
      <section
        className="relative overflow-hidden bg-gray-900"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            {/* Banner Image */}
            <div className="relative h-[300px] sm:h-[450px] lg:h-[600px]">
              <img
                src={currentBanner.image}
                alt={currentBanner.title}
                className="w-full h-full object-cover">
              </img>
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />

              {/* Content */}
              <div className="absolute inset-0 flex items-center">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className="max-w-xl space-y-4 sm:space-y-6"
                  >
                    {currentBanner.subtitle && (
                      <span className="inline-block bg-white/20 backdrop-blur-sm text-white px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm">
                        {currentBanner.subtitle}
                      </span>
                    )}
                    <h1 className="text-2xl sm:text-4xl lg:text-6xl font-bold text-white leading-tight break-words">
                      {currentBanner.title}
                    </h1>
                    {currentBanner.description && (
                      <p className="text-gray-200 text-sm sm:text-lg max-w-md">
                        {currentBanner.description}
                      </p>
                    )}
                    <Link to={currentBanner.button_link}>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="group bg-gradient-to-r from-purple-600 to-blue-600 text-white px-5 sm:px-8 py-2.5 sm:py-4 rounded-full flex items-center space-x-2 shadow-lg hover:shadow-xl transition-shadow mt-4 text-sm sm:text-base"
                      >
                        <span>{currentBanner.button_text}</span>
                        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                      </motion.button>
                    </Link>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        {banners.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full text-white transition-colors z-10"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full text-white transition-colors z-10"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </>
        )}

        {/* Dots Indicator */}
        {banners.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all ${index === currentIndex
                  ? 'bg-white w-6 sm:w-8'
                  : 'bg-white/50 hover:bg-white/70'
                  }`}
              />
            ))}
          </div>
        )}
      </section>
    );
  }

  // Fallback to default hero when no banners exist
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 py-12 sm:py-20 lg:py-32">
      {/* Animated Background Elements */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 90, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute top-0 right-0 w-48 sm:w-96 h-48 sm:h-96 bg-purple-300/30 rounded-full blur-3xl"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          rotate: [0, -90, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute bottom-0 left-0 w-48 sm:w-96 h-48 sm:h-96 bg-blue-300/30 rounded-full blur-3xl"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center space-x-2 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-purple-200"
            >
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span className="text-sm text-purple-600">New Collection 2024</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-3xl sm:text-5xl lg:text-7xl"
            >
              Discover Your
              <span className="block bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 bg-clip-text text-transparent">
                Perfect Style
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-base sm:text-xl text-gray-600 max-w-lg"
            >
              Explore our curated collection of premium products designed for the modern lifestyle.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-wrap gap-3 sm:gap-4"
            >
              <Link to="/shop">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="group bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full flex items-center space-x-2 shadow-lg hover:shadow-xl transition-shadow text-sm sm:text-base"
                >
                  <span>Shop Now</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </Link>

              <Link to="/collections">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-white text-gray-700 px-6 sm:px-8 py-3 sm:py-4 rounded-full border border-gray-300 hover:border-purple-600 hover:text-purple-600 transition-colors text-sm sm:text-base"
                >
                  View Collections
                </motion.button>
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="grid grid-cols-3 gap-4 sm:gap-8 pt-6 sm:pt-8"
            >
              {[
                { value: '10k+', label: 'Products' },
                { value: '50k+', label: 'Happy Customers' },
                { value: '4.9', label: 'Rating' }
              ].map((stat, index) => (
                <div key={index}>
                  <div className="text-xl sm:text-3xl text-purple-600 font-semibold">{stat.value}</div>
                  <div className="text-xs sm:text-base text-gray-600">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right Image */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <motion.div
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="relative z-10"
            >
              <img
                src="https://images.unsplash.com/photo-1516763449302-78450e5a507d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwbGlmZXN0eWxlfGVufDF8fHx8MTc2Njk0NzkxNnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Fashion lifestyle"
                className="rounded-3xl shadow-2xl w-full"
              />
            </motion.div>

            {/* Floating Cards - Hidden on mobile */}
            <motion.div
              animate={{ y: [0, 15, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="hidden sm:block absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-4 z-20"
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white">
                  ✓
                </div>
                <div>
                  <div className="text-sm text-gray-500">Free Shipping</div>
                  <div>On orders over ₹4,000</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
