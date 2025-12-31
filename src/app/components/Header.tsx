import { useState } from 'react';
import { motion } from 'motion/react';
import { ShoppingCart, Menu, X, Heart, User, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { SearchBox } from './SearchBox';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { itemsCount } = useCart();
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex-shrink-0"
            >
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                LUXE
              </h1>
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {[
              { name: 'Shop', path: '/shop' },
              { name: 'About', path: '/about' },
              { name: 'Contact', path: '/contact' },
              { name: 'FAQ', path: '/faq' },
            ].map((item, index) => (
              <Link key={item.name} to={item.path}>
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-gray-700 hover:text-purple-600 transition-colors duration-200 relative group"
                >
                  {item.name}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-purple-600 group-hover:w-full transition-all duration-300"></span>
                </motion.div>
              </Link>
            ))}
          </nav>

          {/* Right Icons */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="hidden sm:block">
              <SearchBox />
            </div>

            <Link to="/wishlist" className="hidden sm:block">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Wishlist"
              >
                <Heart className="w-5 h-5 text-gray-700" />
              </motion.button>
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center space-x-1 sm:space-x-2">
                {user?.role === 'admin' && (
                  <Link to="/admin" className="hidden sm:block">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      className="px-3 py-1.5 bg-purple-100 text-purple-600 rounded-lg text-sm hover:bg-purple-200 transition-colors"
                    >
                      Admin
                    </motion.button>
                  </Link>
                )}
                <Link to="/profile">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors flex items-center space-x-2"
                  >
                    <User className="w-5 h-5 text-purple-600" />
                  </motion.button>
                </Link>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="hidden sm:block p-2 hover:bg-gray-100 rounded-full transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5 text-gray-700" />
                </motion.button>
              </div>
            ) : (
              <Link to="/login">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <User className="w-5 h-5 text-gray-700" />
                </motion.button>
              </Link>
            )}

            <Link to="/cart">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ShoppingCart className="w-5 h-5 text-gray-700" />
                {itemsCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                  >
                    {itemsCount}
                  </motion.span>
                )}
              </motion.button>
            </Link>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="w-5 h-5 text-gray-700" />
              ) : (
                <Menu className="w-5 h-5 text-gray-700" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden border-t border-gray-200 bg-white"
        >
          <nav className="px-4 py-4 space-y-3">
            {/* Search on mobile */}
            <div className="pb-3 border-b border-gray-100">
              <SearchBox />
            </div>

            {[
              { name: 'Shop', path: '/shop' },
              { name: 'Wishlist', path: '/wishlist' },
              { name: 'About', path: '/about' },
              { name: 'Contact', path: '/contact' },
              { name: 'FAQ', path: '/faq' },
            ].map((item) => (
              <Link key={item.name} to={item.path} onClick={() => setIsMenuOpen(false)}>
                <div className="block py-2 text-gray-700 hover:text-purple-600 transition-colors">
                  {item.name}
                </div>
              </Link>
            ))}
            {isAuthenticated ? (
              <>
                {user?.role === 'admin' && (
                  <Link to="/admin" onClick={() => setIsMenuOpen(false)}>
                    <div className="block py-2 text-purple-600 font-medium">
                      Admin Panel
                    </div>
                  </Link>
                )}
                <button
                  onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                  className="block py-2 text-gray-700 hover:text-purple-600 transition-colors w-full text-left"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                <div className="block py-2 text-gray-700 hover:text-purple-600 transition-colors">
                  Login
                </div>
              </Link>
            )}
          </nav>
        </motion.div>
      )}
    </header>
  );
}