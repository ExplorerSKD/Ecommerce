import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
    Package, MapPin, ArrowLeft, Loader2, Calendar,
    CreditCard, Truck, CheckCircle, XCircle, AlertCircle, Star
} from 'lucide-react';
import { ordersApi, reviewsApi, Order } from '../services/api';

export function OrderDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [order, setOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Review state
    const [reviews, setReviews] = useState<Record<number, { rating: number; comment: string; submitted: boolean }>>({});
    const [reviewSubmitting, setReviewSubmitting] = useState<number | null>(null);

    useEffect(() => {
        if (id) {
            loadOrder(parseInt(id));
        }
    }, [id]);

    const loadOrder = async (orderId: number) => {
        try {
            const result = await ordersApi.getOne(orderId);
            if (result.success && result.data) {
                setOrder(result.data);
            } else {
                setError(result.message || 'Failed to load order');
            }
        } catch (err) {
            setError('An error occurred while loading the order');
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-800',
            confirmed: 'bg-blue-100 text-blue-800',
            processing: 'bg-purple-100 text-purple-800',
            shipped: 'bg-indigo-100 text-indigo-800',
            delivered: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'delivered': return <CheckCircle className="w-5 h-5" />;
            case 'cancelled': return <XCircle className="w-5 h-5" />;
            case 'shipped': return <Truck className="w-5 h-5" />;
            case 'pending': return <AlertCircle className="w-5 h-5" />;
            default: return <Package className="w-5 h-5" />;
        }
    };

    const updateReview = (productId: number, field: 'rating' | 'comment', value: number | string) => {
        setReviews(prev => ({
            ...prev,
            [productId]: {
                ...prev[productId] || { rating: 0, comment: '', submitted: false },
                [field]: value,
            }
        }));
    };

    const submitReview = async (productId: number) => {
        const review = reviews[productId];
        if (!review || review.rating === 0) {
            alert('Please select a rating');
            return;
        }

        setReviewSubmitting(productId);
        const result = await reviewsApi.create({
            product_id: productId,
            rating: review.rating,
            comment: review.comment,
        });

        if (result.success) {
            setReviews(prev => ({
                ...prev,
                [productId]: { ...prev[productId], submitted: true }
            }));
        } else {
            alert(result.message || 'Failed to submit review');
        }
        setReviewSubmitting(null);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-screen bg-gray-50 py-12 px-4">
                <div className="max-w-3xl mx-auto text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
                    <p className="text-gray-600 mb-6">{error || "The order you're looking for doesn't exist."}</p>
                    <Link
                        to="/my-account"
                        className="inline-flex items-center space-x-2 text-purple-600 hover:text-purple-700 font-medium"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Back to Orders</span>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <Link
                        to="/my-account"
                        className="inline-flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Back to Orders</span>
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    {/* Order Info Card */}
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6 mb-6">
                            <div>
                                <div className="flex items-center space-x-3 mb-1">
                                    <h2 className="text-xl font-bold text-gray-900">Order #{order.order_number}</h2>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize flex items-center space-x-1 ${getStatusColor(order.status)}`}>
                                        {getStatusIcon(order.status)}
                                        <span>{order.status}</span>
                                    </span>
                                </div>
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                    <div className="flex items-center space-x-1">
                                        <Calendar className="w-4 h-4" />
                                        <span>{new Date(order.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <CreditCard className="w-4 h-4" />
                                        <span className="capitalize">{order.payment_method?.replace('_', ' ') || 'Payment'}</span>
                                    </div>
                                </div>
                            </div>
                            {order.status === 'pending' && (
                                <button
                                    onClick={() => {/* TODO: Implement Retry Payment */ }}
                                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                                >
                                    Pay Now
                                </button>
                            )}
                        </div>

                        {/* Order Items */}
                        <div className="space-y-6">
                            {order.items.map((item) => (
                                <div key={item.id} className="flex gap-4">
                                    <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                        {/* Placeholder for product image since it might not be in order item directly without populate */}
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <Package className="w-8 h-8" />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{item.product_name}</h3>
                                                <div className="text-sm text-gray-500 mt-1 space-y-1">
                                                    <p>Quantity: {item.quantity}</p>
                                                    {(item.size || item.color) && (
                                                        <p>
                                                            {item.size && `Size: ${item.size}`}
                                                            {item.size && item.color && ' • '}
                                                            {item.color && `Color: ${item.color}`}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="font-semibold text-gray-900">
                                                ₹{parseFloat(item.price).toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Shipping Address */}
                        <div className="md:col-span-2 bg-white rounded-2xl shadow-sm p-6">
                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                                <MapPin className="w-5 h-5 text-purple-600" />
                                <span>Shipping Address</span>
                            </h3>
                            <div className="text-gray-600 space-y-1">
                                <p className="font-medium text-gray-900">
                                    {order.shipping_address.first_name} {order.shipping_address.last_name}
                                </p>
                                <p>{order.shipping_address.email}</p>
                                <p>{order.shipping_address.phone}</p>
                                <p className="mt-2">{order.shipping_address.address}</p>
                                <p>
                                    {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zip}
                                </p>
                                <p>{order.shipping_address.country}</p>
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="bg-white rounded-2xl shadow-sm p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal</span>
                                    <span>₹{parseFloat(order.subtotal).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Shipping</span>
                                    <span>₹{parseFloat(order.shipping).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Tax</span>
                                    <span>₹{parseFloat(order.tax).toFixed(2)}</span>
                                </div>
                                {(parseFloat(order.total) < (parseFloat(order.subtotal) + parseFloat(order.shipping) + parseFloat(order.tax))) && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Discount</span>
                                        <span>-₹{((parseFloat(order.subtotal) + parseFloat(order.shipping) + parseFloat(order.tax)) - parseFloat(order.total)).toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="border-t pt-3 mt-3">
                                    <div className="flex justify-between font-bold text-lg text-gray-900">
                                        <span>Total</span>
                                        <span className="text-purple-600">₹{parseFloat(order.total).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Review Section - Only show for delivered orders */}
                    {order.status === 'delivered' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white rounded-2xl shadow-sm p-6"
                        >
                            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
                                <Star className="w-6 h-6 text-yellow-500" />
                                <span>Review Your Products</span>
                            </h3>
                            <p className="text-gray-600 mb-6">
                                Thank you for your purchase! We'd love to hear your feedback on the products you ordered.
                            </p>

                            <div className="space-y-6">
                                {order.items.map((item) => {
                                    const productReview = reviews[item.product_id] || { rating: 0, comment: '', submitted: false };

                                    return (
                                        <div key={item.id} className="border rounded-xl p-4">
                                            <div className="flex items-start gap-4 mb-4">
                                                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                    <Package className="w-6 h-6 text-gray-400" />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-gray-900">{item.product_name}</h4>
                                                    <p className="text-sm text-gray-500">Purchased quantity: {item.quantity}</p>
                                                </div>
                                            </div>

                                            {productReview.submitted ? (
                                                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                                                    <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                                                    <p className="text-green-700 font-medium">Thank you for your review!</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {/* Star Rating */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Your Rating
                                                        </label>
                                                        <div className="flex space-x-1">
                                                            {[1, 2, 3, 4, 5].map((star) => (
                                                                <button
                                                                    key={star}
                                                                    type="button"
                                                                    onClick={() => updateReview(item.product_id, 'rating', star)}
                                                                    className="focus:outline-none transition-transform hover:scale-110"
                                                                >
                                                                    <Star
                                                                        className={`w-8 h-8 ${star <= productReview.rating
                                                                                ? 'fill-yellow-400 text-yellow-400'
                                                                                : 'text-gray-300 hover:text-yellow-300'
                                                                            }`}
                                                                    />
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Comment */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Your Review (Optional)
                                                        </label>
                                                        <textarea
                                                            value={productReview.comment}
                                                            onChange={(e) => updateReview(item.product_id, 'comment', e.target.value)}
                                                            placeholder="Share your experience with this product..."
                                                            rows={3}
                                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent resize-none"
                                                        />
                                                    </div>

                                                    {/* Submit Button */}
                                                    <button
                                                        onClick={() => submitReview(item.product_id)}
                                                        disabled={reviewSubmitting === item.product_id}
                                                        className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                                                    >
                                                        {reviewSubmitting === item.product_id ? (
                                                            <>
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                                <span>Submitting...</span>
                                                            </>
                                                        ) : (
                                                            <span>Submit Review</span>
                                                        )}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
