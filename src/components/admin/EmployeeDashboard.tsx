import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import InventoryManagement from './InventoryManagement';
import { BarChart3, Package, User } from 'lucide-react';

const EmployeeDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { currentUser } = useAuth();

  const employeeTabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Tasks Completed Today</p>
                  <p className="text-2xl font-bold text-blue-900">0</p>
                </div>
                <BarChart3 className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-green-50 p-6 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Inventory Updates</p>
                  <p className="text-2xl font-bold text-green-900">0</p>
                </div>
                <Package className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>
        );
      case 'inventory':
        return <InventoryManagement />;
      case 'profile':
        return (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">My Profile</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={currentUser?.email || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <input
                  type="text"
                  value={currentUser?.role || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>
            </div>
          </div>
        );
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
            <h2 className="text-xl font-bold text-gray-900">Employee Dashboard</h2>
            <p className="text-sm text-gray-600">{currentUser?.email}</p>
          </div>
          
          <nav className="p-4">
            {employeeTabs.map((tab) => (
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

export default EmployeeDashboard;