import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import ProductManagement from '../../components/admin/ProductManagement';
import InventoryManagement from '../../components/admin/InventoryManagement';
import UserManagement from '../../components/admin/UserManagement';
import TestimonialManagement from '../../components/admin/TestimonialManagement';
import ContactManagement from '../../components/admin/ContactManagement';
import SettingsManagement from '../../components/admin/SettingsManagement';
import EmployeeDashboard from '../../components/admin/EmployeeDashboard';
import { 
  Package, 
  Users, 
  BarChart3, 
  Settings,
  ShoppingCart,
  TrendingUp,
  MessageSquare,
  Mail,
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const isAdmin = currentUser?.role === 'admin';
  const isEmployee = currentUser?.role === 'employee';

  if (isEmployee) {
    return <EmployeeDashboard />;
  }

  const adminTabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'inventory', label: 'Inventory', icon: ShoppingCart },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'testimonials', label: 'Testimonials', icon: MessageSquare },
    { id: 'contacts', label: 'Contact Messages', icon: Mail },
    { id: 'settings', label: 'Site Settings', icon: Settings },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Total Products</p>
                  <p className="text-2xl font-bold text-blue-900">0</p>
                </div>
                <Package className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-green-50 p-6 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Total Users</p>
                  <p className="text-2xl font-bold text-green-900">0</p>
                </div>
                <Users className="w-8 h-8 text-green-600" />
              </div>
            </div>
            
            <div className="bg-purple-50 p-6 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">Low Stock Items</p>
                  <p className="text-2xl font-bold text-purple-900">0</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </div>
            
            <div className="bg-orange-50 p-6 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-sm font-medium">Total Orders</p>
                  <p className="text-2xl font-bold text-orange-900">0</p>
                </div>
                <ShoppingCart className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </div>
        );
      case 'products':
        return <ProductManagement />;
      case 'inventory':
        return <InventoryManagement />;
      case 'users':
        return <UserManagement />;
      case 'testimonials':
        return <TestimonialManagement />;
      case 'contacts':
        return <ContactManagement />;
      case 'settings':
        return <SettingsManagement />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900">
              {isAdmin ? 'Admin Panel' : 'Dashboard'}
            </h2>
            <p className="text-sm text-gray-600">{currentUser?.email}</p>
          </div>
          
          <nav className="p-4">
            {adminTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 capitalize">{activeTab}</h1>
          </div>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;