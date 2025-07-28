import React, { useState, useEffect } from 'react';
import { ref, onValue, set, push, remove } from 'firebase/database';
import { database } from '../../config/firebase';
import { fetchInventoryFromGoogleSheets, syncInventoryToFirebase } from '../../config/googleSheets';
import { useAuth } from '../../context/AuthContext';
import { InventoryItem, InventoryTransaction, InventoryGroup } from '../../types';
import { 
  Package, 
  RefreshCw,
  Download, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  FileText,
  Users,
  ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';

const InventoryManagement: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [groups, setGroups] = useState<InventoryGroup[]>([]);
  const [activeTab, setActiveTab] = useState('items');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');
  const [syncing, setSyncing] = useState(false);
  const { currentUser } = useAuth();

  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    category: '',
    unit: 'pcs',
    unitType: 'piece' as 'sqft' | 'meter' | 'piece' | 'kg' | 'liter',
    costPrice: '',
    sellingPrice: '',
    pricePerUnit: '',
    currentStock: '',
    minimumStock: '',
    maximumStock: '',
    reorderLevel: '',
    location: '',
    supplier: '',
    barcode: '',
    imageUrl: '',
    groupTag: '',
    width: '',
    height: '',
  });

  useEffect(() => {
    // Load inventory items
    const inventoryRef = ref(database, 'inventory');
    const unsubscribeInventory = onValue(inventoryRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const items: InventoryItem[] = Object.keys(data).map(key => ({
          id: key,
          ...data[key],
        }));
        setInventory(items);
      }
    });

    // Load transactions
    const transactionsRef = ref(database, 'inventoryTransactions');
    const unsubscribeTransactions = onValue(transactionsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const txns: InventoryTransaction[] = Object.keys(data).map(key => ({
          id: key,
          ...data[key],
        }));
        setTransactions(txns.sort((a, b) => 
          new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime()
        ));
      }
    });

    // Load inventory groups
    const groupsRef = ref(database, 'inventoryGroups');
    const unsubscribeGroups = onValue(groupsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const groupList: InventoryGroup[] = Object.keys(data).map(key => ({
          id: key,
          ...data[key],
        }));
        setGroups(groupList);
      }
    });

    return () => {
      unsubscribeInventory();
      unsubscribeTransactions();
      unsubscribeGroups();
    };
  }, []);

  const syncFromGoogleSheets = async () => {
    setSyncing(true);
    try {
      const sheetsData = await fetchInventoryFromGoogleSheets();
      
      // Add new data from Google Sheets
      const inventoryRef = ref(database, 'inventory');
      for (const item of sheetsData) {
        // Check if item already exists
        const existingItems = inventory.filter(inv => inv.sku === item.sku);
        
        if (existingItems.length > 0) {
          // Update existing item
          const existingItem = existingItems[0];
          const itemRef = ref(database, `inventory/${existingItem.id}`);
          await set(itemRef, {
            ...existingItem,
            ...item,
            lastUpdated: new Date().toISOString(),
            updatedBy: currentUser?.email || 'admin',
            isActive: true,
          });
        } else {
          const newItemRef = push(inventoryRef);
const cleanItem = Object.fromEntries(
  Object.entries({
    ...item,
    lastUpdated: new Date().toISOString(),
    updatedBy: currentUser?.email || 'admin',
    createdAt: new Date().toISOString(),
    isActive: true,
  }).filter(([_, value]) => value !== undefined)
);

await set(newItemRef, cleanItem);

        }
      }
      
      toast.success(`Synced ${sheetsData.length} items from Google Sheets!`);
    } catch (error) {
      toast.error('Failed to sync from Google Sheets. Check your configuration.');
      console.error('Sync error:', error);
    } finally {
      setSyncing(false);
    }
  };

  const syncToGoogleSheets = async (item: InventoryItem) => {
    try {
      const sheetsItem = {
        sku: item.sku,
        name: item.name,
        description: item.description,
        category: item.category,
        unitType: item.unitType || 'piece',
        pricePerUnit: item.pricePerUnit || item.sellingPrice,
        costPrice: item.costPrice,
        sellingPrice: item.sellingPrice,
        currentStock: item.currentStock,
        minimumStock: item.minimumStock,
        maximumStock: item.maximumStock,
        reorderLevel: item.reorderLevel,
        location: item.location,
        supplier: item.supplier,
        barcode: item.barcode,
        imageUrl: item.imageUrl,
        groupTag: item.groupTag,
        width: item.width,
        height: item.height,
        unit: item.unit
      };
      
      await updateGoogleSheetsInventory(sheetsItem);
      console.log('Successfully synced to Google Sheets');
    } catch (error) {
      console.error('Failed to sync to Google Sheets:', error);
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const itemData = {
        sku: formData.sku,
        name: formData.name,
        description: formData.description,
        category: formData.category,
        unit: formData.unit,
        unitType: formData.unitType,
        costPrice: parseFloat(formData.costPrice),
        sellingPrice: parseFloat(formData.sellingPrice),
        pricePerUnit: parseFloat(formData.pricePerUnit) || parseFloat(formData.sellingPrice),
        currentStock: parseInt(formData.currentStock),
        minimumStock: parseInt(formData.minimumStock),
        maximumStock: parseInt(formData.maximumStock),
        reorderLevel: parseInt(formData.reorderLevel),
        location: formData.location,
        supplier: formData.supplier,
        barcode: formData.barcode,
        lastUpdated: new Date().toISOString(),
        updatedBy: currentUser?.email || 'admin',
        isActive: true,
        imageUrl: formData.imageUrl || '',
        groupTag: formData.groupTag || '',
        width: parseFloat(formData.width) || undefined,
        height: parseFloat(formData.height) || undefined,
        ...(editingItem ? {} : { createdAt: new Date().toISOString() }),
      };

      if (editingItem) {
        const itemRef = ref(database, `inventory/${editingItem.id}`);
        await set(itemRef, itemData);
        // Sync to Google Sheets
        await syncToGoogleSheets({ ...editingItem, ...itemData });
        toast.success('Inventory item updated successfully!');
      } else {
        const inventoryRef = ref(database, 'inventory');
        const newItemRef = push(inventoryRef);
        await set(newItemRef, itemData);
        // Sync to Google Sheets
        await syncToGoogleSheets({ id: newItemRef.key!, ...itemData } as InventoryItem);
        toast.success('Inventory item added successfully!');
      }

      resetForm();
    } catch (error) {
      toast.error('Failed to save inventory item');
      console.error('Error saving inventory item:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      sku: item.sku,
      name: item.name,
      description: item.description,
      category: item.category,
      unit: item.unit,
      unitType: item.unitType || 'piece',
      costPrice: item.costPrice.toString(),
      sellingPrice: item.sellingPrice.toString(),
      pricePerUnit: (item.pricePerUnit || item.sellingPrice).toString(),
      currentStock: item.currentStock.toString(),
      minimumStock: item.minimumStock.toString(),
      maximumStock: item.maximumStock.toString(),
      reorderLevel: item.reorderLevel.toString(),
      location: item.location,
      supplier: item.supplier,
      barcode: item.barcode || '',
      imageUrl: item.imageUrl || '',
      groupTag: item.groupTag || '',
      width: item.width?.toString() || '',
      height: item.height?.toString() || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (itemId: string) => {
    if (confirm('Are you sure you want to delete this inventory item?')) {
      try {
        const itemRef = ref(database, `inventory/${itemId}`);
        await remove(itemRef);
        toast.success('Inventory item deleted successfully!');
      } catch (error) {
        toast.error('Failed to delete inventory item');
        console.error('Error deleting inventory item:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      sku: '',
      name: '',
      description: '',
      category: '',
      unit: 'pcs',
      unitType: 'piece',
      costPrice: '',
      sellingPrice: '',
      pricePerUnit: '',
      currentStock: '',
      minimumStock: '',
      maximumStock: '',
      reorderLevel: '',
      location: '',
      supplier: '',
      barcode: '',
      imageUrl: '',
      groupTag: '',
      width: '',
      height: '',
    });
    setEditingItem(null);
    setShowForm(false);
  };

  const exportToCSV = () => {
    const headers = [
      'SKU', 'Name', 'Description', 'Category', 'Unit', 'Cost Price', 
      'Selling Price', 'Current Stock', 'Minimum Stock', 'Maximum Stock',
      'Reorder Level', 'Location', 'Supplier', 'Barcode'
    ];
    
    const csvContent = [
      headers.join(','),
      ...inventory.map(item => [
        item.sku, item.name, item.description, item.category, item.unit,
        item.costPrice, item.sellingPrice, item.currentStock, item.minimumStock,
        item.maximumStock, item.reorderLevel, item.location, item.supplier, item.barcode || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (item.sku || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesGroup = groupFilter === 'all' || item.groupTag === groupFilter;
    return matchesSearch && matchesCategory && matchesGroup;
  });

  const categories = Array.from(new Set(inventory.map(item => item.category)));
  const groupTags = Array.from(new Set(inventory.map(item => item.groupTag).filter(Boolean)));
  const lowStockItems = inventory.filter(item => item.currentStock <= item.reorderLevel);

  const tabs = [
    { id: 'items', label: 'Inventory Items', icon: Package },
    { id: 'transactions', label: 'Transaction History', icon: FileText },
    { id: 'groups', label: 'Inventory Groups', icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Inventory Management</h2>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={syncFromGoogleSheets}
            disabled={syncing}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync from Google Sheets'}
          </button>
          <a
            href="https://docs.google.com/spreadsheets"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open Google Sheets
          </a>
          <button
            onClick={exportToCSV}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </button>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
            <h3 className="text-lg font-medium text-yellow-800">Low Stock Alert</h3>
          </div>
          <p className="text-yellow-700 mt-1">
            {lowStockItems.length} items are at or below reorder level
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors flex items-center ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'items' && (
        <>
          {/* Search and Filter */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Groups</option>
              {groupTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>

          {/* Inventory Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pricing
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredInventory.map((item) => (
                    <tr key={item.id} className={item.currentStock <= item.reorderLevel ? 'bg-yellow-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          {item.imageUrl && (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-12 h-12 object-cover rounded mt-2"
                            />
                          )}
                          <div className="text-sm text-gray-500">SKU: {item.sku}</div>
                          <div className="text-sm text-gray-500">{item.category}</div>
                          {item.groupTag && (
                            <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full mt-1">
                              {item.groupTag}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {item.currentStock} {item.unit}
                        </div>
                        <div className="text-sm text-gray-500">
                          Min: {item.minimumStock} | Reorder: {item.reorderLevel}
                        </div>
                        {item.width && item.height && (
                          <div className="text-sm text-gray-500">
                            Dimensions: {item.width} × {item.height} {item.unitType}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">₹{item.pricePerUnit || item.sellingPrice}</div>
                        <div className="text-sm text-gray-500">per {item.unitType || item.unit}</div>
                        <div className="text-sm text-gray-500">Cost: ₹{item.costPrice}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.location}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 hover:text-red-900 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'transactions' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performed By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => {
                  const item = inventory.find(i => i.id === transaction.inventoryItemId);
                  return (
                    <tr key={transaction.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(transaction.performedAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item?.name || 'Unknown Item'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          transaction.type === 'purchase' ? 'bg-green-100 text-green-800' :
                          transaction.type === 'sale' ? 'bg-blue-100 text-blue-800' :
                          transaction.type === 'damage' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {transaction.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          {transaction.type === 'purchase' || transaction.type === 'return' ? (
                            <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                          )}
                          {transaction.quantity}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.performedBy}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {transaction.reason}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Item Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Type</label>
                  <select
                    value={formData.unitType}
                    onChange={(e) => setFormData({ ...formData, unitType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="piece">Pieces</option>
                    <option value="sqft">Square Feet</option>
                    <option value="meter">Square Meter</option>
                    <option value="kg">Kilograms</option>
                    <option value="liter">Liters</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price per Unit (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.pricePerUnit}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      pricePerUnit: e.target.value,
                      sellingPrice: e.target.value 
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock *</label>
                  <input
                    type="number"
                    required
                    value={formData.currentStock}
                    onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock</label>
                  <input
                    type="number"
                    value={formData.minimumStock}
                    onChange={(e) => setFormData({ ...formData, minimumStock: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Stock</label>
                  <input
                    type="number"
                    value={formData.maximumStock}
                    onChange={(e) => setFormData({ ...formData, maximumStock: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
                  <input
                    type="number"
                    value={formData.reorderLevel}
                    onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Group Tag</label>
                  <input
                    type="text"
                    value={formData.groupTag}
                    onChange={(e) => setFormData({ ...formData, groupTag: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Premium, Budget, Luxury"
                  />
                </div>
              </div>

              {(formData.unitType === 'sqft' || formData.unitType === 'meter') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Width ({formData.unitType === 'sqft' ? 'ft' : 'm'})
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.width}
                      onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Width"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Height ({formData.unitType === 'sqft' ? 'ft' : 'm'})
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.height}
                      onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Height"
                    />
                  </div>
                </div>
              )}

              <div className="flex space-x-4 pt-4">
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
                  {loading ? 'Saving...' : editingItem ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManagement;