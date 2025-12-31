import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
    Package, FolderTree, ShoppingBag, Users,
    DollarSign, Loader2, ArrowUp, ArrowDown, Star, Tag, LifeBuoy
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { productsApi, categoriesApi } from '../../services/api';

interface Stats {
    totalProducts: number;
    totalCategories: number;
    totalOrders: number;
    totalRevenue: number;
    totalCustomers: number;
    pendingReviews: number;
    openTickets: number;
}

export function AdminDashboard() {
    const navigate = useNavigate();
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const [stats, setStats] = useState<Stats>({
        totalProducts: 0,
        totalCategories: 0,
        totalOrders: 0,
        totalRevenue: 0,
        totalCustomers: 0,
        pendingReviews: 0,
        openTickets: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading) {
            if (!isAuthenticated || user?.role !== 'admin') {
                navigate('/login');
            }
        }
    }, [isAuthenticated, authLoading, user, navigate]);

    useEffect(() => {
        const loadStats = async () => {
            if (user?.role !== 'admin') return;

            setLoading(true);

            try {
                const token = localStorage.getItem('auth_token');

                // Fetch products, categories, and admin stats in parallel
                const [productsRes, categoriesRes, statsResponse] = await Promise.all([
                    productsApi.getAll({ per_page: 1 }),
                    categoriesApi.getAll(),
                    fetch('http://127.0.0.1:8000/api/v1/admin/dashboard/stats', {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/json',
                        },
                    }),
                ]);

                let orderStats = { total_orders: 0, total_revenue: 0 };
                if (statsResponse.ok) {
                    const statsData = await statsResponse.json();
                    if (statsData.success && statsData.data) {
                        orderStats = statsData.data;
                    }
                }

                setStats({
                    totalProducts: productsRes.data?.total || 0,
                    totalCategories: categoriesRes.data?.length || 0,
                    totalOrders: orderStats.total_orders || 0,
                    totalRevenue: parseFloat(String(orderStats.total_revenue)) || 0,
                    totalCustomers: 0,
                    pendingReviews: 0,
                    openTickets: 0,
                });
            } catch (error) {
                console.error('Error loading stats:', error);
            }

            setLoading(false);
        };

        if (user?.role === 'admin') {
            loadStats();
        }
    }, [user]);

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
            </div>
        );
    }

    const statCards = [
        {
            title: 'Total Products',
            value: stats.totalProducts,
            icon: Package,
            color: 'from-purple-500 to-purple-600',
            trend: '+12%',
            trendUp: true,
            link: '/admin/products',
        },
        {
            title: 'Categories',
            value: stats.totalCategories,
            icon: FolderTree,
            color: 'from-blue-500 to-blue-600',
            trend: '+3%',
            trendUp: true,
            link: '/admin/categories',
        },
        {
            title: 'Total Orders',
            value: stats.totalOrders,
            icon: ShoppingBag,
            color: 'from-green-500 to-green-600',
            trend: '+8%',
            trendUp: true,
            link: '/admin/orders',
        },
        {
            title: 'Revenue',
            value: `₹${stats.totalRevenue.toLocaleString()}`,
            icon: DollarSign,
            color: 'from-orange-500 to-orange-600',
            trend: '+15%',
            trendUp: true,
            link: '/admin/orders',
        },
    ];

    const quickActions = [
        { title: 'Manage Products', icon: Package, href: '/admin/products', color: 'text-purple-600', description: 'Add, edit, or delete products' },
        { title: 'Manage Categories', icon: FolderTree, href: '/admin/categories', color: 'text-blue-600', description: 'Organize product categories' },
        { title: 'View Orders', icon: ShoppingBag, href: '/admin/orders', color: 'text-green-600', description: 'Track and manage orders' },
        { title: 'Manage Reviews', icon: Star, href: '/admin/reviews', color: 'text-yellow-600', description: 'Moderate customer reviews' },
        { title: 'Manage Coupons', icon: Tag, href: '/admin/coupons', color: 'text-pink-600', description: 'Create discount coupons' },
        { title: 'Support Tickets', icon: LifeBuoy, href: '/admin/support', color: 'text-red-600', description: 'Handle customer queries' },
    ];

    return (
        <AdminLayout title="Dashboard" subtitle="Overview of your store">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statCards.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <Link key={stat.title} to={stat.link}>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`p-3 rounded-lg bg-gradient-to-r ${stat.color}`}>
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>
                                    <div className={`flex items-center text-sm ${stat.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                                        {stat.trendUp ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                                        {stat.trend}
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-800">{stat.value}</h3>
                                <p className="text-gray-500 text-sm">{stat.title}</p>
                            </motion.div>
                        </Link>
                    );
                })}
            </div>

            {/* Quick Actions */}
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quickActions.map((action, index) => {
                    const Icon = action.icon;
                    return (
                        <Link key={action.title} to={action.href}>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 + index * 0.1 }}
                                whileHover={{ scale: 1.02 }}
                                className="bg-white rounded-xl shadow-sm p-6 cursor-pointer hover:shadow-md transition-all"
                            >
                                <Icon className={`w-10 h-10 ${action.color} mb-4`} />
                                <h3 className="text-lg font-semibold mb-2">{action.title}</h3>
                                <p className="text-gray-600 text-sm">{action.description}</p>
                            </motion.div>
                        </Link>
                    );
                })}
            </div>
        </AdminLayout>
    );
}
