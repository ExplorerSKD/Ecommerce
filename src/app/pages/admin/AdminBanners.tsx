import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Image, Loader2, Plus, Edit2, Trash2, Eye, EyeOff,
    ChevronUp, ChevronDown, X, Upload
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { bannersApi, Banner } from '../../services/api';

export function AdminBanners() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
    const [saving, setSaving] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        title: '',
        subtitle: '',
        description: '',
        button_text: 'Shop Now',
        button_link: '/shop',
        is_active: true,
    });
    const [imageFile, setImageFile] = useState<File | null>(null);

    useEffect(() => {
        fetchBanners();
    }, []);

    const fetchBanners = async () => {
        setLoading(true);
        const result = await bannersApi.adminGetAll();
        if (result.success && result.data) {
            setBanners(result.data);
        }
        setLoading(false);
    };

    const openModal = (banner?: Banner) => {
        if (banner) {
            setEditingBanner(banner);
            setFormData({
                title: banner.title,
                subtitle: banner.subtitle || '',
                description: banner.description || '',
                button_text: banner.button_text,
                button_link: banner.button_link,
                is_active: banner.is_active ?? true,
            });
            setPreviewImage(banner.image);
        } else {
            setEditingBanner(null);
            setFormData({
                title: '',
                subtitle: '',
                description: '',
                button_text: 'Shop Now',
                button_link: '/shop',
                is_active: true,
            });
            setPreviewImage(null);
        }
        setImageFile(null);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingBanner(null);
        setPreviewImage(null);
        setImageFile(null);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const data = new FormData();
        data.append('title', formData.title);
        data.append('subtitle', formData.subtitle);
        data.append('description', formData.description);
        data.append('button_text', formData.button_text);
        data.append('button_link', formData.button_link);
        data.append('is_active', formData.is_active ? '1' : '0');

        if (imageFile) {
            data.append('image', imageFile);
        }

        let result;
        if (editingBanner) {
            result = await bannersApi.update(editingBanner.id, data);
        } else {
            if (!imageFile) {
                alert('Please select an image');
                setSaving(false);
                return;
            }
            result = await bannersApi.create(data);
        }

        if (result.success) {
            fetchBanners();
            closeModal();
        } else {
            alert(result.message || 'Failed to save banner');
        }

        setSaving(false);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this banner?')) return;

        const result = await bannersApi.delete(id);
        if (result.success) {
            fetchBanners();
        }
    };

    const handleToggleStatus = async (id: number) => {
        const result = await bannersApi.toggleStatus(id);
        if (result.success) {
            setBanners(banners.map(b =>
                b.id === id ? { ...b, is_active: !b.is_active } : b
            ));
        }
    };

    const handleReorder = async (id: number, direction: 'up' | 'down') => {
        const index = banners.findIndex(b => b.id === id);
        if (index === -1) return;

        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= banners.length) return;

        const newBanners = [...banners];
        [newBanners[index], newBanners[newIndex]] = [newBanners[newIndex], newBanners[index]];

        const order = newBanners.map((b, i) => ({ id: b.id, display_order: i }));
        setBanners(newBanners);

        await bannersApi.reorder(order);
    };

    return (
        <AdminLayout title="Banner Management" subtitle="Manage hero banners for the homepage">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                        <Image className="w-6 h-6 text-purple-600" />
                    </div>
                    <span className="text-gray-600">{banners.length} banners</span>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:opacity-90 transition-opacity"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Add Banner
                </button>
            </div>

            {/* Banners List */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                    </div>
                ) : banners.length === 0 ? (
                    <div className="text-center py-20">
                        <Image className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No banners yet</h3>
                        <p className="text-gray-500 mb-4">Create your first banner to display on the homepage</p>
                        <button
                            onClick={() => openModal()}
                            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Add Banner
                        </button>
                    </div>
                ) : (
                    <div className="divide-y">
                        {banners.map((banner, index) => (
                            <motion.div
                                key={banner.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 hover:bg-gray-50"
                            >
                                {/* Banner Image */}
                                <div className="w-full sm:w-48 h-28 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                    <img
                                        src={banner.image}
                                        alt={banner.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                {/* Banner Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-semibold text-gray-900 truncate">{banner.title}</h3>
                                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${banner.is_active
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            {banner.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    {banner.subtitle && (
                                        <p className="text-sm text-gray-600 truncate">{banner.subtitle}</p>
                                    )}
                                    <p className="text-xs text-gray-400 mt-1">
                                        Button: {banner.button_text} → {banner.button_link}
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {/* Reorder buttons */}
                                    <div className="flex flex-col gap-1">
                                        <button
                                            onClick={() => handleReorder(banner.id, 'up')}
                                            disabled={index === 0}
                                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                        >
                                            <ChevronUp className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleReorder(banner.id, 'down')}
                                            disabled={index === banners.length - 1}
                                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                        >
                                            <ChevronDown className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => handleToggleStatus(banner.id)}
                                        className={`p-2 rounded-lg ${banner.is_active
                                            ? 'text-green-600 hover:bg-green-50'
                                            : 'text-gray-400 hover:bg-gray-100'
                                            }`}
                                        title={banner.is_active ? 'Deactivate' : 'Activate'}
                                    >
                                        {banner.is_active ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                                    </button>

                                    <button
                                        onClick={() => openModal(banner)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                    >
                                        <Edit2 className="w-5 h-5" />
                                    </button>

                                    <button
                                        onClick={() => handleDelete(banner.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                        onClick={closeModal}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-semibold">
                                    {editingBanner ? 'Edit Banner' : 'Add New Banner'}
                                </h3>
                                <button onClick={closeModal} className="p-1 hover:bg-gray-100 rounded">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Image Upload */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Banner Image *
                                    </label>
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-purple-400 transition-colors"
                                    >
                                        {previewImage ? (
                                            <img
                                                src={previewImage}
                                                alt="Preview"
                                                className="w-full h-40 object-cover rounded-lg"
                                            />
                                        ) : (
                                            <div className="py-8">
                                                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                                                <p className="text-sm text-gray-500">Click to upload image</p>
                                                <p className="text-xs text-gray-400">Recommended: 1920x600px</p>
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                    />
                                </div>

                                {/* Title */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Title *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        required
                                    />
                                </div>

                                {/* Subtitle */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Subtitle
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.subtitle}
                                        onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={2}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                    />
                                </div>

                                {/* Button Text & Link */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Button Text
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.button_text}
                                            onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Button Link
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.button_link}
                                            onChange={(e) => setFormData({ ...formData, button_link: e.target.value })}
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        />
                                    </div>
                                </div>

                                {/* Active Toggle */}
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="is_active"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                    />
                                    <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                                        Active (show on homepage)
                                    </label>
                                </div>

                                {/* Submit Button */}
                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                                    >
                                        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                        {editingBanner ? 'Update Banner' : 'Create Banner'}
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
