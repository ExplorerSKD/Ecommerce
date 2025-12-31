import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { productsApi } from '../services/api';

interface SearchSuggestion {
    products: { id: number; name: string; price: string; image?: string }[];
    categories: { id: number; name: string; slug: string }[];
}

export function SearchBox() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<SearchSuggestion | null>(null);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const searchProducts = async () => {
            if (query.length < 2) {
                setSuggestions(null);
                return;
            }

            setLoading(true);
            const result = await productsApi.search(query);
            if (result.success && result.data) {
                setSuggestions(result.data.suggestions);
            }
            setLoading(false);
        };

        const debounce = setTimeout(searchProducts, 300);
        return () => clearTimeout(debounce);
    }, [query]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            navigate(`/shop?search=${encodeURIComponent(query.trim())}`);
            setIsOpen(false);
            setQuery('');
        }
    };

    const handleProductClick = () => {
        setIsOpen(false);
        setQuery('');
    };

    return (
        <div ref={containerRef} className="relative">
            {/* Search Button */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
                <Search className="w-5 h-5 text-gray-700" />
            </motion.button>

            {/* Search Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 top-12 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50"
                    >
                        {/* Search Input */}
                        <form onSubmit={handleSubmit} className="p-4 border-b">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search products, categories..."
                                    className="w-full pl-10 pr-10 py-3 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                                {query && (
                                    <button
                                        type="button"
                                        onClick={() => setQuery('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        </form>

                        {/* Loading */}
                        {loading && (
                            <div className="p-6 flex justify-center">
                                <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
                            </div>
                        )}

                        {/* Results */}
                        {!loading && suggestions && (
                            <div className="max-h-96 overflow-y-auto">
                                {/* Categories */}
                                {suggestions.categories.length > 0 && (
                                    <div className="p-4 border-b">
                                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Categories</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {suggestions.categories.map((cat) => (
                                                <Link
                                                    key={cat.id}
                                                    to={`/shop?category=${cat.slug}`}
                                                    onClick={handleProductClick}
                                                    className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-sm hover:bg-purple-100"
                                                >
                                                    {cat.name}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Products */}
                                {suggestions.products.length > 0 && (
                                    <div className="p-4">
                                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Products</h4>
                                        <div className="space-y-3">
                                            {suggestions.products.map((product) => (
                                                <Link
                                                    key={product.id}
                                                    to={`/product/${product.id}`}
                                                    onClick={handleProductClick}
                                                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                                                >
                                                    <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                                                        {product.image && (
                                                            <img
                                                                src={product.image}
                                                                alt={product.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 truncate">
                                                            {product.name}
                                                        </p>
                                                        <p className="text-sm text-purple-600">
                                                            ₹{parseFloat(product.price).toFixed(2)}
                                                        </p>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* No Results */}
                                {suggestions.products.length === 0 && suggestions.categories.length === 0 && (
                                    <div className="p-6 text-center text-gray-500">
                                        No results found for "{query}"
                                    </div>
                                )}

                                {/* View All Link */}
                                {(suggestions.products.length > 0 || suggestions.categories.length > 0) && (
                                    <div className="p-4 border-t bg-gray-50">
                                        <Link
                                            to={`/shop?search=${encodeURIComponent(query)}`}
                                            onClick={handleProductClick}
                                            className="block text-center text-purple-600 hover:text-purple-700 font-medium"
                                        >
                                            View all results →
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Empty State */}
                        {!loading && !suggestions && query.length < 2 && (
                            <div className="p-6 text-center text-gray-500">
                                Type at least 2 characters to search
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
