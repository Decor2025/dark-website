import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  AlignRight,
  X,
  User as UserIcon,
  LogOut,
  Users,
  Info,
  Home,
  Phone,
  ChevronDown,
  Sun,
  Moon,
  Monitor,
  ShoppingCart,
  Palette,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useCart } from "../../context/CartContext";
import { ref, onValue } from "firebase/database";
import { database } from "../../config/firebase";
import { SiteSettings } from "../../types";
import TestimonialForm from "../testimonials/TestimonialForm";
import { motion, AnimatePresence } from "framer-motion";

type NavItem = {
  label: string;
  to?: string;
  icon?: JSX.Element;
};

const Navbar: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showTestimonialForm, setShowTestimonialForm] = useState(false);
  const [settings, setSettings] = useState<SiteSettings[]>([]);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const { currentUser, loading: authLoading, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { items } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const themeMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const settingsRef = ref(database, "siteSettings");
    const unsub = onValue(settingsRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        setSettings(Object.keys(data).map((key) => ({ id: key, ...data[key] })));
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setShowThemeMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    setSidebarOpen(false);
    navigate("/");
  };

  const navItems: NavItem[] = [
    { label: "Home", to: "/", icon: <Home size={20} /> },
    { label: "About", to: "/about", icon: <Info size={20} /> },
    { label: "Catalogue", to: "/catalogue", icon: <Palette size={20} /> },
    { label: "Our Work", to: "/our-work", icon: <Users size={20} /> },
    { label: "Contact", to: "/contact", icon: <Phone size={20} /> },
  ];

  const themeOptions = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

  const cartCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0);

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95 shadow-sm dark:shadow-none transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 flex-shrink-0 group hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 dark:from-blue-500 dark:to-cyan-400 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
              <span className="text-white font-bold text-base">HLG</span>
            </div>
            <div className="hidden sm:block">
              <p className="font-bold text-lg bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
                HLG
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Quality Furnishings</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.to || "#"}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  location.pathname === item.to
                    ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right side controls */}
          <div className="flex items-center space-x-3">
            {/* Cart */}
            <Link
              to="/cart"
              className="relative p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-700 transition-colors duration-200 group"
            >
              <ShoppingCart size={20} className="group-hover:scale-110 transition-transform" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Theme Selector */}
            <div className="relative hidden sm:block" ref={themeMenuRef}>
              <button
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-700 transition-colors duration-200 hover:scale-110 transition-transform"
                aria-label="Toggle theme"
              >
                {theme === "light" && <Sun size={20} />}
                {theme === "dark" && <Moon size={20} />}
                {theme === "system" && <Monitor size={20} />}
              </button>

              <AnimatePresence>
                {showThemeMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50"
                  >
                    <div className="px-4 py-2">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Theme Preference
                      </p>
                    </div>
                    {themeOptions.map((option) => {
                      const Icon = option.icon;
                      const isActive = theme === option.value;
                      return (
                        <button
                          key={option.value}
                          onClick={() => {
                            setTheme(option.value as any);
                            setShowThemeMenu(false);
                          }}
                          className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                            isActive
                              ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-l-2 border-blue-600 dark:border-blue-400"
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border-l-2 border-transparent"
                          }`}
                        >
                          <Icon size={18} />
                          <span className="flex-1 text-left">{option.label}</span>
                          {isActive && <span className="text-blue-600 dark:text-blue-400">✓</span>}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Auth buttons */}
            {!authLoading && (
              <>
                {currentUser ? (
                  <Link
                    to="/profile"
                    className="p-2 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 dark:from-blue-500 dark:to-cyan-400 text-white hover:shadow-lg transition-all duration-200 hover:scale-105"
                  >
                    <UserIcon size={20} />
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    className="px-4 py-2 bg-gradient-to-br from-blue-600 to-cyan-500 dark:from-blue-500 dark:to-cyan-400 text-white rounded-lg font-medium text-sm hover:shadow-lg transition-all duration-200 hover:scale-105"
                  >
                    Login
                  </Link>
                )}
              </>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              {sidebarOpen ? <X size={24} /> : <AlignRight size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div className="py-4 space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.label}
                    to={item.to || "#"}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                      location.pathname === item.to
                        ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                ))}

                {/* Mobile Theme Selector */}
                <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700 mt-4">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                    Theme
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {themeOptions.map((option) => {
                      const Icon = option.icon;
                      const isActive = theme === option.value;
                      return (
                        <button
                          key={option.value}
                          onClick={() => {
                            setTheme(option.value as any);
                            setSidebarOpen(false);
                          }}
                          className={`flex flex-col items-center space-y-2 px-3 py-3 rounded-lg text-xs font-medium transition-all duration-200 ${
                            isActive
                              ? "bg-blue-600 dark:bg-blue-600 text-white shadow-lg"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                          }`}
                        >
                          <Icon size={20} />
                          <span>{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Auth section */}
                {!authLoading && (
                  <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700 mt-4 space-y-2">
                    {currentUser ? (
                      <>
                        <Link
                          to="/profile"
                          onClick={() => setSidebarOpen(false)}
                          className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium transition-all duration-200"
                        >
                          <UserIcon size={20} />
                          <span>Profile</span>
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-700 font-medium transition-all duration-200"
                        >
                          <LogOut size={20} />
                          <span>Logout</span>
                        </button>
                      </>
                    ) : (
                      <Link
                        to="/login"
                        onClick={() => setSidebarOpen(false)}
                        className="block px-4 py-3 bg-gradient-to-br from-blue-600 to-cyan-500 dark:from-blue-500 dark:to-cyan-400 text-white rounded-lg font-medium text-center transition-all duration-200 hover:shadow-lg"
                      >
                        Login
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default Navbar;
