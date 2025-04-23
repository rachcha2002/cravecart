import React, { useState, useMemo } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../hooks/useCart";
import { motion, AnimatePresence } from "framer-motion";
import { useNotifications } from "../contexts/NotificationContext";
import SessionTimer from "./SessionTimer";
import CartModal from "./CartModal";
import NotificationBell from "./notification/NotificationBell";
import OrderUpdateListener from "./order/OrderUpdateListener";
import { Toaster } from 'react-hot-toast';

const Layout: React.FC = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { items } = useCart();
  const { unreadCount } = useNotifications();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const location = useLocation();

  const navItems = useMemo(() => {
    const items = [
      { label: "Home", path: "/" },
      { label: "About", path: "/about" },
      { label: "Contact", path: "/contact" },
    ];
    
    // Add "My Orders" only for authenticated users
    if (user) {
      items.push({ label: "My Orders", path: "/orders" });
    }
    
    return items;
  }, [user]);

  const isActive = (path: string) => location.pathname === path;

  return (
    <div
      className={`min-h-screen ${
        isDarkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"
      }`}
    >
      {/* Include the OrderUpdateListener component for global order updates */}
      {user && <OrderUpdateListener />}
      
      {/* Navigation */}
      <nav
        className={`fixed w-full z-50 ${
          isDarkMode ? "bg-gray-800" : "bg-white"
        } shadow-lg`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0 flex items-center">
                <img src="/logo.svg" alt="Foodie" className="h-14 w-auto" />
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:ml-6 md:flex md:space-x-4">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                      isActive(item.path)
                        ? isDarkMode
                          ? "bg-gray-900 text-white"
                          : "bg-gray-100 text-gray-900"
                        : isDarkMode
                        ? "text-gray-300 hover:bg-gray-700"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Right side buttons */}
            <div className="flex items-center">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-full ${
                  isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                }`}
              >
                {isDarkMode ? "🌞" : "🌙"}
              </button>
              
              {/* Notification Bell - only show when user is logged in */}
              {user && (
                <div className="hidden md:block ml-4">
                  <NotificationBell />
                </div>
              )}
              
              {/* Cart */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="ml-4 relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Shopping cart"
              >
                🛒
                {items.length > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                    {items.length}
                  </span>
                )}
              </button>

              {/* Auth Buttons */}
              <div className="hidden md:flex md:items-center md:ml-4">
                {user ? (
                  <>
                    <Link
                      to="/profile"
                      className={`px-4 py-2 rounded-md text-sm font-medium ${
                        isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                      }`}
                    >
                      Profile
                    </Link>
                    <button
                      onClick={logout}
                      className={`ml-2 px-4 py-2 rounded-md text-sm font-medium ${
                        isDarkMode
                          ? "bg-red-600 hover:bg-red-700"
                          : "bg-red-500 hover:bg-red-600"
                      } text-white`}
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className={`px-4 py-2 rounded-md text-sm font-medium ${
                        isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                      }`}
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className={`ml-2 px-4 py-2 rounded-md text-sm font-medium ${
                        isDarkMode
                          ? "bg-[#f29f05] hover:bg-[#e69504]"
                          : "bg-[#f29f05] hover:bg-[#e69504]"
                      } text-white`}
                    >
                      Register
                    </Link>
                  </>
                )}
              </div>

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden ml-4 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 relative"
              >
                {isMobileMenuOpen ? "✕" : "☰"}
                {user && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full md:hidden">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden"
            >
              <div
                className={`px-2 pt-2 pb-3 space-y-1 ${
                  isDarkMode ? "bg-gray-800" : "bg-white"
                }`}
              >
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      isActive(item.path)
                        ? isDarkMode
                          ? "bg-gray-900 text-white"
                          : "bg-gray-100 text-gray-900"
                        : isDarkMode
                        ? "text-gray-300 hover:bg-gray-700"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
                {!user ? (
                  <>
                    <Link
                      to="/login"
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Register
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/profile"
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      to="/orders"
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      My Orders
                    </Link>
                    <div className="px-3 py-2">
                      <div className="flex items-center justify-between">
                        <span className="text-base font-medium text-gray-600 dark:text-gray-300">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      <div className="mt-2">
                        <NotificationBell />
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        logout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      Logout
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Main Content */}
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </div>
      </main>

      {/* Modals and Overlays */}
      <CartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      
      {/* Toast Container */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 5000,
          style: {
            background: isDarkMode ? '#374151' : '#ffffff',
            color: isDarkMode ? '#ffffff' : '#000000',
          },
        }}
      />
    </div>
  );
};

export default Layout;
