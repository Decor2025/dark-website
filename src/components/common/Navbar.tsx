// src/components/Navbar.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import {
  ShoppingCart,
  User as UserIcon,
  X,
  LogOut,
  Settings,
} from 'lucide-react';
import { ref, onValue } from 'firebase/database';
import { database } from '../../config/firebase';
import { SiteSettings } from '../../types';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false); // for mobile sidebar
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [settings, setSettings] = useState<SiteSettings[]>([]);
  const { currentUser, loading: authLoading, logout } = useAuth();
  const { getItemCount } = useCart();
  const navigate = useNavigate();

  // Separate refs for button and dropdown to fix type error
  const userMenuButtonRef = useRef<HTMLButtonElement>(null);
  const userMenuDropdownRef = useRef<HTMLDivElement>(null);

  // Load siteSettings for store name
  useEffect(() => {
    const settingsRef = ref(database, 'siteSettings');
    const unsub = onValue(settingsRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        setSettings(Object.keys(data).map((key) => ({ id: key, ...data[key] })));
      }
    });
    return () => unsub();
  }, []);

  // Close profile dropdown when clicking outside button or dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userMenuButtonRef.current &&
        userMenuDropdownRef.current &&
        !userMenuButtonRef.current.contains(event.target as Node) &&
        !userMenuDropdownRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    }
    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  const getSetting = (key: string) => settings.find((s) => s.key === key)?.value || '';

  const storeName = getSetting('store_name') || 'Shop';
  const storeInitial = storeName.charAt(0).toUpperCase();

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setIsUserMenuOpen(false);
  };

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/catalogue', label: 'Catalogue' },
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' },
  ];

  // Sidebar links same as navLinks for now
  const sidebarLinks = navLinks;

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* MOBILE NAVBAR */}
        <div className="flex items-center justify-between h-14 md:hidden">

          {/* Left: 2-line Hamburger */}
          <button
            onClick={() => setIsMenuOpen((o) => !o)}
            aria-label="Toggle menu"
            className="flex flex-col justify-center space-y-1.5 px-2"
          >
            <span
              className={`block h-0.5 w-6 bg-gray-700 transition-transform origin-left ${
                isMenuOpen ? 'rotate-45 translate-y-1.5' : ''
              }`}
            />
            <span
              className={`block h-0.5 w-6 bg-gray-700 transition-transform origin-left ${
                isMenuOpen ? '-rotate-45 -translate-y-1.5' : ''
              }`}
            />
          </button>

          {/* Center: Logo */}
          <Link to="/" className="flex items-center justify-center flex-1">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              {!authLoading && (
                <span className="text-white font-bold text-lg">{storeInitial}</span>
              )}
            </div>
          </Link>

          {/* Right: Profile or Login */}
          <div>
            {!authLoading && currentUser ? (
              <button
                ref={userMenuButtonRef}
                onClick={() => setIsUserMenuOpen((o) => !o)}
                className="focus:outline-none"
                aria-label="User menu"
              >
                {currentUser.profileImage ? (
                  <img
                    src={currentUser.profileImage}
                    alt="Profile"
                    className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
                  />
                ) : (
                  <UserIcon className="w-8 h-8 text-gray-600 bg-gray-200 rounded-full p-1" />
                )}
              </button>
            ) : (
              <Link
                to="/login"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded-md text-sm font-semibold transition-transform transform hover:scale-105"
              >
                Login
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Sidebar (slide-in) */}
        <div
          className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 z-50
            ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <div className="flex justify-between items-center px-4 h-14 border-b border-gray-200">
            <div className="text-lg font-bold">{storeName}</div>
            <button
              onClick={() => setIsMenuOpen(false)}
              aria-label="Close menu"
              className="p-2"
            >
              <X className="w-6 h-6 text-gray-700" />
            </button>
          </div>
          <nav className="mt-4 flex flex-col space-y-2 px-4">
            {sidebarLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-gray-700 hover:text-blue-600 text-lg font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* DESKTOP NAVBAR (unchanged) */}
        <div className="hidden md:flex justify-between items-center h-16">

          {/* Logo + Store Name */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              {!authLoading && (
                <span className="text-white font-bold text-lg">{storeInitial}</span>
              )}
            </div>
            <span className="text-xl font-bold text-gray-900">{storeName}</span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Side: Cart + Auth Controls */}
          <div className="flex items-center space-x-4">
            {!authLoading && currentUser && (
              <Link
                to="/cart"
                className="relative p-2 text-gray-700 hover:text-blue-600 transition-colors"
              >
                <ShoppingCart className="w-6 h-6" />
                {getItemCount() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {getItemCount()}
                  </span>
                )}
              </Link>
            )}

            {/* User Dropdown */}
            {currentUser ? (
              <div className="relative">
                <button
                  ref={userMenuButtonRef}
                  onClick={() => setIsUserMenuOpen((o) => !o)}
                  className="flex items-center space-x-2 p-2 text-gray-700 hover:text-blue-600 transition-colors"
                  aria-label="User menu toggle"
                >
                  {currentUser.profileImage ? (
                    <img
                      src={currentUser.profileImage}
                      alt="Profile"
                      className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <UserIcon className="w-8 h-8 text-gray-600 bg-gray-200 rounded-full p-1" />
                  )}
                  <div className="hidden md:block text-left">
                    <div className="text-sm font-medium text-gray-900">
                      {currentUser.displayName || currentUser.email.split('@')[0]}
                    </div>
                    <div className="text-xs text-gray-500 capitalize">{currentUser.role}</div>
                  </div>
                </button>

                {isUserMenuOpen && (
                  <div
                    ref={userMenuDropdownRef}
                    className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50"
                  >
                    {/* User Info Header */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        {currentUser.profileImage ? (
                          <img
                            src={currentUser.profileImage}
                            alt="Profile"
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                            <UserIcon className="w-6 h-6 text-gray-600" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {currentUser.displayName || 'User'}
                          </div>
                          <div className="text-sm text-gray-500 truncate">{currentUser.email}</div>
                        </div>
                      </div>
                    </div>

                    {/* User Details */}
                    <div className="px-4 py-2 border-b border-gray-100">
                      <div className="space-y-2 text-xs text-gray-600">
                        <div className="flex items-center">
                          <span className="capitalize">{currentUser.role}</span>
                        </div>
                        <div className="flex items-center">
                          <span>Joined {new Date(currentUser.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <UserIcon className="w-4 h-4 mr-2" /> My Profile
                    </Link>
                    {(currentUser.role === 'admin' || currentUser.role === 'employee') && (
                      <Link
                        to="/admin"
                        className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        {currentUser.role === 'admin' ? 'Admin Panel' : 'Dashboard'}
                      </Link>
                    )}
                    <div className="border-t border-gray-100 mt-2 pt-2">
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4 mr-2" /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // No signup, only login on desktop
              <Link
                to="/login"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Login
              </Link>
            )}
          </div>
        </div>

      </div>
    </nav>
  );
};

export default Navbar;
