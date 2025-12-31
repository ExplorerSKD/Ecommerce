import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
    Plus, Pencil, Trash2, Loader2, Search, ChevronLeft, ChevronRight, Upload, X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { productsApi, categoriesApi, Product, Category } from '../../services/api';
import { AdminLayout } from '../../components/admin/AdminLayout';

const API_BASE = 'http://127.0.0.1:8000/api/v1';

export function AdminProducts() {
    const navigate = useNavigate();
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState<number | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        original_price: '',
        stock: '',
        category_id: '',
        badge: '',
        image: '',
        is_featured: false,
        is_active: true,
    });

    useEffect(() => {
        if (!authLoading) {
            if (!isAuthenticated || user?.role !== 'admin') {
                navigate('/login');
            }
        }
    }, [isAuthenticated, authLoading, user, navigate]);

    useEffect(() => {
        loadProducts();
        loadCategories();
    }, [currentPage, search]);

    const loadProducts = async () => {
        setLoading(true);
        const result = await productsApi.getAll({
            page: currentPage,
            per_page: 10,
            search: search || undefined,
        });

        if (result.success && result.data) {
            setProducts(result.data.data);
            setTotalPages(result.data.last_page);
        }
        setLoading(false);
    };

    const loadCategories = async () => {
        const result = await categoriesApi.getAll();
        if (result.success && result.data) {
            setCategories(result.data);
        }
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            description: product.description || '',
            price: product.price,
            original_price: product.original_price || '',
            stock: String(product.stock),
            category_id: String(product.category_id),
            badge: product.badge || '',
            image: product.image || '',
            is_featured: product.is_featured,
            is_active: true,
        });
        setImageFile(null);
        setImagePreview(product.image_url || product.image || '');
        setShowModal(true);
    };

    const handleCreate = () => {
        setEditingProduct(null);
        setFormData({
            name: '',
            description: '',
            price: '',
            original_price: '',
            stock: '',
            category_id: categories[0]?.id.toString() || '',
            badge: '',
            image: '',
            is_featured: false,
            is_active: true,
        });
        setImageFile(null);
        setImagePreview('');
        setShowModal(true);
    };

    const handleSave = async () => {
        setSaving(true);
        const token = localStorage.getItem('auth_token');

        try {
            // If editing and we have an image file, upload it first
            let imagePath = formData.image;

            // For new products with image, we'll use FormData
            if (!editingProduct && imageFile) {
                const formDataObj = new FormData();
                formDataObj.append('category_id', formData.category_id);
                formDataObj.append('name', formData.name);
                formDataObj.append('description', formData.description);
                formDataObj.append('price', formData.price);
                if (formData.original_price) formDataObj.append('original_price', formData.original_price);
                formDataObj.append('stock', formData.stock);
                if (formData.badge) formDataObj.append('badge', formData.badge);
                formDataObj.append('is_featured', formData.is_featured ? '1' : '0');
                formDataObj.append('is_active', formData.is_active ? '1' : '0');
                formDataObj.append('image', imageFile);

                const response = await fetch(`${API_BASE}/admin/products`, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: formDataObj,
                });

                if (response.ok) {
                    setShowModal(false);
                    setImageFile(null);
                    setImagePreview('');
                    loadProducts();
                } else {
                    const data = await response.json();
                    alert(data.message || 'Failed to create product');
                }
                setSaving(false);
                return;
            }

            // For updates or products without image file
            const body = {
                ...formData,
                price: parseFloat(formData.price),
                original_price: formData.original_price ? parseFloat(formData.original_price) : null,
                stock: parseInt(formData.stock),
                category_id: parseInt(formData.category_id),
            };

            const url = editingProduct
                ? `${API_BASE}/admin/products/${editingProduct.id}`
                : `${API_BASE}/admin/products`;

            const response = await fetch(url, {
                method: editingProduct ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });

            if (response.ok) {
                const data = await response.json();
                const productId = editingProduct?.id || data.data?.id;

                // Upload image separately for existing products
                if (imageFile && productId) {
                    const imageFormData = new FormData();
                    imageFormData.append('image', imageFile);

                    await fetch(`${API_BASE}/admin/products/${productId}/image`, {
                        method: 'POST',
                        headers: {
                            'Accept': 'application/json',
                            'Authorization': `Bearer ${token}`,
                        },
                        body: imageFormData,
                    });
                }

                setShowModal(false);
                setImageFile(null);
                setImagePreview('');
                loadProducts();
            } else {
                const data = await response.json();
                alert(data.message || 'Failed to save product');
            }
        } catch (error) {
            console.error('Failed to save product:', error);
            alert('Failed to save product');
        }

        setSaving(false);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this product?')) return;

        setDeleting(id);
        const token = localStorage.getItem('auth_token');

        const response = await fetch(`${API_BASE}/admin/products/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (response.ok) {
            loadProducts();
        } else {
            alert('Failed to delete product');
        }

        setDeleting(null);
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
            </div>
        );
    }

    return (
        <AdminLayout title="Products" subtitle="Manage your product catalog">
            {/* Header with Add Button */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCreate}
                    className="flex items-center space-x-2 bg-purple-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-purple-700 text-sm sm:text-base"
                >
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Add Product</span>
                </motion.button>
            </div>

            {/* Search */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                </div>
            </div>

            {/* Products List */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* Desktop Table - Hidden on Mobile */}
                        <div className="hidden lg:block overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="text-left px-6 py-4 text-gray-600 text-sm font-medium">Product</th>
                                        <th className="text-left px-6 py-4 text-gray-600 text-sm font-medium">Category</th>
                                        <th className="text-left px-6 py-4 text-gray-600 text-sm font-medium">Price</th>
                                        <th className="text-left px-6 py-4 text-gray-600 text-sm font-medium">Stock</th>
                                        <th className="text-left px-6 py-4 text-gray-600 text-sm font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map((product) => (
                                        <tr key={product.id} className="border-t hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-3">
                                                    <img
                                                        src={product.image_url || product.image || 'https://via.placeholder.com/50'}
                                                        alt={product.name}
                                                        className="w-12 h-12 rounded-lg object-cover"
                                                    />
                                                    <div>
                                                        <p className="font-medium">{product.name}</p>
                                                        {product.badge && (
                                                            <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded">
                                                                {product.badge}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {product.category?.name || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-medium">₹{parseFloat(product.price).toFixed(2)}</span>
                                                {product.original_price && (
                                                    <span className="text-gray-400 line-through ml-2 text-sm">
                                                        ₹{parseFloat(product.original_price).toFixed(2)}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-sm ${product.stock > 10
                                                    ? 'bg-green-100 text-green-700'
                                                    : product.stock > 0
                                                        ? 'bg-yellow-100 text-yellow-700'
                                                        : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {product.stock} in stock
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => handleEdit(product)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(product.id)}
                                                        disabled={deleting === product.id}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                    >
                                                        {deleting === product.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="lg:hidden divide-y divide-gray-100">
                            {products.map((product) => (
                                <div key={product.id} className="p-4 hover:bg-gray-50">
                                    <div className="flex items-start gap-3">
                                        <img
                                            src={product.image_url || product.image || 'https://via.placeholder.com/50'}
                                            alt={product.name}
                                            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <p className="font-medium text-gray-900 truncate">{product.name}</p>
                                                    <p className="text-sm text-gray-500">{product.category?.name || 'N/A'}</p>
                                                </div>
                                                {product.badge && (
                                                    <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded flex-shrink-0">
                                                        {product.badge}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between mt-2">
                                                <div>
                                                    <span className="font-bold text-purple-600">₹{parseFloat(product.price).toFixed(2)}</span>
                                                    {product.original_price && (
                                                        <span className="text-gray-400 line-through ml-2 text-sm">
                                                            ₹{parseFloat(product.original_price).toFixed(2)}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className={`px-2 py-0.5 rounded text-xs ${product.stock > 10
                                                    ? 'bg-green-100 text-green-700'
                                                    : product.stock > 0
                                                        ? 'bg-yellow-100 text-yellow-700'
                                                        : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {product.stock} in stock
                                                </span>
                                            </div>
                                            <div className="flex justify-end gap-2 mt-2">
                                                <button
                                                    onClick={() => handleEdit(product)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(product.id)}
                                                    disabled={deleting === product.id}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                >
                                                    {deleting === product.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="w-4 h-4" />
                                                    )}
                                                </button>
                                            </div>
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

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                    >
                        <h3 className="text-2xl font-bold mb-6">
                            {editingProduct ? 'Edit Product' : 'Add Product'}
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm mb-1 text-gray-700">Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm mb-1 text-gray-700">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                                />
                            </div>

                            <div>
                                <label className="block text-sm mb-1 text-gray-700">Price (₹) *</label>
                                <input
                                    type="number"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                                />
                            </div>

                            <div>
                                <label className="block text-sm mb-1 text-gray-700">Original Price (₹)</label>
                                <input
                                    type="number"
                                    value={formData.original_price}
                                    onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                                />
                            </div>

                            <div>
                                <label className="block text-sm mb-1 text-gray-700">Stock *</label>
                                <input
                                    type="number"
                                    value={formData.stock}
                                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                                />
                            </div>

                            <div>
                                <label className="block text-sm mb-1 text-gray-700">Category *</label>
                                <select
                                    value={formData.category_id}
                                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                                >
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm mb-1 text-gray-700">Badge</label>
                                <input
                                    type="text"
                                    value={formData.badge}
                                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                                    placeholder="e.g., Sale, New"
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm mb-1 text-gray-700">Product Image</label>
                                <div className="flex items-start gap-4">
                                    {/* Image Preview */}
                                    {(imagePreview || formData.image) && (
                                        <div className="relative">
                                            <img
                                                src={imagePreview || formData.image}
                                                alt="Preview"
                                                className="w-24 h-24 object-cover rounded-lg border"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setImageFile(null);
                                                    setImagePreview('');
                                                    setFormData({ ...formData, image: '' });
                                                }}
                                                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    )}

                                    {/* File Upload */}
                                    <div className="flex-1">
                                        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors">
                                            <Upload className="w-6 h-6 text-gray-400 mb-1" />
                                            <span className="text-sm text-gray-500">Click to upload image</span>
                                            <span className="text-xs text-gray-400">PNG, JPG, GIF up to 5MB</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        setImageFile(file);
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => {
                                                            setImagePreview(reader.result as string);
                                                        };
                                                        reader.readAsDataURL(file);
                                                    }
                                                }}
                                            />
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="col-span-2">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_featured}
                                        onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                                        className="w-4 h-4 text-purple-600"
                                    />
                                    <span className="text-sm text-gray-700">Featured Product</span>
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-4 mt-6">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving || !formData.name || !formData.price || !formData.stock}
                                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center"
                            >
                                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                {editingProduct ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AdminLayout>
    );
}
