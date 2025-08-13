// src/components/Navbar.tsx
import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  User as UserIcon,
  LogOut,
  Users,
  Info,
  Home,
  Phone,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { ref, onValue } from "firebase/database";
import { database } from "../../config/firebase";
import { SiteSettings } from "../../types";

import TestimonialForm from "../testimonials/TestimonialForm"; // Adjust path accordingly

type NavItem = {
  label: string;
  to?: string;
  icon?: JSX.Element;
};

const Navbar: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showTestimonialForm, setShowTestimonialForm] = useState(false);
  const [settings, setSettings] = useState<SiteSettings[]>([]);
  const { currentUser, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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

  const getSetting = (key: string) =>
    settings.find((s) => s.key === key)?.value || "";
  const storeName = getSetting("store_name") || "Decor Drapes";
  const storeInitial = storeName.charAt(0).toUpperCase();

  const displayName =
    currentUser?.displayName ||
    currentUser?.email?.split?.("@")?.[0] ||
    "User";

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      setSidebarOpen(false);
      navigate("/");
    }
  };

  const navLinks: NavItem[] = [
    { label: "Home", to: "/", icon: <Home size={16} /> },
    { label: "Catalogue", to: "/catalogue", icon: <Users size={16} /> },
    { label: "About Us", to: "/about", icon: <Info size={16} /> },
    { label: "Contact Us", to: "/contact", icon: <Phone size={16} /> },
  ];

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (
        profileMenuOpen &&
        profileMenuRef.current &&
        profileButtonRef.current &&
        !profileMenuRef.current.contains(e.target as Node) &&
        !profileButtonRef.current.contains(e.target as Node)
      ) {
        setProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [profileMenuOpen]);

  return (
    <>
      <nav className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {storeInitial}
              </span>
            </div>
            <span className="font-semibold text-gray-800">{storeName}</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map(({ label, to }) => (
              <Link
                key={label}
                to={to || "/"}
                className={`relative text-sm font-medium px-2 py-1 rounded-md transition ${
                  location.pathname === to
                    ? "text-blue-600 font-semibold after:absolute after:left-0 after:right-0 after:bottom-0 after:h-[2px] after:bg-blue-600"
                    : "text-gray-700 hover:text-blue-600"
                }`}
              >
                {label}
              </Link>
            ))}

            {/* Profile / Login */}
            {authLoading ? (
              <div className="w-16 h-8 bg-gray-200 rounded-md animate-pulse" />
            ) : currentUser ? (
              <div className="relative">
                <button
                  ref={profileButtonRef}
                  onClick={() => setProfileMenuOpen((o) => !o)}
                  className="flex items-center gap-2 focus:outline-none"
                >
                  {currentUser.profileImage ? (
                    <img
                      src={currentUser.profileImage}
                      alt="Avatar"
                      className="w-8 h-8 rounded-full object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                      <UserIcon size={16} />
                    </div>
                  )}
                  <span className="text-sm text-gray-700">{displayName}</span>
                </button>

                {profileMenuOpen && (
                  <div
                    ref={profileMenuRef}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50"
                  >
                    <Link
                      to="/profile"
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      <UserIcon size={16} /> My Profile
                    </Link>
                    {(currentUser.role === "admin" ||
                      currentUser.role === "employee") && (
                      <Link
                        to="/admin"
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        <Users size={16} />{" "}
                        {currentUser.role === "admin"
                          ? "Admin Panel"
                          : "Dashboard"}
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    >
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile */}
          <div className="flex items-center gap-2 md:hidden">
            {authLoading ? (
              <div className="w-16 h-8 bg-gray-200 rounded-md animate-pulse" />
            ) : currentUser ? (
              <Link
                to="/profile"
                className="flex items-center gap-1 px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition"
              >
                {currentUser.profileImage ? (
                  <img
                    src={currentUser.profileImage}
                    alt="Avatar"
                    className="w-6 h-6 rounded-full object-cover border border-gray-200"
                  />
                ) : (
                  <UserIcon size={16} className="text-gray-700" />
                )}
                <span className="text-gray-700 text-sm truncate max-w-[80px]">
                  {displayName}
                </span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition"
              >
                Login
              </Link>
            )}
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md hover:bg-gray-100"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="flex-1 bg-black bg-opacity-30"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="w-72 bg-white h-full shadow-xl p-4 flex flex-col justify-between animate-slideInRight">
            <div>
              <div className="flex justify-between items-center border-b pb-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                    {storeInitial}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{storeName}</div>
                    <div className="text-xs text-gray-500">Menu</div>
                  </div>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-md"
                >
                  <X size={22} />
                </button>
              </div>

              {/* User Info */}
              <div className="mb-6 border-b pb-4">
                {!authLoading && currentUser ? (
                  <div className="flex items-center gap-3">
                    {currentUser.profileImage ? (
                      <img
                        src={currentUser.profileImage}
                        alt="Avatar"
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                        <UserIcon size={18} />
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-sm">{displayName}</div>
                      <div className="text-xs text-gray-500 capitalize">
                        {currentUser.role || "Member"}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-sm font-medium text-gray-800">
                      Welcome
                    </div>
                    <div className="text-xs text-gray-500 mb-2">
                      Sign in to access your account
                    </div>
                    <Link
                      to="/login"
                      onClick={() => setSidebarOpen(false)}
                      className="inline-block px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                    >
                      Login
                    </Link>
                  </div>
                )}
              </div>

              {/* Menu Links */}
              <div className="flex flex-col gap-2">
                {navLinks.map(({ label, to, icon }, idx) => (
                  <Link
                    key={idx}
                    to={to || "/"}
                    onClick={() => setSidebarOpen(false)}
                    className={`py-2 px-2 rounded flex items-center gap-2 ${
                      location.pathname === to
                        ? "bg-blue-50 text-blue-600 font-medium"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    {icon && <span className="text-gray-500">{icon}</span>}
                    <span>{label}</span>
                  </Link>
                ))}
              </div>

              {/* Footer links */}
              <div className="text-xs text-gray-500 mt-6 mb-4">
                <Link
                  to="/privacy-policy"
                  onClick={() => setSidebarOpen(false)}
                  className="block mb-1 hover:underline"
                >
                  Privacy Policy
                </Link>
                <button
                  onClick={() => {
                    setSidebarOpen(false);
                    setShowTestimonialForm(true);
                  }}
                  className="block hover:underline text-left w-full"
                >
                  Rate Us
                </button>
              </div>
            </div>

            {/* Bottom Links */}
            <div className="border-t pt-4 flex flex-col gap-2">
              {!authLoading && currentUser ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setSidebarOpen(false)}
                    className="py-2 px-2 rounded hover:bg-gray-100 flex items-center gap-2 text-sm text-gray-600"
                  >
                    <UserIcon size={16} />
                    My Profile
                  </Link>
                  {(currentUser.role === "admin" ||
                    currentUser.role === "employee") && (
                    <Link
                      to="/admin"
                      onClick={() => setSidebarOpen(false)}
                      className="py-2 px-2 rounded hover:bg-gray-100 flex items-center gap-2 text-sm text-gray-600"
                    >
                      <Users size={16} />
                      {currentUser.role === "admin"
                        ? "Admin Panel"
                        : "Dashboard"}
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="text-red-600 py-2 px-2 rounded hover:bg-red-50 text-left flex items-center gap-2 text-sm"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </>
              ) : (
                <span className="text-gray-500 text-sm">Not signed in</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Testimonial Modal */}
      <TestimonialForm
        isOpen={showTestimonialForm}
        onClose={() => setShowTestimonialForm(false)}
      />

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slideInRight {
          animation: slideInRight 0.3s ease forwards;
        }
      `}</style>
    </>
  );
};

export default Navbar;
