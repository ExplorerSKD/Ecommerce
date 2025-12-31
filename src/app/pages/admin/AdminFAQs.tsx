import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
    HelpCircle, Plus, Edit2, Trash2, Loader2, Search, X,
    ChevronUp, ChevronDown, GripVertical
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { AdminLayout } from '../../components/admin/AdminLayout';

interface FAQ {
    id: number;
    question: string;
    answer: string;
    category?: string;
    order: number;
    is_active: boolean;
    created_at: string;
}

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

const FAQ_CATEGORIES = [
    'General',
    'Orders & Shipping',
    'Payment',
    'Returns & Refunds',
    'Account',
    'Products',
];

export function AdminFAQs() {
    const navigate = useNavigate();
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const [faqs, setFaqs] = useState<FAQ[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const [formData, setFormData] = useState({
        question: '',
        answer: '',
        category: 'General',
        is_active: true,
    });

    useEffect(() => {
        if (!authLoading) {
            if (!isAuthenticated || user?.role !== 'admin') {
                navigate('/login');
            }
        }
    }, [isAuthenticated, authLoading, user, navigate]);

    const fetchFaqs = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_BASE_URL}/admin/faqs`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            const data = await response.json();
            if (data.success && data.data) {
                // Handle paginated response - FAQs may be in data.data.data or data.data
                const faqsArray = Array.isArray(data.data) ? data.data : (data.data.data || []);
                setFaqs(faqsArray);
            }
        } catch (error) {
            console.error('Failed to fetch FAQs:', error);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchFaqs();
        }
    }, [user]);

    const openModal = (faq: FAQ | null = null) => {
        if (faq) {
            setEditingFaq(faq);
            setFormData({
                question: faq.question,
                answer: faq.answer,
                category: faq.category || 'General',
                is_active: faq.is_active,
            });
        } else {
            setEditingFaq(null);
            setFormData({
                question: '',
                answer: '',
                category: 'General',
                is_active: true,
            });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingFaq(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const token = localStorage.getItem('auth_token');
            const url = editingFaq
                ? `${API_BASE_URL}/admin/faqs/${editingFaq.id}`
                : `${API_BASE_URL}/admin/faqs`;

            const response = await fetch(url, {
                method: editingFaq ? 'PUT' : 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                fetchFaqs();
                closeModal();
            }
        } catch (error) {
            console.error('Failed to save FAQ:', error);
        }
        setSaving(false);
    };

    const deleteFaq = async (id: number) => {
        if (!confirm('Are you sure you want to delete this FAQ?')) return;

        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_BASE_URL}/admin/faqs/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (response.ok) {
                setFaqs(faqs.filter(f => f.id !== id));
            }
        } catch (error) {
            console.error('Failed to delete FAQ:', error);
        }
    };

    const updateOrder = async (id: number, direction: 'up' | 'down') => {
        const index = faqs.findIndex(f => f.id === id);
        if (
            (direction === 'up' && index === 0) ||
            (direction === 'down' && index === faqs.length - 1)
        ) {
            return;
        }

        const newIndex = direction === 'up' ? index - 1 : index + 1;
        const newFaqs = [...faqs];
        [newFaqs[index], newFaqs[newIndex]] = [newFaqs[newIndex], newFaqs[index]];
        setFaqs(newFaqs);

        // Update order on server
        try {
            const token = localStorage.getItem('auth_token');
            await fetch(`${API_BASE_URL}/admin/faqs/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ order: newIndex }),
            });
        } catch (error) {
            console.error('Failed to update order:', error);
        }
    };

    const filteredFaqs = faqs.filter(f => {
        const matchesSearch = f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            f.answer.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || f.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    // Group by category
    const groupedFaqs = filteredFaqs.reduce((acc, faq) => {
        const category = faq.category || 'General';
        if (!acc[category]) acc[category] = [];
        acc[category].push(faq);
        return acc;
    }, {} as Record<string, FAQ[]>);

    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
            </div>
        );
    }

    return (
        <AdminLayout title="FAQs" subtitle="Manage frequently asked questions">
            {/* Actions Bar */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4 justify-between">
                    <div className="flex flex-1 gap-4">
                        <div className="flex-1 relative max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search FAQs..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="all">All Categories</option>
                            {FAQ_CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:opacity-90 transition-opacity"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Add FAQ
                    </button>
                </div>
            </div>

            {/* FAQs List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                </div>
            ) : Object.keys(groupedFaqs).length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                    <HelpCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No FAQs found</h3>
                    <p className="text-gray-500 mb-4">Add frequently asked questions to help customers</p>
                    <button
                        onClick={() => openModal()}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                        Add FAQ
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(groupedFaqs).map(([category, categoryFaqs]) => (
                        <div key={category} className="bg-white rounded-xl shadow-sm overflow-hidden">
                            <div className="px-6 py-4 bg-gray-50 border-b">
                                <h3 className="font-semibold text-gray-900">{category}</h3>
                                <p className="text-sm text-gray-500">{categoryFaqs.length} questions</p>
                            </div>

                            <div className="divide-y">
                                {categoryFaqs.map((faq, index) => (
                                    <motion.div
                                        key={faq.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="group"
                                    >
                                        <div className="px-6 py-4 flex items-start gap-4">
                                            <div className="flex flex-col items-center gap-1 pt-1">
                                                <button
                                                    onClick={() => updateOrder(faq.id, 'up')}
                                                    disabled={index === 0}
                                                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                                >
                                                    <ChevronUp className="w-4 h-4" />
                                                </button>
                                                <GripVertical className="w-4 h-4 text-gray-300" />
                                                <button
                                                    onClick={() => updateOrder(faq.id, 'down')}
                                                    disabled={index === categoryFaqs.length - 1}
                                                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                                >
                                                    <ChevronDown className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <div className="flex-1">
                                                <button
                                                    onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                                                    className="w-full text-left"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="font-medium text-gray-900">{faq.question}</h4>
                                                        <motion.div
                                                            animate={{ rotate: expandedId === faq.id ? 180 : 0 }}
                                                        >
                                                            <ChevronDown className="w-5 h-5 text-gray-400" />
                                                        </motion.div>
                                                    </div>
                                                </button>

                                                <AnimatePresence>
                                                    {expandedId === faq.id && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="overflow-hidden"
                                                        >
                                                            <p className="mt-3 text-gray-600 whitespace-pre-wrap">
                                                                {faq.answer}
                                                            </p>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>

                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${faq.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                                    {faq.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                                <button
                                                    onClick={() => openModal(faq)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => deleteFaq(faq.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
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
                                    {editingFaq ? 'Edit FAQ' : 'Add FAQ'}
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
                                        Category
                                    </label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                    >
                                        {FAQ_CATEGORIES.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Question *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.question}
                                        onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                        required
                                        placeholder="e.g., How do I track my order?"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Answer *
                                    </label>
                                    <textarea
                                        value={formData.answer}
                                        onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                        required
                                        rows={5}
                                        placeholder="Provide a detailed answer..."
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
                                        Show this FAQ to customers
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
                                        {editingFaq ? 'Update FAQ' : 'Add FAQ'}
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
