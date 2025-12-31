import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
    LayoutDashboard, Package, FolderTree, ShoppingBag, Users,
    Star, Tag, HelpCircle, Layers, LifeBuoy, Settings, LogOut, Menu, X, Image
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface AdminLayoutProps {
    children: ReactNode;
    title: string;
    subtitle?: string;
}

export function AdminLayout({ children, title, subtitle }: AdminLayoutProps) {
    const location = useLocation();
    const { user, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const menuItems = [
        { title: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
        { title: 'Banners', icon: Image, href: '/admin/banners' },
        { title: 'Products', icon: Package, href: '/admin/products' },
        { title: 'Categories', icon: FolderTree, href: '/admin/categories' },
        { title: 'Orders', icon: ShoppingBag, href: '/admin/orders' },
        { title: 'Reviews', icon: Star, href: '/admin/reviews' },
        { title: 'Coupons', icon: Tag, href: '/admin/coupons' },
        { title: 'Collections', icon: Layers, href: '/admin/collections' },
        { title: 'FAQs', icon: HelpCircle, href: '/admin/faqs' },
        { title: 'Support', icon: LifeBuoy, href: '/admin/support' },
        { title: 'Users', icon: Users, href: '/admin/users' },
        { title: 'Settings', icon: Settings, href: '/admin/settings' },
    ];

    const isActive = (href: string) => {
        if (href === '/admin') {
            return location.pathname === '/admin';
        }
        return location.pathname.startsWith(href);
    };

    const handleNavClick = () => {
        // Close sidebar on mobile after navigation
        setSidebarOpen(false);
    };

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white shadow-sm px-4 py-3 flex items-center justify-between">
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <Menu className="w-6 h-6 text-gray-700" />
                </button>
                <h1 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Admin Panel
                </h1>
                <div className="w-10" /> {/* Spacer for centering */}
            </div>

            {/* Mobile Overlay */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden fixed inset-0 bg-black/50 z-40"
                    />
                )}
            </AnimatePresence>

            <div className="flex">
                {/* Sidebar */}
                <aside
                    className={`
                        fixed lg:fixed top-0 left-0 z-50 
                        w-64 bg-white shadow-lg min-h-screen overflow-y-auto
                        transform transition-transform duration-300 ease-in-out
                        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                        lg:translate-x-0
                    `}
                >
                    <div className="p-6 border-b flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                                Admin Panel
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">Welcome, {user?.name}</p>
                        </div>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    <nav className="p-4 space-y-1">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.href);
                            return (
                                <Link
                                    key={item.title}
                                    to={item.href}
                                    onClick={handleNavClick}
                                    className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-colors ${active
                                        ? 'bg-purple-50 text-purple-600'
                                        : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="text-sm font-medium">{item.title}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white">
                        <Link
                            to="/"
                            onClick={handleNavClick}
                            className="flex items-center justify-center px-4 py-2 text-gray-600 hover:text-purple-600 mb-2"
                        >
                            ← Back to Store
                        </Link>
                        <button
                            onClick={() => logout()}
                            className="flex items-center justify-center w-full px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Logout
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <div className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8 pt-20 lg:pt-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 lg:mb-8"
                    >
                        <h2 className="text-2xl lg:text-3xl font-bold text-gray-800">{title}</h2>
                        {subtitle && <p className="text-gray-600 text-sm lg:text-base">{subtitle}</p>}
                    </motion.div>

                    {children}
                </div>
            </div>
        </div>
    );
}
