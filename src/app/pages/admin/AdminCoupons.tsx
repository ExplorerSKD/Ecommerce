import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
    Tag, Plus, Edit2, Trash2, Loader2, Search, X, Check,
    Calendar, Percent, DollarSign
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { AdminLayout } from '../../components/admin/AdminLayout';

interface Coupon {
    id: number;
    code: string;
    description?: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    min_order_amount?: number;
    max_discount?: number;
    usage_limit?: number;
    used_count: number;
    starts_at?: string;
    expires_at?: string;
    is_active: boolean;
    created_at: string;
}

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

export function AdminCoupons() {
    const navigate = useNavigate();
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const [formData, setFormData] = useState({
        code: '',
        description: '',
        discount_type: 'percentage' as 'percentage' | 'fixed',
        discount_value: '',
        min_order_amount: '',
        max_discount: '',
        usage_limit: '',
        starts_at: '',
        expires_at: '',
        is_active: true,
    });

    useEffect(() => {
        if (!authLoading) {
            if (!isAuthenticated || user?.role !== 'admin') {
                navigate('/login');
            }
        }
    }, [isAuthenticated, authLoading, user, navigate]);

    const fetchCoupons = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_BASE_URL}/admin/coupons`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            const data = await response.json();
            if (data.success && data.data) {
                // Handle paginated response - coupons are in data.data.data
                setCoupons(data.data.data || data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch coupons:', error);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchCoupons();
        }
    }, [user]);

    const openModal = (coupon: Coupon | null = null) => {
        if (coupon) {
            setEditingCoupon(coupon);
            setFormData({
                code: coupon.code,
                description: coupon.description || '',
                discount_type: coupon.discount_type,
                discount_value: coupon.discount_value.toString(),
                min_order_amount: coupon.min_order_amount?.toString() || '',
                max_discount: coupon.max_discount?.toString() || '',
                usage_limit: coupon.usage_limit?.toString() || '',
                starts_at: coupon.starts_at?.split('T')[0] || '',
                expires_at: coupon.expires_at?.split('T')[0] || '',
                is_active: coupon.is_active,
            });
        } else {
            setEditingCoupon(null);
            setFormData({
                code: '',
                description: '',
                discount_type: 'percentage',
                discount_value: '',
                min_order_amount: '',
                max_discount: '',
                usage_limit: '',
                starts_at: '',
                expires_at: '',
                is_active: true,
            });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingCoupon(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const token = localStorage.getItem('auth_token');
            const url = editingCoupon
                ? `${API_BASE_URL}/admin/coupons/${editingCoupon.id}`
                : `${API_BASE_URL}/admin/coupons`;

            const response = await fetch(url, {
                method: editingCoupon ? 'PUT' : 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    discount_value: parseFloat(formData.discount_value),
                    min_order_amount: formData.min_order_amount ? parseFloat(formData.min_order_amount) : null,
                    max_discount: formData.max_discount ? parseFloat(formData.max_discount) : null,
                    usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
                }),
            });

            if (response.ok) {
                fetchCoupons();
                closeModal();
            }
        } catch (error) {
            console.error('Failed to save coupon:', error);
        }
        setSaving(false);
    };

    const deleteCoupon = async (id: number) => {
        if (!confirm('Are you sure you want to delete this coupon?')) return;

        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_BASE_URL}/admin/coupons/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (response.ok) {
                setCoupons(coupons.filter(c => c.id !== id));
            }
        } catch (error) {
            console.error('Failed to delete coupon:', error);
        }
    };

    const toggleActive = async (coupon: Coupon) => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_BASE_URL}/admin/coupons/${coupon.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ is_active: !coupon.is_active }),
            });

            if (response.ok) {
                setCoupons(coupons.map(c =>
                    c.id === coupon.id ? { ...c, is_active: !c.is_active } : c
                ));
            }
        } catch (error) {
            console.error('Failed to toggle coupon status:', error);
        }
    };

    const filteredCoupons = coupons.filter(c =>
        c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
            </div>
        );
    }

    return (
        <AdminLayout title="Coupons" subtitle="Manage discount coupons">
            {/* Actions Bar */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4 justify-between">
                    <div className="flex-1 relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search coupons..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:opacity-90 transition-opacity"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Add Coupon
                    </button>
                </div>
            </div>

            {/* Coupons Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                </div>
            ) : filteredCoupons.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                    <Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No coupons found</h3>
                    <p className="text-gray-500 mb-4">Create your first discount coupon</p>
                    <button
                        onClick={() => openModal()}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                        Create Coupon
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCoupons.map((coupon) => (
                        <motion.div
                            key={coupon.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-xl shadow-sm overflow-hidden"
                        >
                            <div className={`p-4 ${coupon.is_active ? 'bg-gradient-to-r from-purple-500 to-blue-500' : 'bg-gray-400'}`}>
                                <div className="flex items-center justify-between">
                                    <code className="text-xl font-bold text-white">{coupon.code}</code>
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${coupon.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                        {coupon.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>

                            <div className="p-4 space-y-3">
                                <div className="flex items-center text-gray-600">
                                    {coupon.discount_type === 'percentage' ? (
                                        <Percent className="w-4 h-4 mr-2" />
                                    ) : (
                                        <DollarSign className="w-4 h-4 mr-2" />
                                    )}
                                    <span className="font-semibold text-lg text-gray-900">
                                        {coupon.discount_type === 'percentage'
                                            ? `${coupon.discount_value}% OFF`
                                            : `₹${coupon.discount_value} OFF`
                                        }
                                    </span>
                                </div>

                                {coupon.description && (
                                    <p className="text-sm text-gray-500">{coupon.description}</p>
                                )}

                                {coupon.min_order_amount && (
                                    <p className="text-xs text-gray-500">
                                        Min. order: ₹{coupon.min_order_amount}
                                    </p>
                                )}

                                {coupon.expires_at && (
                                    <div className="flex items-center text-xs text-gray-500">
                                        <Calendar className="w-3 h-3 mr-1" />
                                        Expires: {new Date(coupon.expires_at).toLocaleDateString()}
                                    </div>
                                )}

                                <div className="text-xs text-gray-500">
                                    Used: {coupon.used_count || 0} {coupon.usage_limit ? `/ ${coupon.usage_limit}` : ''} times
                                </div>

                                <div className="flex items-center justify-between pt-3 border-t">
                                    <button
                                        onClick={() => toggleActive(coupon)}
                                        className={`p-2 rounded-lg transition-colors ${coupon.is_active ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'}`}
                                    >
                                        <Check className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => openModal(coupon)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                        <Edit2 className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => deleteCoupon(coupon.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        onClick={closeModal}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 border-b flex items-center justify-between">
                                <h3 className="text-xl font-semibold">
                                    {editingCoupon ? 'Edit Coupon' : 'Create Coupon'}
                                </h3>
                                <button
                                    onClick={closeModal}
                                    className="p-2 hover:bg-gray-100 rounded-lg"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Coupon Code *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                        required
                                        placeholder="e.g., SAVE20"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                        placeholder="e.g., 20% off on all items"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Discount Type *
                                        </label>
                                        <select
                                            value={formData.discount_type}
                                            onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as 'percentage' | 'fixed' })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                        >
                                            <option value="percentage">Percentage</option>
                                            <option value="fixed">Fixed Amount</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Discount Value *
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.discount_value}
                                            onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                            required
                                            min="0"
                                            step={formData.discount_type === 'percentage' ? '1' : '0.01'}
                                            placeholder={formData.discount_type === 'percentage' ? '20' : '100'}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Min. Order Amount
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.min_order_amount}
                                            onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                            min="0"
                                            placeholder="500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Max. Discount (₹)
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.max_discount}
                                            onChange={(e) => setFormData({ ...formData, max_discount: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                            min="0"
                                            placeholder="200"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Start Date
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.starts_at}
                                            onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Expiry Date
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.expires_at}
                                            onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Usage Limit
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.usage_limit}
                                        onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                        min="1"
                                        placeholder="Leave empty for unlimited"
                                    />
                                </div>

                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="is_active"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                    />
                                    <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                                        Active (coupon can be used)
                                    </label>
                                </div>

                                <div className="flex justify-end space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center"
                                    >
                                        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                        {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </AdminLayout>
    );
}
