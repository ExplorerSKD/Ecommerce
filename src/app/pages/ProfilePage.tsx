import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { User, Package, Heart, Settings, LogOut, MapPin, CreditCard, Loader2, Trash2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ordersApi, authApi, wishlistApi, paymentMethodsApi, Order, Product, PaymentMethod } from '../services/api';

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading, logout, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
  });

  // Payment methods state
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [newPaymentType, setNewPaymentType] = useState<'card' | 'upi' | 'netbanking'>('card');
  const [newPaymentData, setNewPaymentData] = useState<{
    name?: string;
    last_four?: string;
    card_brand?: string;
    upi_id?: string;
    bank_name?: string;
    expiry_month?: string;
    expiry_year?: string;
    is_default?: boolean;
  }>({});

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Load user data into form
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || '',
      });
    }
  }, [user]);

  // Load orders when orders tab is selected
  useEffect(() => {
    if (activeTab === 'orders' && isAuthenticated) {
      loadOrders();
    }
    if (activeTab === 'wishlist' && isAuthenticated) {
      loadWishlist();
    }
    if (activeTab === 'payment' && isAuthenticated) {
      loadPaymentMethods();
    }
  }, [activeTab, isAuthenticated]);

  const loadPaymentMethods = async () => {
    setPaymentMethodsLoading(true);
    const result = await paymentMethodsApi.getAll();
    if (result.success && result.data) {
      setPaymentMethods(result.data);
    }
    setPaymentMethodsLoading(false);
  };

  const handleAddPaymentMethod = async () => {
    setPaymentSaving(true);
    const result = await paymentMethodsApi.add({
      type: newPaymentType,
      ...newPaymentData,
    });
    if (result.success) {
      await loadPaymentMethods();
      setShowPaymentModal(false);
      setNewPaymentData({});
      setNewPaymentType('card');
    }
    setPaymentSaving(false);
  };

  const handleDeletePayment = async (id: number) => {
    if (confirm('Are you sure you want to delete this payment method?')) {
      const result = await paymentMethodsApi.delete(id);
      if (result.success) {
        setPaymentMethods(paymentMethods.filter((m) => m.id !== id));
      }
    }
  };

  const handleSetDefaultPayment = async (id: number) => {
    const result = await paymentMethodsApi.setDefault(id);
    if (result.success) {
      await loadPaymentMethods();
    }
  };

  const loadWishlist = async () => {
    setWishlistLoading(true);
    const result = await wishlistApi.getAll();
    if (result.success && result.data) {
      setWishlist(result.data);
    }
    setWishlistLoading(false);
  };

  const removeFromWishlist = async (productId: number) => {
    const result = await wishlistApi.remove(productId);
    if (result.success) {
      setWishlist(wishlist.filter(p => p.id !== productId));
    }
  };

  const loadOrders = async () => {
    setOrdersLoading(true);
    const result = await ordersApi.getAll();
    if (result.success && result.data) {
      setOrders(result.data.data || []);
    }
    setOrdersLoading(false);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setMessage('');

    const result = await authApi.updateProfile(formData);

    if (result.success && result.data) {
      updateUser(result.data);
      setMessage('Profile updated successfully!');
    } else {
      setMessage(result.message || 'Failed to update profile');
    }

    setIsSaving(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-700';
      case 'shipped':
        return 'bg-blue-100 text-blue-700';
      case 'processing':
      case 'confirmed':
        return 'bg-yellow-100 text-yellow-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'wishlist', label: 'Wishlist', icon: Heart },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl mb-2">My Account</h1>
          <p className="text-gray-600">Manage your profile and preferences</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl shadow-sm p-6 space-y-2"
            >
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <motion.button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    whileHover={{ x: 5 }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === tab.id
                      ? 'bg-purple-50 text-purple-600'
                      : 'hover:bg-gray-50 text-gray-700'
                      }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </motion.button>
                );
              })}

              <motion.button
                onClick={handleLogout}
                whileHover={{ x: 5 }}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors mt-4 border-t border-gray-200 pt-4"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </motion.button>
            </motion.div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {activeTab === 'profile' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-sm p-8"
              >
                <h2 className="text-2xl mb-6">Profile Information</h2>

                {message && (
                  <div className={`mb-4 p-3 rounded-lg ${message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                    {message}
                  </div>
                )}

                <div className="space-y-6">
                  <div className="flex items-center space-x-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-white text-3xl">
                      {getInitials(user.name)}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Role: {user.role}</p>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        Change Photo
                      </motion.button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm mb-2 text-gray-700">Full Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm mb-2 text-gray-700">Email</label>
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                    />
                    <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
                  </div>

                  <div>
                    <label className="block text-sm mb-2 text-gray-700">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm mb-2 text-gray-700">Address</label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Enter your address"
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </motion.button>
                </div>
              </motion.div>
            )}

            {activeTab === 'orders' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <h2 className="text-2xl mb-6">Order History</h2>

                {ordersLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No orders yet</p>
                    <Link
                      to="/shop"
                      className="inline-block px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                      Start Shopping
                    </Link>
                  </div>
                ) : (
                  orders.map((order, index) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-xl shadow-sm p-6"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl mb-1">#{order.order_number}</h3>
                          <p className="text-gray-600">
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-4 py-1 rounded-full text-sm capitalize ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-t border-gray-200 pt-4">
                        <div className="text-gray-600">
                          {order.items?.length || 0} items • ₹{parseFloat(order.total).toFixed(2)}
                        </div>
                        <Link
                          to={`/orders/${order.id}`}
                          className="text-purple-600 hover:text-purple-700 font-medium"
                        >
                          View Details
                        </Link>
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}

            {activeTab === 'wishlist' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-sm p-8"
              >
                <h2 className="text-2xl mb-6">My Wishlist</h2>
                {wishlistLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                  </div>
                ) : wishlist.length === 0 ? (
                  <div className="text-center py-10">
                    <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">Your wishlist is empty</p>
                    <Link
                      to="/shop"
                      className="inline-block px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                      Browse Products
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {wishlist.map((product) => (
                      <div key={product.id} className="border rounded-xl p-4 hover:shadow-md transition-shadow">
                        <Link to={`/product/${product.id}`}>
                          <img
                            src={product.image_url || product.image || 'https://via.placeholder.com/200'}
                            alt={product.name}
                            className="w-full h-40 object-cover rounded-lg mb-3"
                          />
                          <h3 className="font-medium text-gray-900 mb-1 line-clamp-1">{product.name}</h3>
                          <p className="text-purple-600 font-semibold">₹{parseFloat(product.price).toFixed(2)}</p>
                        </Link>
                        <button
                          onClick={() => removeFromWishlist(product.id)}
                          className="mt-3 w-full flex items-center justify-center space-x-2 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Remove</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'addresses' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl">Saved Addresses</h2>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Add New
                  </motion.button>
                </div>
                {user.address ? (
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="mb-2">Default Address</h3>
                        <p className="text-gray-600">{user.address}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button className="text-purple-600 hover:text-purple-700">Edit</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                    <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No addresses saved</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'payment' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-sm p-8"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl">Payment Methods</h2>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowPaymentModal(true)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Add Payment Method
                  </motion.button>
                </div>

                {paymentMethodsLoading ? (
                  <div className="text-center py-10">
                    <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto" />
                  </div>
                ) : paymentMethods.length === 0 ? (
                  <div className="text-center py-10">
                    <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No payment methods saved</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {paymentMethods.map((method) => (
                      <div
                        key={method.id}
                        className={`flex items-center justify-between p-4 border-2 rounded-xl ${method.is_default ? 'border-purple-600 bg-purple-50' : 'border-gray-200'
                          }`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${method.type === 'card' ? 'bg-blue-100' : method.type === 'upi' ? 'bg-green-100' : 'bg-orange-100'
                            }`}>
                            <CreditCard className={`w-6 h-6 ${method.type === 'card' ? 'text-blue-600' : method.type === 'upi' ? 'text-green-600' : 'text-orange-600'
                              }`} />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="font-semibold">
                                {method.type === 'card'
                                  ? `${method.card_brand || 'Card'} •••• ${method.last_four}`
                                  : method.type === 'upi'
                                    ? method.upi_id
                                    : method.bank_name}
                              </h3>
                              {method.is_default && (
                                <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded">Default</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">
                              {method.type === 'card' && method.expiry_month && method.expiry_year
                                ? `Expires ${method.expiry_month}/${method.expiry_year}`
                                : method.type.toUpperCase()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {!method.is_default && (
                            <button
                              onClick={() => handleSetDefaultPayment(method.id)}
                              className="text-sm text-purple-600 hover:text-purple-700"
                            >
                              Set Default
                            </button>
                          )}
                          <button
                            onClick={() => handleDeletePayment(method.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Payment Method Modal */}
                {showPaymentModal && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
                    >
                      <h3 className="text-xl mb-4">Add Payment Method</h3>

                      {/* Payment Type Selector */}
                      <div className="flex space-x-2 mb-4">
                        {(['card', 'upi', 'netbanking'] as const).map((type) => (
                          <button
                            key={type}
                            onClick={() => setNewPaymentType(type)}
                            className={`flex-1 py-2 px-3 rounded-lg border-2 text-sm ${newPaymentType === type
                              ? 'border-purple-600 bg-purple-50 text-purple-600'
                              : 'border-gray-200 hover:border-gray-300'
                              }`}
                          >
                            {type === 'card' ? 'Card' : type === 'upi' ? 'UPI' : 'Net Banking'}
                          </button>
                        ))}
                      </div>

                      {/* Card Form */}
                      {newPaymentType === 'card' && (
                        <div className="space-y-3">
                          <input
                            type="text"
                            placeholder="Cardholder Name"
                            value={newPaymentData.name || ''}
                            onChange={(e) => setNewPaymentData({ ...newPaymentData, name: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
                          />
                          <input
                            type="text"
                            placeholder="Last 4 Digits"
                            maxLength={4}
                            value={newPaymentData.last_four || ''}
                            onChange={(e) => setNewPaymentData({ ...newPaymentData, last_four: e.target.value.replace(/\D/g, '') })}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
                          />
                          <select
                            value={newPaymentData.card_brand || ''}
                            onChange={(e) => setNewPaymentData({ ...newPaymentData, card_brand: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
                          >
                            <option value="">Select Card Type</option>
                            <option value="Visa">Visa</option>
                            <option value="Mastercard">Mastercard</option>
                            <option value="RuPay">RuPay</option>
                            <option value="Amex">American Express</option>
                          </select>
                          <div className="grid grid-cols-2 gap-3">
                            <input
                              type="text"
                              placeholder="MM"
                              maxLength={2}
                              value={newPaymentData.expiry_month || ''}
                              onChange={(e) => setNewPaymentData({ ...newPaymentData, expiry_month: e.target.value.replace(/\D/g, '') })}
                              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
                            />
                            <input
                              type="text"
                              placeholder="YYYY"
                              maxLength={4}
                              value={newPaymentData.expiry_year || ''}
                              onChange={(e) => setNewPaymentData({ ...newPaymentData, expiry_year: e.target.value.replace(/\D/g, '') })}
                              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
                            />
                          </div>
                        </div>
                      )}

                      {/* UPI Form */}
                      {newPaymentType === 'upi' && (
                        <div className="space-y-3">
                          <input
                            type="text"
                            placeholder="UPI ID (e.g., yourname@upi)"
                            value={newPaymentData.upi_id || ''}
                            onChange={(e) => setNewPaymentData({ ...newPaymentData, upi_id: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
                          />
                        </div>
                      )}

                      {/* Net Banking Form */}
                      {newPaymentType === 'netbanking' && (
                        <div className="space-y-3">
                          <select
                            value={newPaymentData.bank_name || ''}
                            onChange={(e) => setNewPaymentData({ ...newPaymentData, bank_name: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
                          >
                            <option value="">Select Bank</option>
                            <option value="HDFC Bank">HDFC Bank</option>
                            <option value="ICICI Bank">ICICI Bank</option>
                            <option value="SBI">State Bank of India</option>
                            <option value="Axis Bank">Axis Bank</option>
                            <option value="Kotak Bank">Kotak Mahindra Bank</option>
                            <option value="PNB">Punjab National Bank</option>
                          </select>
                        </div>
                      )}

                      <label className="flex items-center space-x-2 mt-4">
                        <input
                          type="checkbox"
                          checked={newPaymentData.is_default || false}
                          onChange={(e) => setNewPaymentData({ ...newPaymentData, is_default: e.target.checked })}
                          className="w-4 h-4 text-purple-600"
                        />
                        <span className="text-sm text-gray-600">Set as default</span>
                      </label>

                      <div className="flex space-x-3 mt-6">
                        <button
                          onClick={() => { setShowPaymentModal(false); setNewPaymentData({}); }}
                          className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleAddPaymentMethod}
                          disabled={paymentSaving}
                          className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                        >
                          {paymentSaving ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-sm p-8"
              >
                <h2 className="text-2xl mb-6">Account Settings</h2>
                <div className="space-y-6">
                  <div className="flex items-center justify-between py-4 border-b">
                    <div>
                      <h3 className="font-medium">Email Notifications</h3>
                      <p className="text-sm text-gray-500">Receive order updates via email</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex items-center justify-between py-4 border-b">
                    <div>
                      <h3 className="font-medium">Marketing Emails</h3>
                      <p className="text-sm text-gray-500">Receive promotions and offers</p>
                    </div>
                    <input type="checkbox" className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex items-center justify-between py-4">
                    <div>
                      <h3 className="font-medium">Two-Factor Authentication</h3>
                      <p className="text-sm text-gray-500">Add extra security to your account</p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                      Enable
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
