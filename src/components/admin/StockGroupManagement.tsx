import React, { useState, useEffect } from 'react';
import { ref, onValue, set, push, remove } from 'firebase/database';
import { database } from '../../config/firebase';
import { StockGroup, InventoryItem } from '../../types';
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Users,
  Shield,
  Eye,
  EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';

const StockGroupManagement: React.FC = () => {
  const [stockGroups, setStockGroups] = useState<StockGroup[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<StockGroup | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categories: [] as string[],
    assignedEmployees: [] as string[],
    permissions: {
      canAdd: true,
      canReduce: true,
      canAdjust: true,
      canViewReports: true,
    },
  });

  useEffect(() => {
    // Load stock groups
    const stockGroupsRef = ref(database, 'stockGroups');
    const unsubscribeStockGroups = onValue(stockGroupsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const groupsList: StockGroup[] = Object.keys(data).map(key => ({
          id: key,
          ...data[key],
          assignedEmployees: data[key].assignedEmployees || [],
          categories: data[key].categories || [],
        }));
        setStockGroups(groupsList);
      }
    });

    // Load inventory for categories
    const inventoryRef = ref(database, 'inventory');
    const unsubscribeInventory = onValue(inventoryRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const inventoryList: InventoryItem[] = Object.keys(data).map(key => ({
          id: key,
          ...data[key],
        }));
        setInventory(inventoryList);
      }
    });

    return () => {
      unsubscribeStockGroups();
      unsubscribeInventory();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const groupData = {
        ...formData,
        updatedAt: new Date().toISOString(),
        ...(editingGroup ? {} : { createdAt: new Date().toISOString() }),
      };

      if (editingGroup) {
        const groupRef = ref(database, `stockGroups/${editingGroup.id}`);
        await set(groupRef, groupData);
        toast.success('Stock group updated successfully!');
      } else {
        const stockGroupsRef = ref(database, 'stockGroups');
        await push(stockGroupsRef, groupData);
        toast.success('Stock group created successfully!');
      }

      resetForm();
    } catch (error) {
      toast.error('Failed to save stock group');
      console.error('Error saving stock group:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (group: StockGroup) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      description: group.description,
      categories: group.categories,
      assignedEmployees: group.assignedEmployees,
      permissions: group.permissions,
    });
    setShowForm(true);
  };

  const handleDelete = async (groupId: string) => {
    if (confirm('Are you sure you want to delete this stock group?')) {
      try {
        const groupRef = ref(database, `stockGroups/${groupId}`);
        await remove(groupRef);
        toast.success('Stock group deleted successfully!');
      } catch (error) {
        toast.error('Failed to delete stock group');
        console.error('Error deleting stock group:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      categories: [],
      assignedEmployees: [],
      permissions: {
        canAdd: true,
        canReduce: true,
        canAdjust: true,
        canViewReports: true,
      },
    });
    setEditingGroup(null);
    setShowForm(false);
  };

  const availableCategories = Array.from(new Set(inventory.map(item => item.category)));
  
  const filteredStockGroups = stockGroups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-xl lg:text-2xl font-bold text-gray-900">Stock Group Management</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Stock Group
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search stock groups..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Stock Groups Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
        {filteredStockGroups.map((group) => (
          <div key={group.id} className="bg-white rounded-lg shadow-md p-4 lg:p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{group.name}</h3>
                <p className="text-gray-600 text-sm mb-3">{group.description}</p>
              </div>
              <div className="flex space-x-2 ml-4">
                <button
                  onClick={() => handleEdit(group)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(group.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Categories</h4>
                <div className="flex flex-wrap gap-1">
                  {group.categories.map((category, index) => (
                    <span key={index} className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {category}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Permissions</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center">
                    {group.permissions.canAdd ? (
                      <Eye className="w-3 h-3 text-green-600 mr-1" />
                    ) : (
                      <EyeOff className="w-3 h-3 text-gray-400 mr-1" />
                    )}
                    <span className={group.permissions.canAdd ? 'text-green-600' : 'text-gray-400'}>
                      Add Stock
                    </span>
                  </div>
                  <div className="flex items-center">
                    {group.permissions.canReduce ? (
                      <Eye className="w-3 h-3 text-green-600 mr-1" />
                    ) : (
                      <EyeOff className="w-3 h-3 text-gray-400 mr-1" />
                    )}
                    <span className={group.permissions.canReduce ? 'text-green-600' : 'text-gray-400'}>
                      Reduce Stock
                    </span>
                  </div>
                  <div className="flex items-center">
                    {group.permissions.canAdjust ? (
                      <Eye className="w-3 h-3 text-green-600 mr-1" />
                    ) : (
                      <EyeOff className="w-3 h-3 text-gray-400 mr-1" />
                    )}
                    <span className={group.permissions.canAdjust ? 'text-green-600' : 'text-gray-400'}>
                      Adjust Stock
                    </span>
                  </div>
                  <div className="flex items-center">
                    {group.permissions.canViewReports ? (
                      <Eye className="w-3 h-3 text-green-600 mr-1" />
                    ) : (
                      <EyeOff className="w-3 h-3 text-gray-400 mr-1" />
                    )}
                    <span className={group.permissions.canViewReports ? 'text-green-600' : 'text-gray-400'}>
                      View Reports
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center text-sm text-gray-500">
                <Users className="w-4 h-4 mr-1" />
                {group.assignedEmployees.length} employees assigned
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Stock Group Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 lg:p-6">
              <h3 className="text-lg lg:text-xl font-semibold">
                {editingGroup ? 'Edit Stock Group' : 'Add New Stock Group'}
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 lg:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Group Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Electronics, Clothing, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Describe this stock group..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categories
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                  {availableCategories.map(category => (
                    <label key={category} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.categories.includes(category)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              categories: [...formData.categories, category]
                            });
                          } else {
                            setFormData({
                              ...formData,
                              categories: formData.categories.filter(c => c !== category)
                            });
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">{category}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Permissions
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.permissions.canAdd}
                      onChange={(e) => setFormData({
                        ...formData,
                        permissions: { ...formData.permissions, canAdd: e.target.checked }
                      })}
                      className="mr-2"
                    />
                    <span className="text-sm">Can Add Stock</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.permissions.canReduce}
                      onChange={(e) => setFormData({
                        ...formData,
                        permissions: { ...formData.permissions, canReduce: e.target.checked }
                      })}
                      className="mr-2"
                    />
                    <span className="text-sm">Can Reduce Stock</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.permissions.canAdjust}
                      onChange={(e) => setFormData({
                        ...formData,
                        permissions: { ...formData.permissions, canAdjust: e.target.checked }
                      })}
                      className="mr-2"
                    />
                    <span className="text-sm">Can Adjust Stock</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.permissions.canViewReports}
                      onChange={(e) => setFormData({
                        ...formData,
                        permissions: { ...formData.permissions, canViewReports: e.target.checked }
                      })}
                      className="mr-2"
                    />
                    <span className="text-sm">Can View Reports</span>
                  </label>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving...' : editingGroup ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockGroupManagement;