import React, { useState, useEffect } from 'react';
import { ref, onValue, push, set } from 'firebase/database';
import { database } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { InventoryItem, InventoryTransaction, Message, Employee } from '../../types';
import { updateGoogleSheetsInventory, addToGoogleSheets } from '../../config/googleSheets';
import { 
  BarChart3, 
  Package, 
  User, 
  Plus, 
  Minus, 
  MessageSquare,
  Send,
  Eye,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  Save,
  RefreshCw,
  Menu,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

const EmployeeDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser } = useAuth();

  const [auditForm, setAuditForm] = useState({
    type: 'adjustment' as 'purchase' | 'sale' | 'adjustment' | 'damage' | 'return',
    quantity: '',
    reason: '',
    reference: '',
    notes: '',
  });

  const [messageForm, setMessageForm] = useState({
    toUserId: '',
    subject: '',
    content: '',
  });

  const [newItemForm, setNewItemForm] = useState({
    sku: '',
    name: '',
    description: '',
    category: '',
    unitType: 'piece' as 'sqft' | 'meter' | 'piece' | 'kg' | 'liter',
    pricePerUnit: '',
    costPrice: '',
    sellingPrice: '',
    currentStock: '',
    minimumStock: '',
    reorderLevel: '',
    location: '',
    supplier: '',
    imageUrl: '',
    groupTag: '',
    width: '',
    height: '',
  });

  useEffect(() => {
    if (!currentUser) return;

    // Load employee data
    const employeesRef = ref(database, 'employees');
    const unsubscribeEmployee = onValue(employeesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const employeeData = Object.values(data).find((emp: any) => emp.userId === currentUser.uid) as Employee;
        setEmployee(employeeData);
      }
    });

    // Load inventory items (filtered by employee's assigned stock groups)
    const inventoryRef = ref(database, 'inventory');
    const unsubscribeInventory = onValue(inventoryRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const items: InventoryItem[] = Object.keys(data).map(key => ({
          id: key,
          ...data[key],
        }));
        
        // Filter items based on employee's assigned stock groups
        let filteredItems = items.filter(item => item.isActive);
        if (employee?.assignedStockGroups?.length) {
          // TODO: Filter based on stock group categories
          // For now, show all items
        }
        
        setInventory(filteredItems);
      }
    });

    // Load transactions for this employee
    const transactionsRef = ref(database, 'inventoryTransactions');
    const unsubscribeTransactions = onValue(transactionsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const txns: InventoryTransaction[] = Object.keys(data)
          .map(key => ({ id: key, ...data[key] }))
          .filter(txn => txn.performedBy === currentUser?.email)
          .sort((a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime());
        setTransactions(txns);
      }
    });

    // Load messages
    const messagesRef = ref(database, 'messages');
    const unsubscribeMessages = onValue(messagesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const msgs: Message[] = Object.keys(data)
          .map(key => ({ id: key, ...data[key] }))
          .filter(msg => msg.toUserId === currentUser?.uid || msg.fromUserId === currentUser?.uid)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setMessages(msgs);
      }
    });

    return () => {
      unsubscribeEmployee();
      unsubscribeInventory();
      unsubscribeTransactions();
      unsubscribeMessages();
    };
  }, [currentUser, employee?.assignedStockGroups]);

  const handleStockAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    setLoading(true);
    try {
      const quantity = parseInt(auditForm.quantity);
      const isIncrease = ['purchase', 'return'].includes(auditForm.type);
      const newStock = isIncrease 
        ? selectedItem.currentStock + quantity 
        : selectedItem.currentStock - quantity;

      if (newStock < 0) {
        toast.error('Insufficient stock for this operation');
        return;
      }

      // Create transaction record
      const transactionRef = ref(database, 'inventoryTransactions');
      await push(transactionRef, {
        inventoryItemId: selectedItem.id,
        type: auditForm.type,
        quantity: quantity,
        previousStock: selectedItem.currentStock,
        newStock: newStock,
        reason: auditForm.reason,
        reference: auditForm.reference,
        notes: auditForm.notes,
        performedBy: currentUser?.email || 'employee',
        performedAt: new Date().toISOString(),
      });

      // Update inventory stock
      const updatedItem = {
        ...selectedItem,
        currentStock: newStock,
        lastUpdated: new Date().toISOString(),
        updatedBy: currentUser?.email || 'employee',
      };

      const inventoryRef = ref(database, `inventory/${selectedItem.id}`);
      await set(inventoryRef, updatedItem);

      // Sync to Google Sheets
      try {
        await updateGoogleSheetsInventory({
          sku: updatedItem.sku,
          name: updatedItem.name,
          description: updatedItem.description,
          category: updatedItem.category,
          unitType: updatedItem.unitType || 'piece',
          pricePerUnit: updatedItem.pricePerUnit || updatedItem.sellingPrice,
          costPrice: updatedItem.costPrice,
          sellingPrice: updatedItem.sellingPrice,
          currentStock: updatedItem.currentStock,
          minimumStock: updatedItem.minimumStock,
          maximumStock: updatedItem.maximumStock,
          reorderLevel: updatedItem.reorderLevel,
          location: updatedItem.location,
          supplier: updatedItem.supplier,
          barcode: updatedItem.barcode,
          imageUrl: updatedItem.imageUrl,
          groupTag: updatedItem.groupTag,
          width: updatedItem.width,
          height: updatedItem.height,
          unit: updatedItem.unit
        });
      } catch (sheetsError) {
        console.warn('Failed to sync to Google Sheets:', sheetsError);
      }

      toast.success('Stock updated successfully!');
      setShowAuditModal(false);
      setAuditForm({
        type: 'adjustment',
        quantity: '',
        reason: '',
        reference: '',
        notes: '',
      });
      setSelectedItem(null);
    } catch (error) {
      toast.error('Failed to update stock');
      console.error('Error updating stock:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const itemData = {
        sku: newItemForm.sku,
        name: newItemForm.name,
        description: newItemForm.description,
        category: newItemForm.category,
        unit: newItemForm.unitType,
        unitType: newItemForm.unitType,
        costPrice: parseFloat(newItemForm.costPrice),
        sellingPrice: parseFloat(newItemForm.sellingPrice),
        pricePerUnit: parseFloat(newItemForm.pricePerUnit) || parseFloat(newItemForm.sellingPrice),
        currentStock: parseInt(newItemForm.currentStock),
        minimumStock: parseInt(newItemForm.minimumStock),
        maximumStock: 1000,
        reorderLevel: parseInt(newItemForm.reorderLevel),
        location: newItemForm.location,
        supplier: newItemForm.supplier,
        imageUrl: newItemForm.imageUrl,
        groupTag: newItemForm.groupTag,
        width: parseFloat(newItemForm.width) || undefined,
        height: parseFloat(newItemForm.height) || undefined,
        lastUpdated: new Date().toISOString(),
        updatedBy: currentUser?.email || 'employee',
        createdAt: new Date().toISOString(),
        isActive: true,
      };

      // Add to Firebase
      const inventoryRef = ref(database, 'inventory');
      const newItemRef = push(inventoryRef);
      await set(newItemRef, itemData);

      // Sync to Google Sheets
      try {
        await addToGoogleSheets({
          sku: itemData.sku,
          name: itemData.name,
          description: itemData.description,
          category: itemData.category,
          unitType: itemData.unitType,
          pricePerUnit: itemData.pricePerUnit,
          costPrice: itemData.costPrice,
          sellingPrice: itemData.sellingPrice,
          currentStock: itemData.currentStock,
          minimumStock: itemData.minimumStock,
          maximumStock: itemData.maximumStock,
          reorderLevel: itemData.reorderLevel,
          location: itemData.location,
          supplier: itemData.supplier,
          barcode: '',
          imageUrl: itemData.imageUrl,
          groupTag: itemData.groupTag,
          width: itemData.width,
          height: itemData.height,
          unit: itemData.unit
        });
      } catch (sheetsError) {
        console.warn('Failed to sync to Google Sheets:', sheetsError);
      }

      toast.success('Item added successfully!');
      setShowAddItemModal(false);
      setNewItemForm({
        sku: '',
        name: '',
        description: '',
        category: '',
        unitType: 'piece',
        pricePerUnit: '',
        costPrice: '',
        sellingPrice: '',
        currentStock: '',
        minimumStock: '',
        reorderLevel: '',
        location: '',
        supplier: '',
        imageUrl: '',
        groupTag: '',
        width: '',
        height: '',
      });
    } catch (error) {
      toast.error('Failed to add item');
      console.error('Error adding item:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const messagesRef = ref(database, 'messages');
      await push(messagesRef, {
        fromUserId: currentUser?.uid || '',
        toUserId: 'admin', // Send to admin
        subject: messageForm.subject,
        content: messageForm.content,
        isRead: false,
        createdAt: new Date().toISOString(),
      });

      toast.success('Message sent successfully!');
      setShowMessageModal(false);
      setMessageForm({ toUserId: '', subject: '', content: '' });
    } catch (error) {
      toast.error('Failed to send message');
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lowStockItems = inventory.filter(item => item.currentStock <= item.reorderLevel);
  const todayTransactions = transactions.filter(txn => 
    new Date(txn.performedAt).toDateString() === new Date().toDateString()
  );

  const employeeTabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-blue-50 p-4 sm:p-6 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 text-sm font-medium">Today's Transactions</p>
                    <p className="text-xl sm:text-2xl font-bold text-blue-900">{todayTransactions.length}</p>
                  </div>
                  <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                </div>
              </div>
              
              <div className="bg-yellow-50 p-4 sm:p-6 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-600 text-sm font-medium">Low Stock Items</p>
                    <p className="text-xl sm:text-2xl font-bold text-yellow-900">{lowStockItems.length}</p>
                  </div>
                  <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600" />
                </div>
              </div>

              <div className="bg-green-50 p-4 sm:p-6 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 text-sm font-medium">Managed Items</p>
                    <p className="text-xl sm:text-2xl font-bold text-green-900">{inventory.length}</p>
                  </div>
                  <Package className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
                </div>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-4 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item
                      </th>
                      <th className="px-4 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-4 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reason
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.slice(0, 10).map((transaction) => {
                      const item = inventory.find(i => i.id === transaction.inventoryItemId);
                      return (
                        <tr key={transaction.id}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {new Date(transaction.performedAt).toLocaleDateString()}
                            <span className="block text-xs text-gray-500">
                              {new Date(transaction.performedAt).toLocaleTimeString()}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {item?.name || 'Unknown Item'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              transaction.type === 'purchase' ? 'bg-green-100 text-green-800' :
                              transaction.type === 'sale' ? 'bg-blue-100 text-blue-800' :
                              transaction.type === 'damage' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {transaction.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center">
                              {['purchase', 'return'].includes(transaction.type) ? (
                                <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                              ) : (
                                <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                              )}
                              {transaction.quantity}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {transaction.reason}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'inventory':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <h3 className="text-lg font-semibold">Inventory Management</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowAddItemModal(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
                >
                  <Plus className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Add Item</span>
                </button>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                  <input
                    type="text"
                    placeholder="Search items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                  />
                </div>
              </div>
            </div>

            {/* Low Stock Alert */}
            {lowStockItems.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
                <div className="flex items-center">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 mr-2" />
                  <h4 className="text-base sm:text-lg font-medium text-yellow-800">Low Stock Alert</h4>
                </div>
                <p className="text-yellow-700 mt-1 text-sm">
                  {lowStockItems.length} items need attention
                </p>
              </div>
            )}

            {/* Inventory Grid */}
            {filteredInventory.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No inventory items found</h4>
                <p className="text-gray-600">Try changing your search or add a new item</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredInventory.map((item) => (
                  <div 
                    key={item.id} 
                    className={`bg-white rounded-lg shadow-md p-4 sm:p-6 ${
                      item.currentStock <= item.reorderLevel ? 'border-l-4 border-yellow-500' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h4 className="text-base sm:text-lg font-semibold text-gray-900">{item.name}</h4>
                        <p className="text-xs sm:text-sm text-gray-500">SKU: {item.sku}</p>
                        <p className="text-xs sm:text-sm text-gray-500">{item.category}</p>
                        {item.groupTag && (
                          <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full mt-1">
                            {item.groupTag}
                          </span>
                        )}
                      </div>
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg ml-2 sm:ml-4"
                        />
                      )}
                      {item.currentStock <= item.reorderLevel && (
                        <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 ml-1 sm:ml-2" />
                      )}
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between">
                        <span className="text-xs sm:text-sm text-gray-600">Current Stock:</span>
                        <span className="text-xs sm:text-sm font-medium">{item.currentStock} {item.unit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs sm:text-sm text-gray-600">Reorder Level:</span>
                        <span className="text-xs sm:text-sm">{item.reorderLevel} {item.unit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs sm:text-sm text-gray-600">Price per {item.unitType}:</span>
                        <span className="text-xs sm:text-sm font-medium">₹{item.pricePerUnit || item.sellingPrice}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs sm:text-sm text-gray-600">Location:</span>
                        <span className="text-xs sm:text-sm">{item.location}</span>
                      </div>
                      {item.width && item.height && (
                        <div className="flex justify-between">
                          <span className="text-xs sm:text-sm text-gray-600">Dimensions:</span>
                          <span className="text-xs sm:text-sm">{item.width} × {item.height} {item.unitType}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setAuditForm({ ...auditForm, type: 'purchase' });
                          setShowAuditModal(true);
                        }}
                        className="flex-1 bg-green-100 hover:bg-green-200 text-green-700 py-2 px-2 sm:px-3 rounded-lg font-medium transition-colors flex items-center justify-center text-sm"
                      >
                        <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        <span>Add</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setAuditForm({ ...auditForm, type: 'sale' });
                          setShowAuditModal(true);
                        }}
                        className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 py-2 px-2 sm:px-3 rounded-lg font-medium transition-colors flex items-center justify-center text-sm"
                      >
                        <Minus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        <span>Reduce</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'messages':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <h3 className="text-lg font-semibold">Messages</h3>
              <button
                onClick={() => setShowMessageModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                <Send className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">New Message</span>
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-md">
              {messages.length === 0 ? (
                <div className="p-6 sm:p-8 text-center">
                  <MessageSquare className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h4>
                  <p className="text-gray-600">Start a conversation with your team</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {messages.map((message) => (
                    <div key={message.id} className="p-4 sm:p-6 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 mb-2">
                            <h4 className="text-sm font-medium text-gray-900">
                              {message.subject}
                            </h4>
                            {!message.isRead && message.toUserId === currentUser?.uid && (
                              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mt-1 sm:mt-0">
                                New
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{message.content}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(message.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <button className="text-gray-400 hover:text-gray-600">
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
            <h3 className="text-xl sm:text-2xl font-bold mb-4">My Profile</h3>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={employee?.name || currentUser?.displayName || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm sm:text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={currentUser?.email || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm sm:text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                <input
                  type="text"
                  value={employee?.employeeId || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm sm:text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input
                  type="text"
                  value={employee?.department || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm sm:text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                <input
                  type="text"
                  value={employee?.position || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm sm:text-base"
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
      {/* Mobile Header */}
      <div className="lg:hidden bg-white shadow-sm p-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-700 focus:outline-none"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <h1 className="text-xl font-bold text-gray-900 capitalize">{activeTab}</h1>
        </div>
        <div className="flex items-center">
          {activeTab === 'inventory' && (
            <button
              onClick={() => setShowAddItemModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg font-medium transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
          {activeTab === 'messages' && (
            <button
              onClick={() => setShowMessageModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg font-medium transition-colors ml-2"
            >
              <Send className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Sidebar - Mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" 
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <div 
          className={`fixed lg:relative inset-y-0 left-0 w-64 bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="p-4 sm:p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900">Employee Dashboard</h2>
            <p className="text-sm text-gray-600 truncate">{employee?.name || currentUser?.email}</p>
            <p className="text-xs text-gray-500 truncate">{employee?.position}</p>
          </div>
          
          <nav className="p-3 sm:p-4">
            {employeeTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="text-sm">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-3 sm:p-4 md:p-6">
          <div className="hidden lg:block mb-4 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 capitalize">{activeTab}</h1>
          </div>
          {renderContent()}
        </div>
      </div>

      {/* Stock Audit Modal */}
      {showAuditModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-4 sm:p-6">
            <h3 className="text-lg font-semibold mb-4">
              Stock Audit - {selectedItem.name}
            </h3>
            
            <form onSubmit={handleStockAudit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction Type
                </label>
                <select
                  value={auditForm.type}
                  onChange={(e) => setAuditForm({ ...auditForm, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                >
                  <option value="purchase">Purchase/Received</option>
                  <option value="sale">Sale/Issued</option>
                  <option value="adjustment">Stock Adjustment</option>
                  <option value="damage">Damage/Loss</option>
                  <option value="return">Return</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={auditForm.quantity}
                  onChange={(e) => setAuditForm({ ...auditForm, quantity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Current stock: {selectedItem.currentStock} {selectedItem.unit}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason *
                </label>
                <input
                  type="text"
                  required
                  value={auditForm.reason}
                  onChange={(e) => setAuditForm({ ...auditForm, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  placeholder="e.g., Customer order, Damaged goods, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reference (Optional)
                </label>
                <input
                  type="text"
                  value={auditForm.reference}
                  onChange={(e) => setAuditForm({ ...auditForm, reference: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  placeholder="Order number, invoice, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={auditForm.notes}
                  onChange={(e) => setAuditForm({ ...auditForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  rows={3}
                />
              </div>

              <div className="flex space-x-3 sm:space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAuditModal(false);
                    setSelectedItem(null);
                    setAuditForm({
                      type: 'adjustment',
                      quantity: '',
                      reason: '',
                      reference: '',
                      notes: '',
                    });
                  }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-3 sm:px-4 rounded-lg font-medium transition-colors text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 sm:px-4 rounded-lg font-medium transition-colors disabled:opacity-50 text-sm sm:text-base"
                >
                  {loading ? 'Processing...' : 'Update Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Item Modal */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full my-4 sm:my-8 p-4 sm:p-6">
            <h3 className="text-lg font-semibold mb-4">Add New Inventory Item</h3>
            
            <form onSubmit={handleAddNewItem} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
                  <input
                    type="text"
                    required
                    value={newItemForm.sku}
                    onChange={(e) => setNewItemForm({ ...newItemForm, sku: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    value={newItemForm.name}
                    onChange={(e) => setNewItemForm({ ...newItemForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newItemForm.description}
                  onChange={(e) => setNewItemForm({ ...newItemForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <input
                    type="text"
                    required
                    value={newItemForm.category}
                    onChange={(e) => setNewItemForm({ ...newItemForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Type</label>
                  <select
                    value={newItemForm.unitType}
                    onChange={(e) => setNewItemForm({ ...newItemForm, unitType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
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
                    value={newItemForm.location}
                    onChange={(e) => setNewItemForm({ ...newItemForm, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newItemForm.costPrice}
                    onChange={(e) => setNewItemForm({ ...newItemForm, costPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price per Unit (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newItemForm.pricePerUnit}
                    onChange={(e) => setNewItemForm({ 
                      ...newItemForm, 
                      pricePerUnit: e.target.value,
                      sellingPrice: e.target.value 
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock *</label>
                  <input
                    type="number"
                    required
                    value={newItemForm.currentStock}
                    onChange={(e) => setNewItemForm({ ...newItemForm, currentStock: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock</label>
                  <input
                    type="number"
                    value={newItemForm.minimumStock}
                    onChange={(e) => setNewItemForm({ ...newItemForm, minimumStock: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
                  <input
                    type="number"
                    value={newItemForm.reorderLevel}
                    onChange={(e) => setNewItemForm({ ...newItemForm, reorderLevel: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                  <input
                    type="text"
                    value={newItemForm.supplier}
                    onChange={(e) => setNewItemForm({ ...newItemForm, supplier: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Group Tag</label>
                  <input
                    type="text"
                    value={newItemForm.groupTag}
                    onChange={(e) => setNewItemForm({ ...newItemForm, groupTag: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                    placeholder="e.g., Premium, Budget, Luxury"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                <input
                  type="url"
                  value={newItemForm.imageUrl}
                  onChange={(e) => setNewItemForm({ ...newItemForm, imageUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              {(newItemForm.unitType === 'sqft' || newItemForm.unitType === 'meter') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Width ({newItemForm.unitType === 'sqft' ? 'ft' : 'm'})
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={newItemForm.width}
                      onChange={(e) => setNewItemForm({ ...newItemForm, width: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Height ({newItemForm.unitType === 'sqft' ? 'ft' : 'm'})
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={newItemForm.height}
                      onChange={(e) => setNewItemForm({ ...newItemForm, height: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                    />
                  </div>
                </div>
              )}

              <div className="flex space-x-3 sm:space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddItemModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-3 sm:px-4 rounded-lg font-medium transition-colors text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 sm:px-4 rounded-lg font-medium transition-colors disabled:opacity-50 text-sm sm:text-base flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Add Item
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-4 sm:p-6">
            <h3 className="text-lg font-semibold mb-4">Send Message to Admin</h3>
            
            <form onSubmit={handleSendMessage} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  required
                  value={messageForm.subject}
                  onChange={(e) => setMessageForm({ ...messageForm, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  required
                  rows={4}
                  value={messageForm.content}
                  onChange={(e) => setMessageForm({ ...messageForm, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                />
              </div>

              <div className="flex space-x-3 sm:space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowMessageModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-3 sm:px-4 rounded-lg font-medium transition-colors text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 sm:px-4 rounded-lg font-medium transition-colors disabled:opacity-50 text-sm sm:text-base"
                >
                  {loading ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;