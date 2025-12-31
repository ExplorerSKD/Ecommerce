import { useState } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight } from 'lucide-react';

export function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, register, isAuthenticated, user } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    // Check if redirected from admin
    const fromAdmin = location.state?.from?.pathname?.startsWith('/admin');
    const title = fromAdmin ? 'Admin Login' : (isLogin ? 'Welcome Back' : 'Create Account');
    const subtitle = fromAdmin
        ? 'Please sign in to access the dashboard'
        : (isLogin ? 'Sign in to access your account' : 'Join us for exclusive offers');

    // Redirect if already logged in
    if (isAuthenticated) {
        if (location.state?.from) {
            navigate(location.state.from, { replace: true });
        } else if (user?.role === 'admin') {
            navigate('/admin', { replace: true });
        } else {
            navigate('/profile', { replace: true });
        }
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            if (isLogin) {
                const result = await login(formData.email, formData.password);
                if (result.success) {
                    const from = location.state?.from?.pathname || '/profile';
                    // If user is admin and trying to go to generic profile, send to admin dashboard
                    if (result.data?.user?.role === 'admin' && from === '/profile') {
                        navigate('/admin');
                    } else {
                        navigate(from, { replace: true });
                    }
                } else {
                    setError(result.message || 'Login failed');
                }
            } else {
                if (formData.password !== formData.password_confirmation) {
                    setError('Passwords do not match');
                    setIsLoading(false);
                    return;
                }
                const result = await register(formData);
                if (result.success) {
                    navigate('/profile');
                } else {
                    setError(result.message || 'Registration failed');
                }
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-16 flex items-center justify-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md mx-4"
            >
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            {title}
                        </h1>
                        <p className="text-gray-600">
                            {subtitle}
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm"
                        >
                            {error}
                        </motion.div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {!isLogin && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="John Doe"
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                                        required={!isLogin}
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="john@example.com"
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                                    required
                                    minLength={8}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {!isLogin && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password_confirmation}
                                        onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                                        placeholder="••••••••"
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                                        required={!isLogin}
                                        minLength={8}
                                    />
                                </div>
                            </div>
                        )}

                        {isLogin && (
                            <div className="flex items-center justify-between text-sm">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input type="checkbox" className="w-4 h-4 text-purple-600 rounded" />
                                    <span className="text-gray-600">Remember me</span>
                                </label>
                                <Link to="/forgot-password" className="text-purple-600 hover:text-purple-700">
                                    Forgot password?
                                </Link>
                            </div>
                        )}

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-medium flex items-center justify-center space-x-2 disabled:opacity-50"
                        >
                            <span>{isLoading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}</span>
                            {!isLoading && <ArrowRight className="w-5 h-5" />}
                        </motion.button>
                    </form>

                    {/* Toggle */}
                    {!fromAdmin && (
                        <div className="mt-6 text-center">
                            <p className="text-gray-600">
                                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                                <button
                                    onClick={() => {
                                        setIsLogin(!isLogin);
                                        setError('');
                                    }}
                                    className="text-purple-600 hover:text-purple-700 font-medium"
                                >
                                    {isLogin ? 'Sign Up' : 'Sign In'}
                                </button>
                            </p>
                        </div>
                    )}

                    {/* Demo Credentials */}
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600 font-medium mb-2">Demo Credentials:</p>
                        <div className="text-sm text-gray-500 space-y-1">
                            <p><strong>Customer:</strong> customer@example.com / password123</p>
                            <p><strong>Admin:</strong> admin@example.com / password123</p>
                        </div>
                    </div>
                </div>

                {/* Back to Shop */}
                <div className="text-center mt-6">
                    <Link to="/shop" className="text-gray-600 hover:text-purple-600 text-sm">
                        ← Continue shopping
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
