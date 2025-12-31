import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Pencil, Trash2, Loader2, ChevronDown, ChevronRight, FolderTree } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { categoriesApi, Category } from '../../services/api';
import { AdminLayout } from '../../components/admin/AdminLayout';

const API_BASE = 'http://127.0.0.1:8000/api/v1';

interface CategoryWithChildren {
    id: number;
    name: string;
    slug?: string;
    description?: string;
    image?: string;
    products_count?: number;
    parent_id?: number | null;
    show_on_home?: boolean;
    children?: CategoryWithChildren[];
}

export function AdminCategories() {
    const navigate = useNavigate();
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const [categories, setCategories] = useState<CategoryWithChildren[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<CategoryWithChildren | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState<number | null>(null);
    const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        image: '',
        parent_id: '' as string | number,
        show_on_home: false,
    });

    useEffect(() => {
        if (!authLoading) {
            if (!isAuthenticated || user?.role !== 'admin') {
                navigate('/login');
            }
        }
    }, [isAuthenticated, authLoading, user, navigate]);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        setLoading(true);
        const result = await categoriesApi.getAll();
        if (result.success && result.data) {
            // Organize into parent-child hierarchy
            const allCategories = result.data as CategoryWithChildren[];
            const parentCategories = allCategories.filter(c => !c.parent_id);

            // Attach children to parents
            parentCategories.forEach(parent => {
                parent.children = allCategories.filter(c => c.parent_id === parent.id);
            });

            setCategories(parentCategories);
        }
        setLoading(false);
    };

    const getParentCategories = (): CategoryWithChildren[] => {
        // Return all categories that could be parents (currently loaded)
        return categories;
    };

    const handleEdit = (category: CategoryWithChildren) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            description: category.description || '',
            image: category.image || '',
            parent_id: category.parent_id || '',
            show_on_home: category.show_on_home || false,
        });
        setShowModal(true);
    };

    const handleCreate = (parentId?: number) => {
        setEditingCategory(null);
        setFormData({
            name: '',
            description: '',
            image: '',
            parent_id: parentId || '',
            show_on_home: false,
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        setSaving(true);
        const token = localStorage.getItem('auth_token');

        const url = editingCategory
            ? `${API_BASE}/admin/categories/${editingCategory.id}`
            : `${API_BASE}/admin/categories`;

        const payload = {
            ...formData,
            parent_id: formData.parent_id || null,
        };

        const response = await fetch(url, {
            method: editingCategory ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        });

        if (response.ok) {
            setShowModal(false);
            loadCategories();
        } else {
            const data = await response.json();
            alert(data.message || 'Failed to save category');
        }

        setSaving(false);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure? This will also delete all subcategories and products.')) return;

        setDeleting(id);
        const token = localStorage.getItem('auth_token');

        const response = await fetch(`${API_BASE}/admin/categories/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (response.ok) {
            loadCategories();
        } else {
            alert('Failed to delete category');
        }

        setDeleting(null);
    };

    const toggleExpand = (categoryId: number) => {
        setExpandedCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(categoryId)) {
                newSet.delete(categoryId);
            } else {
                newSet.add(categoryId);
            }
            return newSet;
        });
    };

    const renderCategory = (category: CategoryWithChildren, isSubcategory = false) => {
        const hasChildren = category.children && category.children.length > 0;
        const isExpanded = expandedCategories.has(category.id);

        return (
            <div key={category.id}>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`bg-white rounded-xl shadow-sm overflow-hidden ${isSubcategory ? 'ml-6 sm:ml-8 border-l-4 border-purple-200' : ''}`}
                >
                    <div className="flex items-center p-3 sm:p-4">
                        {/* Expand/Collapse for parent categories */}
                        {!isSubcategory && (
                            <button
                                onClick={() => toggleExpand(category.id)}
                                className="p-1 mr-2 hover:bg-gray-100 rounded"
                            >
                                {hasChildren ? (
                                    isExpanded ? (
                                        <ChevronDown className="w-5 h-5 text-gray-500" />
                                    ) : (
                                        <ChevronRight className="w-5 h-5 text-gray-500" />
                                    )
                                ) : (
                                    <div className="w-5 h-5" />
                                )}
                            </button>
                        )}

                        {/* Category Image */}
                        <div className={`${isSubcategory ? 'w-10 h-10' : 'w-12 h-12 sm:w-16 sm:h-16'} bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg overflow-hidden flex-shrink-0`}>
                            {category.image ? (
                                <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <FolderTree className="w-5 h-5 text-purple-400" />
                                </div>
                            )}
                        </div>

                        {/* Category Info */}
                        <div className="flex-1 ml-3 sm:ml-4 min-w-0">
                            <h3 className={`${isSubcategory ? 'text-sm' : 'text-base sm:text-lg'} font-semibold truncate`}>
                                {category.name}
                            </h3>
                            <p className="text-gray-500 text-xs sm:text-sm truncate">
                                {category.description || 'No description'}
                            </p>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="text-purple-600 text-xs">
                                    {category.products_count || 0} products
                                </span>
                                {hasChildren && (
                                    <span className="text-blue-600 text-xs">
                                        {category.children?.length} subcategories
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 sm:gap-2 ml-2">
                            {!isSubcategory && (
                                <button
                                    onClick={() => handleCreate(category.id)}
                                    className="p-1.5 sm:p-2 text-green-600 hover:bg-green-50 rounded-lg"
                                    title="Add Subcategory"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            )}
                            <button
                                onClick={() => handleEdit(category)}
                                className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            >
                                <Pencil className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleDelete(category.id)}
                                disabled={deleting === category.id}
                                className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                                {deleting === category.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Trash2 className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Render subcategories */}
                <AnimatePresence>
                    {isExpanded && hasChildren && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-2 mt-2"
                        >
                            {category.children?.map(child => renderCategory(child, true))}
                        </motion.div>
                    )}
                </AnimatePresence>
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
        <AdminLayout title="Categories" subtitle="Organize your product categories and subcategories">
            {/* Header with Add Button */}
            <div className="flex justify-between items-center mb-6">
                <div className="text-sm text-gray-500">
                    {categories.length} parent categories
                </div>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleCreate()}
                    className="flex items-center space-x-2 bg-purple-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-purple-700 text-sm sm:text-base"
                >
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Add Category</span>
                </motion.button>
            </div>

            {/* Categories List */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                </div>
            ) : categories.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <FolderTree className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>No categories yet. Add your first category!</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {categories.map(category => renderCategory(category))}
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
                    >
                        <h3 className="text-xl sm:text-2xl font-bold mb-6">
                            {editingCategory ? 'Edit Category' : formData.parent_id ? 'Add Subcategory' : 'Add Category'}
                        </h3>

                        <div className="space-y-4">
                            {/* Parent Category Selector */}
                            <div>
                                <label className="block text-sm mb-1 text-gray-700">Parent Category</label>
                                <select
                                    value={formData.parent_id}
                                    onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                                >
                                    <option value="">None (Top-level category)</option>
                                    {getParentCategories().map(cat => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">
                                    Leave empty for a main category, or select a parent for subcategory.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm mb-1 text-gray-700">Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                                />
                            </div>

                            <div>
                                <label className="block text-sm mb-1 text-gray-700">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="show_on_home"
                                    checked={formData.show_on_home}
                                    onChange={(e) => setFormData({ ...formData, show_on_home: e.target.checked })}
                                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                                />
                                <label htmlFor="show_on_home" className="text-sm text-gray-700 font-medium">
                                    Show on Home Page (Limit 4)
                                </label>
                            </div>

                            <div>
                                <label className="block text-sm mb-1 text-gray-700">Image URL</label>
                                <input
                                    type="text"
                                    value={formData.image}
                                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end space-x-4 mt-6">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 sm:px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving || !formData.name}
                                className="px-4 sm:px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center"
                            >
                                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                {editingCategory ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AdminLayout>
    );
}
