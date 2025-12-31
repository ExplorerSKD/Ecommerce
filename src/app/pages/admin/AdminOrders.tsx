import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Loader2, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { AdminLayout } from '../../components/admin/AdminLayout';

const API_BASE = 'http://127.0.0.1:8000/api/v1';

interface Order {
    id: number;
    order_number: string;
    status: string;
    total: string;
    created_at: string;
    user: {
        id: number;
        name: string;
        email: string;
    };
    items_count?: number;
    shipping_address?: {
        first_name?: string;
        last_name?: string;
        email?: string;
        phone?: string;
        address?: string;
        city?: string;
        state?: string;
        zip?: string;
        country?: string;
    };
}

export function AdminOrders() {
    const navigate = useNavigate();
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        if (!authLoading) {
            if (!isAuthenticated || user?.role !== 'admin') {
                navigate('/login');
            }
        }
    }, [isAuthenticated, authLoading, user, navigate]);

    useEffect(() => {
        loadOrders();
    }, [currentPage, statusFilter]);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('auth_token');

            let url = `${API_BASE}/admin/orders?page=${currentPage}`;
            if (statusFilter) {
                url += `&status=${statusFilter}`;
            }

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            const result = await response.json();

            if (response.ok && result.success && result.data) {
                setOrders(result.data.data || []);
                setTotalPages(result.data.last_page || 1);
            }
        } catch (error) {
            console.error('Error loading orders:', error);
        }
        setLoading(false);
    };

    const updateStatus = async (orderId: number, newStatus: string) => {
        setUpdating(true);
        const token = localStorage.getItem('auth_token');

        const response = await fetch(`${API_BASE}/admin/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: newStatus }),
        });

        if (response.ok) {
            loadOrders();
            setSelectedOrder(null);
        } else {
            alert('Failed to update order status');
        }
        setUpdating(false);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'delivered':
                return 'bg-green-100 text-green-700';
            case 'shipped':
                return 'bg-blue-100 text-blue-700';
            case 'processing':
                return 'bg-yellow-100 text-yellow-700';
            case 'confirmed':
                return 'bg-purple-100 text-purple-700';
            case 'cancelled':
                return 'bg-red-100 text-red-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
            </div>
        );
    }

    return (
        <AdminLayout title="Orders" subtitle="Manage customer orders">
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <span className="text-gray-600 text-sm sm:text-base">Filter by status:</span>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="flex-1 sm:flex-none px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                    >
                        <option value="">All Orders</option>
                        {statuses.map((status) => (
                            <option key={status} value={status} className="capitalize">
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Orders List */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        No orders found
                    </div>
                ) : (
                    <>
                        {/* Desktop Table - Hidden on Mobile */}
                        <div className="hidden lg:block overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="text-left px-6 py-4 text-gray-600 text-sm font-medium">Order #</th>
                                        <th className="text-left px-6 py-4 text-gray-600 text-sm font-medium">Customer</th>
                                        <th className="text-left px-6 py-4 text-gray-600 text-sm font-medium">Date</th>
                                        <th className="text-left px-6 py-4 text-gray-600 text-sm font-medium">Status</th>
                                        <th className="text-left px-6 py-4 text-gray-600 text-sm font-medium">Total</th>
                                        <th className="text-left px-6 py-4 text-gray-600 text-sm font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map((order) => (
                                        <tr key={order.id} className="border-t hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium">
                                                #{order.order_number}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-medium">{order.user?.name}</p>
                                                    <p className="text-gray-500 text-sm">{order.user?.email}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {new Date(order.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-sm capitalize ${getStatusColor(order.status)}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-medium">
                                                ₹{parseFloat(order.total).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => setSelectedOrder(order)}
                                                    className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                                                >
                                                    <Eye className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View - Shown only on Mobile */}
                        <div className="lg:hidden divide-y divide-gray-100">
                            {orders.map((order) => (
                                <div key={order.id} className="p-4 hover:bg-gray-50">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <p className="font-semibold text-gray-900">#{order.order_number}</p>
                                            <p className="text-sm text-gray-500">
                                                {new Date(order.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs capitalize ${getStatusColor(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{order.user?.name}</p>
                                            <p className="text-xs text-gray-500 truncate max-w-[180px]">{order.user?.email}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold text-purple-600">
                                                ₹{parseFloat(order.total).toFixed(2)}
                                            </span>
                                            <button
                                                onClick={() => setSelectedOrder(order)}
                                                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                                            >
                                                <Eye className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* Pagination */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t">
                    <p className="text-gray-600 text-sm">
                        Page {currentPage} of {totalPages}
                    </p>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="p-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Order Detail Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
                    >
                        <h3 className="text-xl sm:text-2xl font-bold mb-6">
                            Order #{selectedOrder.order_number}
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-600">Customer</label>
                                <p className="font-medium">{selectedOrder.user?.name}</p>
                                <p className="text-gray-500 text-sm break-all">{selectedOrder.user?.email}</p>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-600">Order Date</label>
                                <p>{new Date(selectedOrder.created_at).toLocaleString()}</p>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-600">Total</label>
                                <p className="text-2xl font-bold text-purple-600">
                                    ₹{parseFloat(selectedOrder.total).toFixed(2)}
                                </p>
                            </div>

                            {/* Delivery Address */}
                            {selectedOrder.shipping_address && (
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <label className="block text-sm text-gray-600 mb-2">Delivery Address</label>
                                    <div className="text-sm space-y-1">
                                        <p className="font-semibold text-gray-900">
                                            {selectedOrder.shipping_address.first_name} {selectedOrder.shipping_address.last_name}
                                        </p>
                                        <p className="text-blue-600">{selectedOrder.shipping_address.email || selectedOrder.user?.email}</p>
                                        {selectedOrder.shipping_address.phone && (
                                            <p className="text-gray-700">{selectedOrder.shipping_address.phone}</p>
                                        )}
                                        <p className="text-gray-600 mt-2">{selectedOrder.shipping_address.address}</p>
                                        <p className="text-gray-600">
                                            {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state} {selectedOrder.shipping_address.zip}
                                        </p>
                                        <p className="text-green-600">{selectedOrder.shipping_address.country}</p>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm text-gray-600 mb-2">Update Status</label>
                                <select
                                    value={selectedOrder.status}
                                    onChange={(e) => updateStatus(selectedOrder.id, e.target.value)}
                                    disabled={updating}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                                >
                                    {statuses.map((status) => (
                                        <option key={status} value={status} className="capitalize">
                                            {status.charAt(0).toUpperCase() + status.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end mt-6">
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Close
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AdminLayout>
    );
}

