import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
    Users, Loader2, Search, Eye, ShoppingBag, Mail,
    Phone, Calendar, ChevronLeft, ChevronRight, Ban, CheckCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { AdminLayout } from '../../components/admin/AdminLayout';

interface Customer {
    id: number;
    name: string;
    email: string;
    phone?: string;
    role: string;
    is_blocked?: boolean;
    orders_count: number;
    created_at: string;
}

interface PaginatedResponse {
    current_page: number;
    data: Customer[];
    per_page: number;
    total: number;
    last_page: number;
}

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

export function AdminUsers() {
    const navigate = useNavigate();
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCustomers, setTotalCustomers] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [customerOrders, setCustomerOrders] = useState<any[]>([]);
    const [loadingDetails, setLoadingDetails] = useState(false);

    useEffect(() => {
        if (!authLoading) {
            if (!isAuthenticated || user?.role !== 'admin') {
                navigate('/login');
            }
        }
    }, [isAuthenticated, authLoading, user, navigate]);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_BASE_URL}/admin/users?page=${currentPage}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            const data = await response.json();
            if (data.success && data.data) {
                setCustomers(data.data.data || []);
                setTotalPages(data.data.last_page || 1);
                setTotalCustomers(data.data.total || 0);
            }
        } catch (error) {
            console.error('Failed to fetch customers:', error);
        }
        setLoading(false);
    };

    const fetchCustomerDetails = async (customerId: number) => {
        setLoadingDetails(true);
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_BASE_URL}/admin/users/${customerId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            const data = await response.json();
            if (data.success) {
                setSelectedCustomer(data.data);
                setCustomerOrders(data.data.orders || []);
            }
        } catch (error) {
            console.error('Failed to fetch customer details:', error);
        }
        setLoadingDetails(false);
    };

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchCustomers();
        }
    }, [user, currentPage]);

    const toggleBlockStatus = async (customerId: number, isBlocked: boolean) => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_BASE_URL}/admin/users/${customerId}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ is_blocked: !isBlocked }),
            });

            if (response.ok) {
                setCustomers(customers.map(c =>
                    c.id === customerId ? { ...c, is_blocked: !isBlocked } : c
                ));
                if (selectedCustomer?.id === customerId) {
                    setSelectedCustomer({ ...selectedCustomer, is_blocked: !isBlocked });
                }
            }
        } catch (error) {
            console.error('Failed to update user status:', error);
        }
    };

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
            </div>
        );
    }

    return (
        <AdminLayout title="Customers" subtitle={`Manage ${totalCustomers} registered customers`}>
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
                {/* Customers List */}
                <div className="flex-1">
                    {/* Search */}
                    <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search customers by name or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                    </div>

                    {/* Customers Table */}
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                            </div>
                        ) : filteredCustomers.length === 0 ? (
                            <div className="text-center py-20">
                                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900">No customers found</h3>
                                <p className="text-gray-500">Customers will appear here when they register</p>
                            </div>
                        ) : (
                            <>
                                {/* Desktop Table - Hidden on Mobile */}
                                <div className="hidden lg:block overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {filteredCustomers.map((customer) => (
                                                <motion.tr
                                                    key={customer.id}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="hover:bg-gray-50"
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center">
                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                                                                {customer.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div className="ml-3">
                                                                <p className="font-medium text-gray-900">{customer.name}</p>
                                                                <p className="text-sm text-gray-500">ID: {customer.id}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center text-sm text-gray-500">
                                                            <Mail className="w-4 h-4 mr-2" />
                                                            {customer.email}
                                                        </div>
                                                        {customer.phone && (
                                                            <div className="flex items-center text-sm text-gray-500 mt-1">
                                                                <Phone className="w-4 h-4 mr-2" />
                                                                {customer.phone}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center">
                                                            <ShoppingBag className="w-4 h-4 text-gray-400 mr-2" />
                                                            <span className="font-medium">{customer.orders_count}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">
                                                        <div className="flex items-center">
                                                            <Calendar className="w-4 h-4 mr-2" />
                                                            {new Date(customer.created_at).toLocaleDateString()}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${customer.is_blocked
                                                            ? 'bg-red-100 text-red-800'
                                                            : 'bg-green-100 text-green-800'
                                                            }`}>
                                                            {customer.is_blocked ? 'Blocked' : 'Active'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end space-x-2">
                                                            <button
                                                                onClick={() => fetchCustomerDetails(customer.id)}
                                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                title="View Details"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => toggleBlockStatus(customer.id, customer.is_blocked || false)}
                                                                className={`p-2 rounded-lg transition-colors ${customer.is_blocked
                                                                    ? 'text-green-600 hover:bg-green-50'
                                                                    : 'text-red-600 hover:bg-red-50'
                                                                    }`}
                                                                title={customer.is_blocked ? 'Unblock' : 'Block'}
                                                            >
                                                                {customer.is_blocked ? (
                                                                    <CheckCircle className="w-4 h-4" />
                                                                ) : (
                                                                    <Ban className="w-4 h-4" />
                                                                )}
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
                                    {filteredCustomers.map((customer) => (
                                        <div key={customer.id} className="p-4 hover:bg-gray-50">
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                                                    {customer.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div>
                                                            <p className="font-medium text-gray-900">{customer.name}</p>
                                                            <p className="text-sm text-gray-500 break-all">{customer.email}</p>
                                                        </div>
                                                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${customer.is_blocked
                                                            ? 'bg-red-100 text-red-800'
                                                            : 'bg-green-100 text-green-800'
                                                            }`}>
                                                            {customer.is_blocked ? 'Blocked' : 'Active'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                                        <span className="flex items-center">
                                                            <ShoppingBag className="w-4 h-4 mr-1" />
                                                            {customer.orders_count} orders
                                                        </span>
                                                        <span className="flex items-center">
                                                            <Calendar className="w-4 h-4 mr-1" />
                                                            {new Date(customer.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-end gap-2 mt-2">
                                                        <button
                                                            onClick={() => fetchCustomerDetails(customer.id)}
                                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => toggleBlockStatus(customer.id, customer.is_blocked || false)}
                                                            className={`p-1.5 rounded-lg ${customer.is_blocked
                                                                ? 'text-green-600 hover:bg-green-50'
                                                                : 'text-red-600 hover:bg-red-50'
                                                                }`}
                                                        >
                                                            {customer.is_blocked ? (
                                                                <CheckCircle className="w-4 h-4" />
                                                            ) : (
                                                                <Ban className="w-4 h-4" />
                                                            )}
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
                </div>

                {/* Customer Details Panel */}
                {selectedCustomer && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="fixed inset-0 z-50 lg:relative lg:inset-auto lg:z-auto lg:w-96 bg-white lg:rounded-xl shadow-sm p-4 sm:p-6 overflow-y-auto"
                    >
                        {/* Mobile Close Button */}
                        <button
                            onClick={() => setSelectedCustomer(null)}
                            className="lg:hidden flex items-center text-gray-600 hover:text-gray-900 mb-4"
                        >
                            <ChevronLeft className="w-5 h-5 mr-1" />
                            Back to customers
                        </button>
                        {loadingDetails ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
                            </div>
                        ) : (
                            <>
                                <div className="text-center mb-6">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                                        {selectedCustomer.name.charAt(0).toUpperCase()}
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900">{selectedCustomer.name}</h3>
                                    <p className="text-gray-500">{selectedCustomer.email}</p>
                                    <span className={`mt-2 inline-block px-3 py-1 text-sm font-medium rounded-full ${selectedCustomer.is_blocked
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-green-100 text-green-800'
                                        }`}>
                                        {selectedCustomer.is_blocked ? 'Blocked' : 'Active'}
                                    </span>
                                </div>

                                <div className="space-y-4 border-t pt-4">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Phone</span>
                                        <span className="font-medium">{selectedCustomer.phone || 'Not provided'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Total Orders</span>
                                        <span className="font-medium">{selectedCustomer.orders_count}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Member Since</span>
                                        <span className="font-medium">
                                            {new Date(selectedCustomer.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>

                                {customerOrders.length > 0 && (
                                    <div className="mt-6 pt-6 border-t">
                                        <h4 className="font-semibold text-gray-900 mb-3">Recent Orders</h4>
                                        <div className="space-y-2">
                                            {customerOrders.slice(0, 5).map((order: any) => (
                                                <div
                                                    key={order.id}
                                                    className="p-3 bg-gray-50 rounded-lg"
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="font-medium text-sm">#{order.order_number}</p>
                                                            <p className="text-xs text-gray-500">
                                                                {new Date(order.created_at).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-medium text-sm">₹{order.total}</p>
                                                            <span className={`text-xs px-2 py-0.5 rounded-full ${order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                                                order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                                    'bg-yellow-100 text-yellow-800'
                                                                }`}>
                                                                {order.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="mt-6 pt-6 border-t">
                                    <button
                                        onClick={() => toggleBlockStatus(selectedCustomer.id, selectedCustomer.is_blocked || false)}
                                        className={`w-full py-2 rounded-lg font-medium transition-colors ${selectedCustomer.is_blocked
                                            ? 'bg-green-600 hover:bg-green-700 text-white'
                                            : 'bg-red-600 hover:bg-red-700 text-white'
                                            }`}
                                    >
                                        {selectedCustomer.is_blocked ? 'Unblock Customer' : 'Block Customer'}
                                    </button>
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
            </div>
        </AdminLayout>
    );
}
