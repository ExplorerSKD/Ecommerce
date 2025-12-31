import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ProductCard } from '../components/ProductCard';
import { SlidersHorizontal, ChevronDown, Loader2 } from 'lucide-react';
import { productsApi, categoriesApi, Product, Category } from '../services/api';

export function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      const result = await categoriesApi.getAll();
      if (result.success && result.data) {
        setCategories(result.data);
      }
    };
    fetchCategories();
  }, []);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);

      const params: any = {
        page: currentPage,
        per_page: 12,
      };

      if (selectedCategory !== 'all') {
        params.category = selectedCategory;
      }

      if (priceRange[1] < 1000) {
        params.max_price = priceRange[1];
      }

      // Map sort options
      if (sortBy === 'price-low') {
        params.sort_by = 'price';
        params.sort_order = 'asc';
      } else if (sortBy === 'price-high') {
        params.sort_by = 'price';
        params.sort_order = 'desc';
      } else if (sortBy === 'newest') {
        params.sort_by = 'created_at';
        params.sort_order = 'desc';
      }

      const result = await productsApi.getAll(params);

      if (result.success && result.data) {
        setProducts(result.data.data);
        setTotalPages(result.data.last_page);
        setTotalProducts(result.data.total);
      }

      setIsLoading(false);
    };

    fetchProducts();
  }, [selectedCategory, sortBy, currentPage, priceRange]);

  const handleApplyFilters = () => {
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl mb-4"
          >
            Shop All Products
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl"
          >
            Discover our complete collection of premium items
          </motion.p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="bg-white p-6 rounded-xl shadow-sm sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl">Filters</h3>
                <SlidersHorizontal className="w-5 h-5 text-gray-500" />
              </div>

              {/* Category Filter */}
              <div className="mb-6">
                <h4 className="mb-3 text-gray-700">Category</h4>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="category"
                      checked={selectedCategory === 'all'}
                      onChange={() => setSelectedCategory('all')}
                      className="w-4 h-4 text-purple-600"
                    />
                    <span className="group-hover:text-purple-600 transition-colors">All</span>
                  </label>
                  {categories.map((cat) => (
                    <label key={cat.id} className="flex items-center space-x-2 cursor-pointer group">
                      <input
                        type="radio"
                        name="category"
                        checked={selectedCategory === cat.slug}
                        onChange={() => setSelectedCategory(cat.slug)}
                        className="w-4 h-4 text-purple-600"
                      />
                      <span className="group-hover:text-purple-600 transition-colors">
                        {cat.name} ({cat.products_count || 0})
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h4 className="mb-3 text-gray-700">Price Range</h4>
                <div className="space-y-3">
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>${priceRange[0]}</span>
                    <span>${priceRange[1]}</span>
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleApplyFilters}
                className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Apply Filters
              </motion.button>
            </div>
          </motion.div>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            {/* Sort and Results */}
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-600">
                Showing {products.length} of {totalProducts} products
              </p>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-purple-600"
                >
                  <option value="featured">Featured</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="newest">Newest</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Loading State */}
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
              </div>
            ) : (
              <>
                {/* Products */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product, index) => (
                    <ProductCard
                      key={product.id}
                      id={product.id}
                      name={product.name}
                      price={parseFloat(product.price)}
                      originalPrice={product.original_price ? parseFloat(product.original_price) : undefined}
                      image={product.image_url || product.image || `https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500`}
                      rating={parseFloat(product.rating)}
                      reviews={product.reviews_count}
                      badge={product.badge}
                      index={index}
                    />
                  ))}
                </div>

                {/* Empty State */}
                {products.length === 0 && (
                  <div className="text-center py-20">
                    <p className="text-gray-500 text-lg">No products found</p>
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center space-x-2 mt-12">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <motion.button
                        key={page}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 rounded-full ${page === currentPage
                          ? 'bg-purple-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                          } transition-colors`}
                      >
                        {page}
                      </motion.button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
