// src/components/Navbar.tsx
import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
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

type NavItem = {
  label: string;
  to?: string;
  icon?: JSX.Element;
};


const Navbar: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settings, setSettings] = useState<SiteSettings[]>([]);
  const { currentUser, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();

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
    currentUser?.displayName || currentUser?.email?.split?.("@")?.[0] || "User";

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      setSidebarOpen(false);
      navigate("/");
    }
  };

  // Nav items for desktop and sidebar
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
          {/* Left: Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">{storeInitial}</span>
            </div>
            <span className="font-semibold text-gray-800">{storeName}</span>
          </Link>

          {/* Desktop nav menu */}
          <div className="hidden md:flex items-center space-x-10">
            {navLinks.map(({ label, to }) => (
              <Link
                key={label}
                to={to || "/"}
                className="text-gray-700 hover:text-blue-600 text-sm font-medium transition"
              >
                {label}
              </Link>
            ))}

            {/* Login/Profile */}
            {!authLoading && currentUser ? (
              <div className="relative">
                <button
                  ref={profileButtonRef}
                  onClick={() => setProfileMenuOpen((o) => !o)}
                  className="flex items-center gap-2 focus:outline-none"
                  aria-haspopup="true"
                  aria-expanded={profileMenuOpen}
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
                    className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-2 z-50"
                  >
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      My Profile
                    </Link>
                    {(currentUser.role === "admin" ||
                      currentUser.role === "employee") && (
                      <Link
                        to="/admin"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        {currentUser.role === "admin"
                          ? "Admin Panel"
                          : "Dashboard"}
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
                    >
                      Logout
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

          {/* Mobile: Login button outside sidebar */}
          <div className="flex items-center gap-2 md:hidden">
            {!authLoading && currentUser ? (
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

            {/* Hamburger */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md hover:bg-gray-100"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="flex-1 bg-black bg-opacity-30"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="w-72 bg-white h-full shadow-xl p-4 flex flex-col justify-between animate-slideInRight">
            <div>
              <div className="flex justify-between items-center border-b border-gray-200 pb-3 mb-4">
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
                  aria-label="Close menu"
                >
                  <X size={22} />
                </button>
              </div>

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
                    <div className="text-sm font-medium text-gray-800">Welcome</div>
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

              <div className="flex flex-col gap-2">
                {navLinks.map(({ label, to, icon }, idx) => (
                  <Link
                    key={idx}
                    to={to || "/"}
                    onClick={() => setSidebarOpen(false)}
                    className="py-2 px-2 rounded hover:bg-gray-100 flex items-center gap-2"
                  >
                    {icon && <span className="text-gray-500">{icon}</span>}
                    <span>{label}</span>
                  </Link>
                ))}
              </div>

              {/* Optional small footer links */}
              <div className="text-xs text-gray-500 mt-6 mb-4">
                <Link
                  to="/privacy-policy"
                  onClick={() => setSidebarOpen(false)}
                  className="block mb-1 hover:underline"
                >
                  Privacy Policy
                </Link>
                <Link
                  to="/rate-us"
                  onClick={() => setSidebarOpen(false)}
                  className="block hover:underline"
                >
                  Rate Us
                </Link>
              </div>
            </div>

            <div className="border-t pt-4 flex flex-col gap-2">
              {!authLoading && currentUser ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setSidebarOpen(false)}
                    className="py-2 px-2 rounded hover:bg-gray-100 flex items-center gap-2"
                  >
                    <UserIcon size={18} />
                    My Profile
                  </Link>
                  {(currentUser.role === "admin" ||
                    currentUser.role === "employee") && (
                    <Link
                      to="/admin"
                      onClick={() => setSidebarOpen(false)}
                      className="py-2 px-2 rounded hover:bg-gray-100 flex items-center gap-2"
                    >
                      <Users size={18} />
                      {currentUser.role === "admin" ? "Admin Panel" : "Dashboard"}
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="text-red-600 py-2 px-2 rounded hover:bg-red-50 text-left flex items-center gap-2"
                  >
                    <LogOut size={18} />
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

      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slideInRight {
          animation: slideInRight 0.3s ease forwards;
        }
      `}</style>
    </>
  );
};

export default Navbar;
