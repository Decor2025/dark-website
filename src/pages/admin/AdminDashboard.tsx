import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Navigate } from "react-router-dom";
import { database } from "../../config/firebase";
import { signOut } from "firebase/auth";
import { auth } from "../../config/firebase";

import { ref, onValue, off } from "firebase/database";
import {
  Home,
  User,
  LogOut,
  Users,
  Package,
  MessageSquare,
  Settings,
  BarChart3,
  Menu,
  X,
  Bell,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

// Import admin components
import UserManagement from "../../components/admin/UserManagement";
import ProductManagement from "../../components/admin/ProductManagement";
import InventoryManagement from "../../components/admin/InventoryManagement";
import ContactManagement from "../../components/admin/ContactManagement";
import SettingsManagement from "../../components/admin/SettingsManagement";
import EmployeeManagement from "../../components/admin/EmployeeManagement";
import EmployeeDashboard from "../../components/admin/EmployeeDashboard";
import TestimonialManagement from "../../components/admin/TestimonialManagement";
import OurWorkAdmin from "../../components/admin/OurWork";

interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalInventory: number;
  unreadMessages: number;
  lowStockItems: number;
  totalOrders: number;
}

const AdminDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const handleLogout = async () => {
    await signOut(auth);
  };
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalProducts: 0,
    totalInventory: 0,
    unreadMessages: 0,
    lowStockItems: 0,
    totalOrders: 0,
  });

  // Redirect employees to their dedicated dashboard
  if (currentUser?.role === "employee") {
    return <EmployeeDashboard />;
  }

  // Only allow admin access to this dashboard
  if (currentUser?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    // Load dashboard statistics
    const loadStats = () => {
      // Users count
      const usersRef = ref(database, "users");
      onValue(usersRef, (snapshot) => {
        const users = snapshot.val();
        setStats((prev) => ({
          ...prev,
          totalUsers: users ? Object.keys(users).length : 0,
        }));
      });

      // Products count
      const productsRef = ref(database, "products");
      onValue(productsRef, (snapshot) => {
        const products = snapshot.val();
        setStats((prev) => ({
          ...prev,
          totalProducts: products ? Object.keys(products).length : 0,
        }));
      });

      // Inventory count
      const inventoryRef = ref(database, "inventory");
      onValue(inventoryRef, (snapshot) => {
        const inventory = snapshot.val();
        let totalItems = 0;
        let lowStockCount = 0;

        if (inventory) {
          Object.values(inventory).forEach((item: any) => {
            totalItems++;
            if (item.currentStock <= item.minStock) {
              lowStockCount++;
            }
          });
        }

        setStats((prev) => ({
          ...prev,
          totalInventory: totalItems,
          lowStockItems: lowStockCount,
        }));
      });

      // Messages count
      const messagesRef = ref(database, "contactMessages");
      onValue(messagesRef, (snapshot) => {
        const messages = snapshot.val();
        let unreadCount = 0;

        if (messages) {
          Object.values(messages).forEach((message: any) => {
            if (!message.isRead) {
              unreadCount++;
            }
          });
        }

        setStats((prev) => ({ ...prev, unreadMessages: unreadCount }));
      });
    };

    loadStats();

    return () => {
      // Cleanup listeners
      off(ref(database, "users"));
      off(ref(database, "products"));
      off(ref(database, "inventory"));
      off(ref(database, "contactMessages"));
    };
  }, []);

  const menuItems = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "users", label: "Users", icon: Users },
    { id: "products", label: "Products", icon: Package },
    { id: "inventory", label: "Inventory", icon: Package },
    { id: "employees", label: "Employees", icon: Users },
    { id: "our-work", label: "Our Work", icon: Users },
    { id: "testimonials", label: "Testimonials", icon: MessageSquare },
    {
      id: "messages",
      label: "Messages",
      icon: MessageSquare,
      badge: stats.unreadMessages,
    },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">
                Dashboard Overview
              </h1>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div
                className="bg-white p-6 rounded-lg shadow-sm border cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setActiveTab("users")}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setActiveTab("users");
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total Users
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.totalUsers}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
                <div className="mt-2 flex items-center text-sm text-green-600">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Active users
                </div>
              </div>

              <div
                className="bg-white p-6 rounded-lg shadow-sm border cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setActiveTab("products")}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setActiveTab("products");
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Products
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.totalProducts}
                    </p>
                  </div>
                  <Package className="w-8 h-8 text-green-500" />
                </div>
                <div className="mt-2 flex items-center text-sm text-blue-600">
                  <Package className="w-4 h-4 mr-1" />
                  In catalog
                </div>
              </div>

              <div
                className="bg-white p-6 rounded-lg shadow-sm border cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setActiveTab("inventory")}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setActiveTab("inventory");
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Inventory Items
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.totalInventory}
                    </p>
                  </div>
                  <Package className="w-8 h-8 text-purple-500" />
                </div>
                <div className="mt-2 flex items-center text-sm text-purple-600">
                  <BarChart3 className="w-4 h-4 mr-1" />
                  Total items
                </div>
              </div>

              <div
                className="bg-white p-6 rounded-lg shadow-sm border cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setActiveTab("messages")}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setActiveTab("messages");
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Messages
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.unreadMessages}
                    </p>
                  </div>
                  <MessageSquare className="w-8 h-8 text-orange-500" />
                </div>
                <div className="mt-2 flex items-center text-sm text-orange-600">
                  <Bell className="w-4 h-4 mr-1" />
                  Unread
                </div>
              </div>
            </div>

            {/* Alerts */}
            {stats.lowStockItems > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800">
                      Low Stock Alert
                    </h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      {stats.lowStockItems} items are running low on stock.
                      Check inventory for details.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab("products")}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Package className="w-6 h-6 text-blue-500 mr-3" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Manage Products</p>
                    <p className="text-sm text-gray-500">
                      Add or edit products
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab("inventory")}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <BarChart3 className="w-6 h-6 text-green-500 mr-3" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Check Inventory</p>
                    <p className="text-sm text-gray-500">
                      Monitor stock levels
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab("messages")}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <MessageSquare className="w-6 h-6 text-orange-500 mr-3" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">View Messages</p>
                    <p className="text-sm text-gray-500">Customer inquiries</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        );
      case "users":
        return <UserManagement />;
      case "products":
        return <ProductManagement />;
      case "inventory":
        return <InventoryManagement />;
      case "employees":
        return <EmployeeManagement />;
      case "our-work":
        return <OurWorkAdmin />;
      case "messages":
        return <ContactManagement />;
      case "testimonials":
        return <TestimonialManagement />;
      case "settings":
        return <SettingsManagement />;
      default:
        return <div>Select a tab</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Admin Panel</h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="mt-6 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center justify-between px-3 py-2 mb-1 text-left rounded-lg transition-colors
                  ${
                    activeTab === item.id
                      ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }
                `}
              >
                <div className="flex items-center">
                  <Icon className="w-5 h-5 mr-3" />
                  <span className="font-medium">{item.label}</span>
                </div>
                {item.badge && item.badge > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b h-16 px-6 flex items-center justify-between">
          {/* Left: Hamburger + Navigation */}
          <div className="flex items-center space-x-5">
            {/* Sidebar Toggle */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              <Menu className="w-6 h-6 text-gray-700" />
            </button>

            {/* Dashboard Home */}

            {/* Website Button */}
            <a
              href="/"
              className="px-3 py-2 flex items-center gap-2 bg-black text-white rounded-md text-sm font-medium hover:bg-gray-800 transition shadow-sm"
            >
              <Home className="w-4 h-4" />
              <span>Website</span>
            </a>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center space-x-5 relative">
            {/* Notification Bell */}
            <button
              onClick={() => setActiveTab("messages")}
              className="relative p-2 rounded-full hover:bg-gray-100"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {stats.unreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1">
                  {stats.unreadMessages}
                </span>
              )}
            </button>

            {/* Profile */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="focus:outline-none"
              >
                {currentUser?.profileImage ? (
                  <img
                    src={currentUser.profileImage}
                    alt="User avatar"
                    className="w-9 h-9 rounded-full object-cover border border-gray-300"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gray-300" />
                )}
              </button>

              {/* Dropdown */}
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg py-1 z-50">
                  <a
                    href="/profile"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <User className="w-4 h-4 mr-2" />
                    My Profile
                  </a>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">{renderContent()}</main>
      </div>
    </div>
  );
};

export default AdminDashboard;
