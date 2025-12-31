import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
    Settings as SettingsIcon, CreditCard, Truck, Mail, Globe,
    Loader2, Save, Eye, EyeOff, CheckCircle, AlertCircle, Gift
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { AdminLayout } from '../../components/admin/AdminLayout';

interface SettingsState {
    // Razorpay
    razorpay_key_id: string;
    razorpay_key_secret: string;
    razorpay_enabled: boolean;
    // Shiprocket
    shiprocket_email: string;
    shiprocket_password: string;
    shiprocket_enabled: boolean;
    shiprocket_pickup_pincode: string;
    // Shipping & Tax
    shipping_cost: string;
    free_shipping_threshold: string;
    tax_rate: string;
    tax_name: string;
    tax_enabled: boolean;
    // General
    store_name: string;
    store_email: string;
    store_phone: string;
    store_address: string;
    // Promo Banner
    promo_enabled: boolean;
    promo_badge: string;
    promo_title: string;
    promo_description: string;
    promo_button_text: string;
    promo_button_link: string;
}

export function AdminSettings() {
    const navigate = useNavigate();
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
    const [activeTab, setActiveTab] = useState('shipping');

    const [settings, setSettings] = useState<SettingsState>({
        razorpay_key_id: '',
        razorpay_key_secret: '',
        razorpay_enabled: false,
        shiprocket_email: '',
        shiprocket_password: '',
        shiprocket_enabled: false,
        shiprocket_pickup_pincode: '',
        shipping_cost: '99',
        free_shipping_threshold: '999',
        tax_rate: '18',
        tax_name: 'GST',
        tax_enabled: true,
        store_name: 'E-Commerce Store',
        store_email: '',
        store_phone: '',
        store_address: '',
        // Promo Banner
        promo_enabled: true,
        promo_badge: 'Limited Time Offer',
        promo_title: 'Up to 50% Off',
        promo_description: "Don't miss out on our biggest sale of the season. Premium products at unbeatable prices.",
        promo_button_text: 'Shop Sale Now',
        promo_button_link: '/shop',
    });

    useEffect(() => {
        if (!authLoading) {
            if (!isAuthenticated || user?.role !== 'admin') {
                navigate('/login');
            }
        }
    }, [isAuthenticated, authLoading, user, navigate]);

    // Load saved promo settings from localStorage on mount
    useEffect(() => {
        const savedPromoSettings = localStorage.getItem('promo_settings');
        if (savedPromoSettings) {
            try {
                const parsed = JSON.parse(savedPromoSettings);
                setSettings(prev => ({
                    ...prev,
                    promo_enabled: parsed.promo_enabled ?? prev.promo_enabled,
                    promo_badge: parsed.promo_badge ?? prev.promo_badge,
                    promo_title: parsed.promo_title ?? prev.promo_title,
                    promo_description: parsed.promo_description ?? prev.promo_description,
                    promo_button_text: parsed.promo_button_text ?? prev.promo_button_text,
                    promo_button_link: parsed.promo_button_link ?? prev.promo_button_link,
                }));
            } catch (e) {
                // Use defaults if parsing fails
            }
        }
    }, []);

    const handleSave = async () => {
        setSaving(true);
        // Save promo settings to localStorage for the homepage to read
        const promoData = {
            promo_enabled: settings.promo_enabled,
            promo_badge: settings.promo_badge,
            promo_title: settings.promo_title,
            promo_description: settings.promo_description,
            promo_button_text: settings.promo_button_text,
            promo_button_link: settings.promo_button_link,
        };
        localStorage.setItem('promo_settings', JSON.stringify(promoData));

        await new Promise(resolve => setTimeout(resolve, 500));
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const toggleSecret = (key: string) => {
        setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const tabs = [
        { id: 'shipping', label: 'Shipping', icon: Truck },
        { id: 'promo', label: 'Promo Banner', icon: Gift },
        { id: 'general', label: 'General', icon: Globe },
    ];

    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
            </div>
        );
    }

    return (
        <AdminLayout title="Settings" subtitle="Configure your store settings">
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
                {/* Tabs - Horizontal scroll on mobile */}
                <div className="w-full lg:w-64 bg-white rounded-xl shadow-sm p-4 flex-shrink-0">
                    <nav className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center px-4 py-3 rounded-lg transition-colors whitespace-nowrap ${activeTab === tab.id
                                        ? 'bg-purple-50 text-purple-600'
                                        : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    <Icon className="w-5 h-5 mr-3" />
                                    <span className="font-medium text-sm lg:text-base">{tab.label}</span>
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Content */}
                <div className="flex-1 bg-white rounded-xl shadow-sm p-4 sm:p-6">
                    {/* Payment Gateway Settings */}
                    {activeTab === 'payment' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <h3 className="text-lg font-semibold text-gray-900 mb-6">Razorpay Configuration</h3>

                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div>
                                        <h4 className="font-medium text-gray-900">Enable Razorpay</h4>
                                        <p className="text-sm text-gray-500">Accept payments via Razorpay</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={settings.razorpay_enabled}
                                            onChange={(e) => setSettings({ ...settings, razorpay_enabled: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                    </label>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Razorpay Key ID
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.razorpay_key_id}
                                        onChange={(e) => setSettings({ ...settings, razorpay_key_id: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                        placeholder="rzp_test_..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Razorpay Key Secret
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showSecrets.razorpay ? 'text' : 'password'}
                                            value={settings.razorpay_key_secret}
                                            onChange={(e) => setSettings({ ...settings, razorpay_key_secret: e.target.value })}
                                            className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                            placeholder="••••••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => toggleSecret('razorpay')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showSecrets.razorpay ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <div className="flex items-start">
                                        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
                                        <div>
                                            <h4 className="font-medium text-blue-900">Test Mode</h4>
                                            <p className="text-sm text-blue-700">
                                                Use test keys for development. Get your keys from{' '}
                                                <a href="https://dashboard.razorpay.com" target="_blank" className="underline">
                                                    Razorpay Dashboard
                                                </a>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Shipping Settings */}
                    {activeTab === 'shipping' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <h3 className="text-lg font-semibold text-gray-900 mb-6">Shiprocket Configuration</h3>

                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div>
                                        <h4 className="font-medium text-gray-900">Enable Shiprocket</h4>
                                        <p className="text-sm text-gray-500">Automated shipping with Shiprocket</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={settings.shiprocket_enabled}
                                            onChange={(e) => setSettings({ ...settings, shiprocket_enabled: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                    </label>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Shiprocket Email
                                    </label>
                                    <input
                                        type="email"
                                        value={settings.shiprocket_email}
                                        onChange={(e) => setSettings({ ...settings, shiprocket_email: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                        placeholder="your@email.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Shiprocket Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showSecrets.shiprocket ? 'text' : 'password'}
                                            value={settings.shiprocket_password}
                                            onChange={(e) => setSettings({ ...settings, shiprocket_password: e.target.value })}
                                            className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                            placeholder="••••••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => toggleSecret('shiprocket')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showSecrets.shiprocket ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Pickup Pincode
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.shiprocket_pickup_pincode}
                                        onChange={(e) => setSettings({ ...settings, shiprocket_pickup_pincode: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                        placeholder="110001"
                                        maxLength={6}
                                    />
                                    <p className="text-sm text-gray-500 mt-1">Your warehouse/pickup location pincode</p>
                                </div>
                            </div>

                            {/* Shipping Costs Section */}
                            <div className="mt-8 pt-6 border-t">
                                <h3 className="text-lg font-semibold text-gray-900 mb-6">Shipping Costs</h3>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Flat Shipping Rate (₹)
                                            </label>
                                            <input
                                                type="number"
                                                value={settings.shipping_cost}
                                                onChange={(e) => setSettings({ ...settings, shipping_cost: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                                placeholder="99"
                                                min="0"
                                            />
                                            <p className="text-sm text-gray-500 mt-1">Default shipping cost for orders</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Free Shipping Above (₹)
                                            </label>
                                            <input
                                                type="number"
                                                value={settings.free_shipping_threshold}
                                                onChange={(e) => setSettings({ ...settings, free_shipping_threshold: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                                placeholder="999"
                                                min="0"
                                            />
                                            <p className="text-sm text-gray-500 mt-1">Orders above this get free shipping</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Tax Settings Section */}
                            <div className="mt-8 pt-6 border-t">
                                <h3 className="text-lg font-semibold text-gray-900 mb-6">Tax Configuration</h3>

                                <div className="space-y-6">
                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                        <div>
                                            <h4 className="font-medium text-gray-900">Enable Tax</h4>
                                            <p className="text-sm text-gray-500">Apply tax to all orders</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={settings.tax_enabled}
                                                onChange={(e) => setSettings({ ...settings, tax_enabled: e.target.checked })}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                        </label>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Tax Name
                                            </label>
                                            <input
                                                type="text"
                                                value={settings.tax_name}
                                                onChange={(e) => setSettings({ ...settings, tax_name: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                                placeholder="GST"
                                            />
                                            <p className="text-sm text-gray-500 mt-1">e.g., GST, VAT, Sales Tax</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Tax Rate (%)
                                            </label>
                                            <input
                                                type="number"
                                                value={settings.tax_rate}
                                                onChange={(e) => setSettings({ ...settings, tax_rate: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                                placeholder="18"
                                                min="0"
                                                max="100"
                                                step="0.01"
                                            />
                                            <p className="text-sm text-gray-500 mt-1">Percentage to apply on subtotal</p>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                        <h4 className="font-medium text-green-900 mb-2">Preview</h4>
                                        <p className="text-sm text-green-700">
                                            Order of ₹1000 will have:
                                            <br />• Shipping: {parseFloat(settings.free_shipping_threshold) <= 1000 ? '₹0 (Free)' : `₹${settings.shipping_cost}`}
                                            <br />• {settings.tax_name} ({settings.tax_rate}%): ₹{(1000 * parseFloat(settings.tax_rate || '0') / 100).toFixed(2)}
                                            <br />• <strong>Total: ₹{(1000 + (parseFloat(settings.free_shipping_threshold) <= 1000 ? 0 : parseFloat(settings.shipping_cost || '0')) + (1000 * parseFloat(settings.tax_rate || '0') / 100)).toFixed(2)}</strong>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* General Settings */}
                    {activeTab === 'general' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <h3 className="text-lg font-semibold text-gray-900 mb-6">Store Information</h3>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Store Name
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.store_name}
                                        onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                        placeholder="My Store"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Store Email
                                    </label>
                                    <input
                                        type="email"
                                        value={settings.store_email}
                                        onChange={(e) => setSettings({ ...settings, store_email: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                        placeholder="contact@store.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Store Phone
                                    </label>
                                    <input
                                        type="tel"
                                        value={settings.store_phone}
                                        onChange={(e) => setSettings({ ...settings, store_phone: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                        placeholder="+91 9876543210"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Store Address
                                    </label>
                                    <textarea
                                        value={settings.store_address}
                                        onChange={(e) => setSettings({ ...settings, store_address: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                        rows={3}
                                        placeholder="123 Main Street, City, State, Country"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Email Settings */}
                    {activeTab === 'email' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <h3 className="text-lg font-semibold text-gray-900 mb-6">Email Configuration</h3>

                            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                <div className="flex items-start">
                                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
                                    <div>
                                        <h4 className="font-medium text-yellow-900">Server Configuration Required</h4>
                                        <p className="text-sm text-yellow-700">
                                            Email settings are configured in the Laravel .env file. Update MAIL_* variables
                                            to configure SMTP or use services like Mailgun, SendGrid, or SES.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                                <h4 className="font-medium text-gray-900 mb-3">Required .env Variables</h4>
                                <pre className="text-sm text-gray-600 font-mono bg-gray-100 p-3 rounded-lg overflow-x-auto">
                                    {`MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your@email.com
MAIL_PASSWORD=your_app_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@store.com
MAIL_FROM_NAME="Your Store"`}
                                </pre>
                            </div>
                        </motion.div>
                    )}

                    {/* Promo Banner Settings */}
                    {activeTab === 'promo' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <h3 className="text-lg font-semibold text-gray-900 mb-6">Promo Banner Settings</h3>
                            <p className="text-sm text-gray-500 mb-6">Configure the promotional banner displayed on the homepage.</p>

                            <div className="space-y-6">
                                {/* Enable Promo */}
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div>
                                        <h4 className="font-medium text-gray-900">Enable Promo Banner</h4>
                                        <p className="text-sm text-gray-500">Show promotional banner on homepage</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={settings.promo_enabled}
                                            onChange={(e) => setSettings({ ...settings, promo_enabled: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                    </label>
                                </div>

                                {/* Badge Text */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Badge Text
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.promo_badge}
                                        onChange={(e) => setSettings({ ...settings, promo_badge: e.target.value })}
                                        placeholder="e.g. Limited Time Offer"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                </div>

                                {/* Title */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Title
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.promo_title}
                                        onChange={(e) => setSettings({ ...settings, promo_title: e.target.value })}
                                        placeholder="e.g. Up to 50% Off"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        value={settings.promo_description}
                                        onChange={(e) => setSettings({ ...settings, promo_description: e.target.value })}
                                        placeholder="Enter promotional description..."
                                        rows={3}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                </div>

                                {/* Button Text & Link */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Button Text
                                        </label>
                                        <input
                                            type="text"
                                            value={settings.promo_button_text}
                                            onChange={(e) => setSettings({ ...settings, promo_button_text: e.target.value })}
                                            placeholder="e.g. Shop Sale Now"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Button Link
                                        </label>
                                        <input
                                            type="text"
                                            value={settings.promo_button_link}
                                            onChange={(e) => setSettings({ ...settings, promo_button_link: e.target.value })}
                                            placeholder="e.g. /shop"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                {/* Preview */}
                                <div className="mt-6 pt-6 border-t">
                                    <h4 className="font-medium text-gray-900 mb-4">Preview</h4>
                                    <div className="bg-gradient-to-r from-purple-900 via-blue-900 to-pink-900 rounded-xl p-8 text-center text-white">
                                        <span className="inline-block bg-white/20 backdrop-blur-sm px-4 py-1 rounded-full text-sm mb-4">
                                            {settings.promo_badge || 'Badge Text'}
                                        </span>
                                        <h3 className="text-2xl sm:text-3xl font-bold mb-2">
                                            {settings.promo_title || 'Promo Title'}
                                        </h3>
                                        <p className="text-white/80 text-sm max-w-md mx-auto mb-4">
                                            {settings.promo_description || 'Promo description goes here...'}
                                        </p>
                                        <button className="bg-white text-purple-900 px-6 py-2 rounded-full text-sm font-medium">
                                            {settings.promo_button_text || 'Button Text'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Save Button */}
                    <div className="mt-8 pt-6 border-t flex items-center justify-between">
                        {saved && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center text-green-600"
                            >
                                <CheckCircle className="w-5 h-5 mr-2" />
                                Settings saved successfully!
                            </motion.div>
                        )}
                        <div className="flex-1"></div>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                        >
                            {saving ? (
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            ) : (
                                <Save className="w-5 h-5 mr-2" />
                            )}
                            Save Settings
                        </button>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
