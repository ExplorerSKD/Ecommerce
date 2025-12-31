import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
    Star, Check, X, Trash2, Loader2, Eye, Search,
    ChevronLeft, ChevronRight, Plus
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { productsApi, Product } from '../../services/api';

interface Review {
    id: number;
    user_id: number;
    product_id: number;
    rating: number;
    title?: string;
    comment?: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    user?: { id: number; name: string; email: string };
    product?: { id: number; name: string; image?: string };
}

interface PaginatedResponse {
    current_page: number;
    data: Review[];
    per_page: number;
    total: number;
    last_page: number;
}

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

export function AdminReviews() {
    const navigate = useNavigate();
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [creating, setCreating] = useState(false);
    const [newReview, setNewReview] = useState({
        product_id: '',
        rating: 5,
        title: '',
        comment: '',
    });

    useEffect(() => {
        if (!authLoading) {
            if (!isAuthenticated || user?.role !== 'admin') {
                navigate('/login');
            }
        }
    }, [isAuthenticated, authLoading, user, navigate]);

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('auth_token');
            const params = new URLSearchParams({
                page: currentPage.toString(),
                ...(statusFilter !== 'all' && { status: statusFilter }),
                ...(searchQuery && { search: searchQuery }),
            });

            const response = await fetch(`${API_BASE_URL}/admin/reviews?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            const data = await response.json();
            if (data.success && data.data) {
                setReviews(data.data.data || []);
                setTotalPages(data.data.last_page || 1);
            }
        } catch (error) {
            console.error('Failed to fetch reviews:', error);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchReviews();
            loadProducts();
        }
    }, [user, currentPage, statusFilter]);

    const loadProducts = async () => {
        const result = await productsApi.getAll({ per_page: 100 });
        if (result.success && result.data) {
            setProducts(result.data.data || []);
        }
    };

    const createReview = async () => {
        if (!newReview.product_id) {
            alert('Please select a product');
            return;
        }
        setCreating(true);
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_BASE_URL}/admin/reviews`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(newReview),
            });

            if (response.ok) {
                setShowCreateModal(false);
                setNewReview({ product_id: '', rating: 5, title: '', comment: '' });
                fetchReviews();
            } else {
                const data = await response.json();
                alert(data.message || 'Failed to create review');
            }
        } catch (error) {
            console.error('Failed to create review:', error);
        }
        setCreating(false);
    };

    const updateStatus = async (reviewId: number, status: 'approved' | 'rejected') => {
        setActionLoading(reviewId);
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_BASE_URL}/admin/reviews/${reviewId}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ status }),
            });

            if (response.ok) {
                setReviews(reviews.map(r =>
                    r.id === reviewId ? { ...r, status } : r
                ));
            }
        } catch (error) {
            console.error('Failed to update review status:', error);
        }
        setActionLoading(null);
    };

    const deleteReview = async (reviewId: number) => {
        if (!confirm('Are you sure you want to delete this review?')) return;

        setActionLoading(reviewId);
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_BASE_URL}/admin/reviews/${reviewId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (response.ok) {
                setReviews(reviews.filter(r => r.id !== reviewId));
            }
        } catch (error) {
            console.error('Failed to delete review:', error);
        }
        setActionLoading(null);
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            pending: 'bg-yellow-100 text-yellow-800',
            approved: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
        };
        return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
    };

    const renderStars = (rating: number) => {
        return (
            <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`w-4 h-4 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                    />
                ))}
            </div>
        );
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
            </div>
        );
    }

    return (
        <AdminLayout title="Reviews" subtitle="Manage customer reviews">
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search reviews..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchReviews()}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Add Review</span>
                    </motion.button>
                </div>
            </div>

            {/* Reviews Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="text-center py-20">
                        <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No reviews found</h3>
                        <p className="text-gray-500">Customer reviews will appear here</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table - Hidden on Mobile */}
                        <div className="hidden lg:block overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Review</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {reviews.map((review) => (
                                        <motion.tr
                                            key={review.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="hover:bg-gray-50"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    {review.product?.image && (
                                                        <img
                                                            src={review.product.image}
                                                            alt={review.product.name}
                                                            className="w-10 h-10 rounded-lg object-cover mr-3"
                                                        />
                                                    )}
                                                    <span className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
                                                        {review.product?.name || `Product #${review.product_id}`}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900">{review.user?.name || 'Unknown'}</div>
                                                <div className="text-xs text-gray-500">{review.user?.email}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {renderStars(review.rating)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="max-w-xs">
                                                    {review.title && (
                                                        <div className="text-sm font-medium text-gray-900">{review.title}</div>
                                                    )}
                                                    <div className="text-sm text-gray-500 truncate">
                                                        {review.comment || 'No comment'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(review.status)}`}>
                                                    {review.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {new Date(review.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end space-x-2">
                                                    {review.status === 'pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => updateStatus(review.id, 'approved')}
                                                                disabled={actionLoading === review.id}
                                                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                                title="Approve"
                                                            >
                                                                {actionLoading === review.id ? (
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                ) : (
                                                                    <Check className="w-4 h-4" />
                                                                )}
                                                            </button>
                                                            <button
                                                                onClick={() => updateStatus(review.id, 'rejected')}
                                                                disabled={actionLoading === review.id}
                                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Reject"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                    <button
                                                        onClick={() => deleteReview(review.id)}
                                                        disabled={actionLoading === review.id}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="lg:hidden divide-y divide-gray-100">
                            {reviews.map((review) => (
                                <div key={review.id} className="p-4 hover:bg-gray-50">
                                    <div className="flex items-start gap-3">
                                        {review.product?.image && (
                                            <img
                                                src={review.product.image}
                                                alt={review.product?.name || ''}
                                                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                                            />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="font-medium text-gray-900 text-sm truncate">
                                                    {review.product?.name || `Product #${review.product_id}`}
                                                </p>
                                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${getStatusBadge(review.status)}`}>
                                                    {review.status}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                by {review.user?.name || 'Unknown'}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                {renderStars(review.rating)}
                                                <span className="text-xs text-gray-400">
                                                    {new Date(review.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            {(review.title || review.comment) && (
                                                <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                                    {review.title && <strong>{review.title}: </strong>}
                                                    {review.comment || 'No comment'}
                                                </p>
                                            )}
                                            <div className="flex justify-end gap-2 mt-2">
                                                {review.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => updateStatus(review.id, 'approved')}
                                                            disabled={actionLoading === review.id}
                                                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => updateStatus(review.id, 'rejected')}
                                                            disabled={actionLoading === review.id}
                                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    onClick={() => deleteReview(review.id)}
                                                    disabled={actionLoading === review.id}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t">
                            <p className="text-sm text-gray-500">
                                Page {currentPage} of {totalPages}
                            </p>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Create Review Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
                    >
                        <h3 className="text-xl font-bold mb-6">Add Review</h3>

                        <div className="space-y-4">
                            {/* Product Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Product *</label>
                                <select
                                    value={newReview.product_id}
                                    onChange={(e) => setNewReview({ ...newReview, product_id: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="">Select a product</option>
                                    {products.map(product => (
                                        <option key={product.id} value={product.id}>
                                            {product.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Rating */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Rating *</label>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setNewReview({ ...newReview, rating: star })}
                                            className="p-1 hover:scale-110 transition-transform"
                                        >
                                            <Star
                                                className={`w-8 h-8 ${star <= newReview.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={newReview.title}
                                    onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                                    placeholder="Review title"
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            {/* Comment */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Comment</label>
                                <textarea
                                    value={newReview.comment}
                                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                                    placeholder="Write your review..."
                                    rows={4}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 mt-6">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={createReview}
                                disabled={creating || !newReview.product_id}
                                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center"
                            >
                                {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Create Review
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AdminLayout>
    );
}
