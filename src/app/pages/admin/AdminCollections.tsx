import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
    Layers, Plus, Edit2, Trash2, Loader2, Search, X,
    Image, Eye, EyeOff, Package, Upload
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Product } from '../../services/api';

interface Collection {
    id: number;
    name: string;
    slug: string;
    description?: string;
    image?: string;
    is_active: boolean;
    products_count?: number;
    products?: Product[];
    created_at: string;
}

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

export function AdminCollections() {
    const navigate = useNavigate();
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const [collections, setCollections] = useState<Collection[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showProductsModal, setShowProductsModal] = useState(false);
    const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
    const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        image: '',
        is_active: true,
    });

    useEffect(() => {
        if (!authLoading) {
            if (!isAuthenticated || user?.role !== 'admin') {
                navigate('/login');
            }
        }
    }, [isAuthenticated, authLoading, user, navigate]);

    const fetchCollections = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_BASE_URL}/admin/collections`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            const data = await response.json();
            if (data.success && data.data) {
                // Handle paginated response - collections may be in data.data.data or data.data
                const collectionsArray = Array.isArray(data.data) ? data.data : (data.data.data || []);
                setCollections(collectionsArray);
            }
        } catch (error) {
            console.error('Failed to fetch collections:', error);
        }
        setLoading(false);
    };

    const fetchProducts = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_BASE_URL}/products?per_page=100`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            const data = await response.json();
            if (data.success && data.data) {
                setAllProducts(data.data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch products:', error);
        }
    };

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchCollections();
            fetchProducts();
        }
    }, [user]);

    const openModal = (collection: Collection | null = null) => {
        if (collection) {
            setEditingCollection(collection);
            setFormData({
                name: collection.name,
                description: collection.description || '',
                image: collection.image || '',
                is_active: collection.is_active,
            });
            setImagePreview(collection.image || '');
        } else {
            setEditingCollection(null);
            setFormData({
                name: '',
                description: '',
                image: '',
                is_active: true,
            });
            setImagePreview('');
        }
        setImageFile(null);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingCollection(null);
        setImageFile(null);
        setImagePreview('');
    };

    const openProductsModal = (collection: Collection) => {
        setSelectedCollection(collection);
        setSelectedProductIds(collection.products?.map(p => p.id) || []);
        setShowProductsModal(true);
    };

    const closeProductsModal = () => {
        setShowProductsModal(false);
        setSelectedCollection(null);
        setSelectedProductIds([]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const token = localStorage.getItem('auth_token');
            const url = editingCollection
                ? `${API_BASE_URL}/admin/collections/${editingCollection.id}`
                : `${API_BASE_URL}/admin/collections`;

            const response = await fetch(url, {
                method: editingCollection ? 'PUT' : 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                fetchCollections();
                closeModal();
            }
        } catch (error) {
            console.error('Failed to save collection:', error);
        }
        setSaving(false);
    };

    const deleteCollection = async (id: number) => {
        if (!confirm('Are you sure you want to delete this collection?')) return;

        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_BASE_URL}/admin/collections/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (response.ok) {
                setCollections(collections.filter(c => c.id !== id));
            }
        } catch (error) {
            console.error('Failed to delete collection:', error);
        }
    };

    const toggleVisibility = async (collection: Collection) => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_BASE_URL}/admin/collections/${collection.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ is_active: !collection.is_active }),
            });

            if (response.ok) {
                setCollections(collections.map(c =>
                    c.id === collection.id ? { ...c, is_active: !c.is_active } : c
                ));
            }
        } catch (error) {
            console.error('Failed to toggle visibility:', error);
        }
    };

    const updateCollectionProducts = async () => {
        if (!selectedCollection) return;
        setSaving(true);

        try {
            const token = localStorage.getItem('auth_token');

            // First remove all products
            await fetch(`${API_BASE_URL}/admin/collections/${selectedCollection.id}/products`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ product_ids: selectedCollection.products?.map(p => p.id) || [] }),
            });

            // Then add selected products
            if (selectedProductIds.length > 0) {
                await fetch(`${API_BASE_URL}/admin/collections/${selectedCollection.id}/products`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify({ product_ids: selectedProductIds }),
                });
            }

            fetchCollections();
            closeProductsModal();
        } catch (error) {
            console.error('Failed to update products:', error);
        }
        setSaving(false);
    };

    const filteredCollections = collections.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
        <AdminLayout title="Collections" subtitle="Manage product collections">
            {/* Actions Bar */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4 justify-between">
                    <div className="flex-1 relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search collections..."
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
                        Add Collection
                    </button>
                </div>
            </div>

            {/* Collections Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                </div>
            ) : filteredCollections.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                    <Layers className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No collections found</h3>
                    <p className="text-gray-500 mb-4">Create collections to group related products</p>
                    <button
                        onClick={() => openModal()}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                        Create Collection
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCollections.map((collection) => (
                        <motion.div
                            key={collection.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-xl shadow-sm overflow-hidden group"
                        >
                            <div className="relative aspect-video bg-gray-100">
                                {collection.image ? (
                                    <img
                                        src={collection.image}
                                        alt={collection.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Image className="w-12 h-12 text-gray-300" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                    <button
                                        onClick={() => openModal(collection)}
                                        className="p-2 bg-white rounded-full text-blue-600 hover:bg-blue-50"
                                    >
                                        <Edit2 className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => openProductsModal(collection)}
                                        className="p-2 bg-white rounded-full text-purple-600 hover:bg-purple-50"
                                    >
                                        <Package className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => deleteCollection(collection.id)}
                                        className="p-2 bg-white rounded-full text-red-600 hover:bg-red-50"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                                <span className={`absolute top-3 right-3 px-2 py-1 text-xs font-medium rounded-full ${collection.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                    {collection.is_active ? 'Active' : 'Hidden'}
                                </span>
                            </div>

                            <div className="p-4">
                                <h3 className="font-semibold text-gray-900">{collection.name}</h3>
                                {collection.description && (
                                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{collection.description}</p>
                                )}
                                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                                    <span className="text-sm text-gray-500">
                                        {collection.products_count || 0} products
                                    </span>
                                    <button
                                        onClick={() => toggleVisibility(collection)}
                                        className={`p-2 rounded-lg transition-colors ${collection.is_active ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'}`}
                                    >
                                        {collection.is_active ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
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
                                    {editingCollection ? 'Edit Collection' : 'Create Collection'}
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
                                        Collection Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                        required
                                        placeholder="e.g., Summer Collection"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                        rows={3}
                                        placeholder="Describe this collection..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Collection Image
                                    </label>
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

                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="is_active"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                    />
                                    <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                                        Make this collection visible
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
                                        {editingCollection ? 'Update' : 'Create'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Products Modal */}
            <AnimatePresence>
                {showProductsModal && selectedCollection && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        onClick={closeProductsModal}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 border-b flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-semibold">Manage Products</h3>
                                    <p className="text-sm text-gray-500">{selectedCollection.name}</p>
                                </div>
                                <button
                                    onClick={closeProductsModal}
                                    className="p-2 hover:bg-gray-100 rounded-lg"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">
                                <p className="text-sm text-gray-500 mb-4">
                                    Select products to include in this collection ({selectedProductIds.length} selected)
                                </p>
                                <div className="grid grid-cols-1 gap-2">
                                    {allProducts.map((product) => (
                                        <label
                                            key={product.id}
                                            className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${selectedProductIds.includes(product.id)
                                                ? 'border-purple-500 bg-purple-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedProductIds.includes(product.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedProductIds([...selectedProductIds, product.id]);
                                                    } else {
                                                        setSelectedProductIds(selectedProductIds.filter(id => id !== product.id));
                                                    }
                                                }}
                                                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                            />
                                            <img
                                                src={product.image || '/placeholder.png'}
                                                alt={product.name}
                                                className="w-12 h-12 rounded-lg object-cover ml-3"
                                            />
                                            <div className="ml-3 flex-1">
                                                <p className="font-medium text-gray-900">{product.name}</p>
                                                <p className="text-sm text-gray-500">₹{product.price}</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="p-6 border-t flex justify-end space-x-3">
                                <button
                                    onClick={closeProductsModal}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={updateCollectionProducts}
                                    disabled={saving}
                                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center"
                                >
                                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Save Products
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </AdminLayout>
    );
}
