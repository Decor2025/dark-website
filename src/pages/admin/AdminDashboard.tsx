import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Navigate } from "react-router-dom";
import { database } from "../../config/firebase";
import { signOut } from "firebase/auth";
import { auth } from "../../config/firebase";
import QuoteBuilder from "../../components/admin/QuoteBuilder";
import { ref, onValue, off } from "firebase/database";
import RedirectManager from "../../components/admin/RedirectManager";
import {
  Home,
  User,
  Quote,
  LogOut,
  Users,
  Package,
  MessageSquare,
  Settings,
  BarChart3,
  X,
  Bell,
  TrendingUp,
  AlertTriangle,
  AlignLeft,
  Clock,
  PieChart,
  DollarSign,
  ShoppingCart,
  ChevronDown,
  ChevronRight,
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
import OrderManagement from "../../components/admin/OrderManagement";
import ProductionDashboard from "../../components/admin/ProductionDashboard";
import ProductSKUManagement from "../../components/admin/ProductSKUManagement";

// Import charts
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalInventory: number;
  unreadMessages: number;
  lowStockItems: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  monthlyOrders: any[];
  productCategoryData: any[];
  salesData: any[];
}

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
];

const AdminDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const handleLogout = async () => {
    await signOut(auth);
  };
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {
      dashboard: true,
      sales: false,
      products: false,
      users: false,
      content: false,
    }
  );
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalProducts: 0,
    totalInventory: 0,
    unreadMessages: 0,
    lowStockItems: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    monthlyOrders: [],
    productCategoryData: [],
    salesData: [],
  });

  // Toggle group expansion
  const toggleGroup = (groupKey: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  // Redirect employees to their dedicated dashboard
  if (currentUser?.role === "employee") {
    return <EmployeeDashboard />;
  }

  // Redirect production users to production dashboard
  if (currentUser?.role === "production") {
    return <ProductionDashboard />;
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
            if (
              item.currentStock <= (item.minimumStock || item.minStock || 0)
            ) {
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

      // Orders count and revenue
      const ordersRef = ref(database, "orders");
      onValue(ordersRef, (snapshot) => {
        const orders = snapshot.val();
        let totalOrders = 0;
        let pendingOrders = 0;
        let completedOrders = 0;
        let totalRevenue = 0;
        const monthlyData: any = {};
        const categoryData: any = {};
        const salesData: any = [];

        if (orders) {
          Object.values(orders).forEach((order: any) => {
            totalOrders++;
            if (order.status === "pending") {
              pendingOrders++;
            } else if (order.status === "completed") {
              completedOrders++;
              totalRevenue += order.total || 0;

              // Group by month for charts
              const orderDate = new Date(order.createdAt || Date.now());
              const monthYear = `${
                orderDate.getMonth() + 1
              }/${orderDate.getFullYear()}`;

              if (!monthlyData[monthYear]) {
                monthlyData[monthYear] = {
                  month: monthYear,
                  orders: 0,
                  revenue: 0,
                };
              }
              monthlyData[monthYear].orders += 1;
              monthlyData[monthYear].revenue += order.total || 0;

              // Group by product category
              if (order.items) {
                order.items.forEach((item: any) => {
                  const category = item.category || "Uncategorized";
                  if (!categoryData[category]) {
                    categoryData[category] = { name: category, value: 0 };
                  }
                  categoryData[category].value += 1;
                });
              }
            }
          });

          // Convert to array for charts
          const monthlyOrders = Object.values(monthlyData);
          const productCategoryData = Object.values(categoryData);

          // Create sales data for line chart
          const sortedMonths = monthlyOrders.sort((a: any, b: any) => {
            const [aMonth, aYear] = a.month.split("/").map(Number);
            const [bMonth, bYear] = b.month.split("/").map(Number);
            return aYear === bYear ? aMonth - bMonth : aYear - bYear;
          });

          setStats((prev) => ({
            ...prev,
            totalOrders,
            pendingOrders,
            completedOrders,
            totalRevenue,
            monthlyOrders: sortedMonths,
            productCategoryData,
            salesData: sortedMonths.map((m: any) => ({
              name: m.month,
              sales: m.revenue,
              orders: m.orders,
            })),
          }));
        }
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
      off(ref(database, "orders"));
      off(ref(database, "contactMessages"));
    };
  }, []);

  // Grouped menu items
  const menuGroups = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: BarChart3,
      items: [
        { id: "overview", label: "Overview", icon: BarChart3 },
        { id: "analytics", label: "Analytics", icon: PieChart },
      ],
    },
    {
      id: "sales",
      label: "Sales",
      icon: DollarSign,
      items: [
        { id: "orders", label: "Orders", icon: Package },
        { id: "quote", label: "Quotation", icon: Quote },
      ],
    },
    {
      id: "products",
      label: "Products",
      icon: Package,
      items: [
        { id: "products", label: "Products", icon: Package },
        { id: "inventory", label: "Inventory", icon: Package },
        { id: "product-skus", label: "Product SKUs", icon: Package },
      ],
    },
    {
      id: "users",
      label: "Users",
      icon: Users,
      items: [
        { id: "users", label: "Users", icon: Users },
        { id: "employees", label: "Employees", icon: Users },
      ],
    },
    {
      id: "content",
      label: "Content",
      icon: MessageSquare,
      items: [
        { id: "redirect", label: "Redirect", icon: Users },
        { id: "our-work", label: "Our Work", icon: Users },
        { id: "testimonials", label: "Testimonials", icon: MessageSquare },
        {
          id: "messages",
          label: "Messages",
          icon: MessageSquare,
          badge: stats.unreadMessages,
        },
      ],
    },
  ];

  // Add Settings as a direct item (not in a group)
  const singleItems = [{ id: "settings", label: "Settings", icon: Settings }];

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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
                onClick={() => setActiveTab("orders")}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setActiveTab("orders");
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total Orders
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.totalOrders}
                    </p>
                  </div>
                  <Package className="w-8 h-8 text-purple-500" />
                </div>
                <div className="mt-2 flex items-center text-sm text-purple-600">
                  <Package className="w-4 h-4 mr-1" />
                  All orders
                </div>
              </div>

              <div
                className="bg-white p-6 rounded-lg shadow-sm border cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setActiveTab("orders")}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setActiveTab("orders");
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Pending Orders
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.pendingOrders}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-500" />
                </div>
                <div className="mt-2 flex items-center text-sm text-yellow-600">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  Need attention
                </div>
              </div>

              <div
                className="bg-white p-6 rounded-lg shadow-sm border cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setActiveTab("analytics")}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setActiveTab("analytics");
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total Revenue
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      ${stats.totalRevenue.toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-500" />
                </div>
                <div className="mt-2 flex items-center text-sm text-green-600">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Revenue
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
                      Low Stock Items
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.lowStockItems}
                    </p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <div className="mt-2 flex items-center text-sm text-red-600">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  Needs restocking
                </div>
              </div>
            </div>

            {/* Alerts */}
            {(stats.lowStockItems > 0 || stats.pendingOrders > 0) && (
              <div className="space-y-4">
                {stats.pendingOrders > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <Clock className="w-5 h-5 text-yellow-600 mr-2" />
                      <div>
                        <h3 className="text-sm font-medium text-yellow-800">
                          Pending Orders Alert
                        </h3>
                        <p className="text-sm text-yellow-700 mt-1">
                          {stats.pendingOrders} orders are waiting for
                          production. Check orders for details.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {stats.lowStockItems > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                      <div>
                        <h3 className="text-sm font-medium text-red-800">
                          Low Stock Alert
                        </h3>
                        <p className="text-sm text-red-700 mt-1">
                          {stats.lowStockItems} items are running low on stock.
                          Check inventory for details.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab("orders")}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Package className="w-6 h-6 text-purple-500 mr-3" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Manage Orders</p>
                    <p className="text-sm text-gray-500">
                      Create and track orders
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

                <button
                  onClick={() => setActiveTab("analytics")}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <PieChart className="w-6 h-6 text-blue-500 mr-3" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">View Analytics</p>
                    <p className="text-sm text-gray-500">
                      Sales and performance
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab("quote")}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Quote className="w-6 h-6 text-red-500 mr-3" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Create Quote</p>
                    <p className="text-sm text-gray-500">
                      Generate new quotation
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab("products")}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Package className="w-6 h-6 text-green-500 mr-3" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Manage Products</p>
                    <p className="text-sm text-gray-500">
                      Add or edit products
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        );

      case "analytics":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">
                Analytics Dashboard
              </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sales Trend Chart */}
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Sales Trend
                </h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.salesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => [`$${value}`, "Revenue"]}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="sales"
                        stroke="#8884d8"
                        activeDot={{ r: 8 }}
                        name="Revenue"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Orders by Category */}
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Orders by Category
                </h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={stats.productCategoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name}: ${
                            percent ? (percent * 100).toFixed(0) : 0
                          }%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {stats.productCategoryData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [`${value} orders`, "Count"]}
                      />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Monthly Orders */}
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Monthly Orders
                </h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.monthlyOrders}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [value, "Orders"]} />
                      <Legend />
                      <Bar dataKey="orders" fill="#8884d8" name="Orders" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Key Metrics
                </h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-blue-600">
                        Total Revenue
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        ${stats.totalRevenue.toLocaleString()}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-blue-500" />
                  </div>

                  <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-green-600">
                        Total Orders
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.totalOrders}
                      </p>
                    </div>
                    <ShoppingCart className="w-8 h-8 text-green-500" />
                  </div>

                  <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-purple-600">
                        Completed Orders
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.completedOrders}
                      </p>
                    </div>
                    <Package className="w-8 h-8 text-purple-500" />
                  </div>

                  <div className="flex justify-between items-center p-4 bg-yellow-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-yellow-600">
                        Pending Orders
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.pendingOrders}
                      </p>
                    </div>
                    <Clock className="w-8 h-8 text-yellow-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "orders":
        return <OrderManagement />;
      case "users":
        return <UserManagement />;
      case "quote":
        return <QuoteBuilder />;
      case "products":
        return <ProductManagement />;
      case "inventory":
        return <InventoryManagement />;
      case "employees":
        return <EmployeeManagement />;
      case "product-skus":
        return <ProductSKUManagement />;
      case "our-work":
        return <OurWorkAdmin />;
      case "redirect":
        return <RedirectManager />;
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

        <nav className="mt-6 px-3 overflow-y-auto h-[calc(100vh-4rem)]">
          {menuGroups.map((group) => {
            const Icon = group.icon;
            const isExpanded = expandedGroups[group.id];

            return (
              <div key={group.id} className="mb-2">
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between px-3 py-2 mb-1 text-left rounded-lg transition-colors text-gray-700 hover:bg-gray-100"
                >
                  <div className="flex items-center">
                    <Icon className="w-5 h-5 mr-3" />
                    <span className="font-medium">{group.label}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 transition-transform" />
                  ) : (
                    <ChevronRight className="w-4 h-4 transition-transform" />
                  )}
                </button>

                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isExpanded ? "max-h-96" : "max-h-0"
                  }`}
                >
                  {group.items.map((item) => {
                    const ItemIcon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setSidebarOpen(false);
                        }}
                        className={`
                          w-full flex items-center justify-between pl-9 pr-3 py-2 mb-1 text-left rounded-lg transition-colors
                          ${
                            activeTab === item.id
                              ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                              : "text-gray-700 hover:bg-gray-100"
                          }
                        `}
                      >
                        <div className="flex items-center">
                          <ItemIcon className="w-4 h-4 mr-3" />
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
                </div>
              </div>
            );
          })}
          {/* Render single items */}
          {singleItems.map((item) => {
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
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b h-16 px-3 flex items-center justify-between">
          {/* Left: Hamburger + Navigation */}
          <div className="flex items-center space-x-5">
            {/* Sidebar Toggle */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              <AlignLeft className="w-6 h-6 text-gray-700" />
            </button>

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
