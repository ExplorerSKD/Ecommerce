import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    User, Package, MapPin, LifeBuoy, Clock, Plus, Trash2,
    Edit2, Check, X, Loader2, ChevronRight
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    ordersApi, addressesApi, supportApi,
    Order, UserAddress, SupportTicket
} from '../services/api';

type Tab = 'orders' | 'addresses' | 'support' | 'profile';

export function MyAccountPage() {
    const navigate = useNavigate();
    const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>('orders');
    const [orders, setOrders] = useState<Order[]>([]);
    const [addresses, setAddresses] = useState<UserAddress[]>([]);
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            navigate('/login');
        }
    }, [isAuthenticated, authLoading, navigate]);

    useEffect(() => {
        if (isAuthenticated) {
            loadData();
        }
    }, [isAuthenticated, activeTab]);

    const loadData = async () => {
        setLoading(true);
        if (activeTab === 'orders') {
            const result = await ordersApi.getAll();
            if (result.success && result.data) {
                setOrders(result.data.data);
            }
        } else if (activeTab === 'addresses') {
            const result = await addressesApi.getAll();
            if (result.success && result.data) {
                setAddresses(result.data);
            }
        } else if (activeTab === 'support') {
            const result = await supportApi.getAll();
            if (result.success && result.data) {
                setTickets(result.data.data);
            }
        }
        setLoading(false);
    };

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const tabs = [
        { id: 'orders', label: 'Orders', icon: Package },
        { id: 'addresses', label: 'Addresses', icon: MapPin },
        { id: 'support', label: 'Support', icon: LifeBuoy },
        { id: 'profile', label: 'Profile', icon: User },
    ];

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-800',
            confirmed: 'bg-blue-100 text-blue-800',
            processing: 'bg-purple-100 text-purple-800',
            shipped: 'bg-indigo-100 text-indigo-800',
            delivered: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800',
            open: 'bg-yellow-100 text-yellow-800',
            in_progress: 'bg-blue-100 text-blue-800',
            resolved: 'bg-green-100 text-green-800',
            closed: 'bg-gray-100 text-gray-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar */}
                    <div className="lg:w-64 flex-shrink-0">
                        <div className="bg-white rounded-2xl shadow-sm p-6">
                            <div className="flex items-center space-x-4 mb-6 pb-6 border-b">
                                <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                                    {user?.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h2 className="font-semibold text-gray-900">{user?.name}</h2>
                                    <p className="text-sm text-gray-500">{user?.email}</p>
                                </div>
                            </div>

                            <nav className="space-y-2">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as Tab)}
                                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${activeTab === tab.id
                                                ? 'bg-purple-50 text-purple-600'
                                                : 'text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        <tab.icon className="w-5 h-5" />
                                        <span>{tab.label}</span>
                                    </button>
                                ))}
                            </nav>

                            <button
                                onClick={handleLogout}
                                className="w-full mt-6 flex items-center justify-center space-x-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                            >
                                <span>Sign Out</span>
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                        <AnimatePresence mode="wait">
                            {loading ? (
                                <motion.div
                                    key="loading"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="bg-white rounded-2xl shadow-sm p-12 flex items-center justify-center"
                                >
                                    <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key={activeTab}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                >
                                    {/* Orders Tab */}
                                    {activeTab === 'orders' && (
                                        <div className="bg-white rounded-2xl shadow-sm">
                                            <div className="p-6 border-b">
                                                <h2 className="text-xl font-semibold text-gray-900">Order History</h2>
                                                <p className="text-gray-500">Track and manage your orders</p>
                                            </div>
                                            {orders.length === 0 ? (
                                                <div className="p-12 text-center">
                                                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                                    <p className="text-gray-500">No orders yet</p>
                                                    <Link
                                                        to="/shop"
                                                        className="inline-block mt-4 text-purple-600 hover:underline"
                                                    >
                                                        Start Shopping →
                                                    </Link>
                                                </div>
                                            ) : (
                                                <div className="divide-y">
                                                    {orders.map((order) => (
                                                        <div key={order.id} className="p-6 hover:bg-gray-50 transition-colors">
                                                            <div className="flex items-center justify-between mb-3">
                                                                <div>
                                                                    <p className="font-semibold text-gray-900">
                                                                        Order #{order.order_number}
                                                                    </p>
                                                                    <p className="text-sm text-gray-500">
                                                                        {new Date(order.created_at).toLocaleDateString('en-IN', {
                                                                            year: 'numeric',
                                                                            month: 'long',
                                                                            day: 'numeric',
                                                                        })}
                                                                    </p>
                                                                </div>
                                                                <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(order.status)}`}>
                                                                    {order.status}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center justify-between">
                                                                <p className="text-gray-600">
                                                                    {order.items?.length || 0} items
                                                                </p>
                                                                <div className="flex items-center space-x-4">
                                                                    <p className="font-semibold text-purple-600">
                                                                        ₹{parseFloat(order.total).toFixed(2)}
                                                                    </p>
                                                                    <Link
                                                                        to={`/orders/${order.id}`}
                                                                        className="text-gray-400 hover:text-purple-600"
                                                                    >
                                                                        <ChevronRight className="w-5 h-5" />
                                                                    </Link>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Addresses Tab */}
                                    {activeTab === 'addresses' && (
                                        <div className="bg-white rounded-2xl shadow-sm">
                                            <div className="p-6 border-b flex items-center justify-between">
                                                <div>
                                                    <h2 className="text-xl font-semibold text-gray-900">Saved Addresses</h2>
                                                    <p className="text-gray-500">Manage your delivery addresses</p>
                                                </div>
                                                <button className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                                                    <Plus className="w-4 h-4" />
                                                    <span>Add New</span>
                                                </button>
                                            </div>
                                            {addresses.length === 0 ? (
                                                <div className="p-12 text-center">
                                                    <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                                    <p className="text-gray-500">No addresses saved yet</p>
                                                </div>
                                            ) : (
                                                <div className="divide-y">
                                                    {addresses.map((address) => (
                                                        <div key={address.id} className="p-6">
                                                            <div className="flex items-start justify-between">
                                                                <div>
                                                                    <div className="flex items-center space-x-2 mb-2">
                                                                        <span className="font-semibold text-gray-900">{address.title}</span>
                                                                        {address.is_default && (
                                                                            <span className="bg-purple-100 text-purple-600 text-xs px-2 py-1 rounded-full">
                                                                                Default
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-gray-600">
                                                                        {address.first_name} {address.last_name}
                                                                    </p>
                                                                    <p className="text-gray-500">
                                                                        {address.address_line_1}
                                                                        {address.address_line_2 && `, ${address.address_line_2}`}
                                                                    </p>
                                                                    <p className="text-gray-500">
                                                                        {address.city}, {address.state} {address.postal_code}
                                                                    </p>
                                                                    <p className="text-gray-500">{address.phone}</p>
                                                                </div>
                                                                <div className="flex space-x-2">
                                                                    <button className="p-2 text-gray-400 hover:text-purple-600">
                                                                        <Edit2 className="w-4 h-4" />
                                                                    </button>
                                                                    <button className="p-2 text-gray-400 hover:text-red-600">
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Support Tab */}
                                    {activeTab === 'support' && (
                                        <div className="bg-white rounded-2xl shadow-sm">
                                            <div className="p-6 border-b flex items-center justify-between">
                                                <div>
                                                    <h2 className="text-xl font-semibold text-gray-900">Support Tickets</h2>
                                                    <p className="text-gray-500">Get help with your orders</p>
                                                </div>
                                                <button className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                                                    <Plus className="w-4 h-4" />
                                                    <span>New Ticket</span>
                                                </button>
                                            </div>
                                            {tickets.length === 0 ? (
                                                <div className="p-12 text-center">
                                                    <LifeBuoy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                                    <p className="text-gray-500">No support tickets</p>
                                                </div>
                                            ) : (
                                                <div className="divide-y">
                                                    {tickets.map((ticket) => (
                                                        <div key={ticket.id} className="p-6 hover:bg-gray-50 transition-colors">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <div className="flex items-center space-x-3">
                                                                    <span className="text-sm text-gray-500">#{ticket.ticket_number}</span>
                                                                    <span className={`px-2 py-1 rounded-full text-xs capitalize ${getStatusColor(ticket.status)}`}>
                                                                        {ticket.status.replace('_', ' ')}
                                                                    </span>
                                                                </div>
                                                                <span className="text-sm text-gray-500">
                                                                    {new Date(ticket.created_at).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                            <p className="font-medium text-gray-900">{ticket.subject}</p>
                                                            <p className="text-sm text-gray-500 line-clamp-2 mt-1">{ticket.message}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Profile Tab */}
                                    {activeTab === 'profile' && (
                                        <div className="bg-white rounded-2xl shadow-sm p-6">
                                            <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Settings</h2>
                                            <form className="space-y-6">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                                                    <input
                                                        type="text"
                                                        defaultValue={user?.name}
                                                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                                    <input
                                                        type="email"
                                                        defaultValue={user?.email}
                                                        disabled
                                                        className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 cursor-not-allowed"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                                                    <input
                                                        type="tel"
                                                        defaultValue={user?.phone}
                                                        placeholder="Enter your phone number"
                                                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                    />
                                                </div>
                                                <div className="pt-4">
                                                    <button
                                                        type="submit"
                                                        className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 transition-colors"
                                                    >
                                                        Save Changes
                                                    </button>
                                                </div>
                                            </form>

                                            <div className="mt-8 pt-8 border-t">
                                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
                                                <Link
                                                    to="/forgot-password"
                                                    className="text-purple-600 hover:underline"
                                                >
                                                    Reset your password →
                                                </Link>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}
