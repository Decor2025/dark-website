import React, { useState, useEffect } from 'react';
import { ref, onValue, push, set } from 'firebase/database';
import { database } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { InventoryItem, InventoryTransaction, Message } from '../../types';
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
  Filter
} from 'lucide-react';
import toast from 'react-hot-toast';

const EmployeeDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(false);
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
        setInventory(items.filter(item => item.isActive));
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
      unsubscribeInventory();
      unsubscribeTransactions();
      unsubscribeMessages();
    };
  }, [currentUser]);

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
      const inventoryRef = ref(database, `inventory/${selectedItem.id}`);
      await set(inventoryRef, {
        ...selectedItem,
        currentStock: newStock,
        lastUpdated: new Date().toISOString(),
        updatedBy: currentUser?.email || 'employee',
      });

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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const messagesRef = ref(database, 'messages');
      await push(messagesRef, {
        fromUserId: currentUser?.uid || '',
        toUserId: messageForm.toUserId,
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
    { id: 'inventory', label: 'Inventory Audit', icon: Package },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 p-6 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 text-sm font-medium">Today's Transactions</p>
                    <p className="text-2xl font-bold text-blue-900">{todayTransactions.length}</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              
              <div className="bg-yellow-50 p-6 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-600 text-sm font-medium">Low Stock Items</p>
                    <p className="text-2xl font-bold text-yellow-900">{lowStockItems.length}</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-yellow-600" />
                </div>
              </div>

              <div className="bg-green-50 p-6 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 text-sm font-medium">Total Items</p>
                    <p className="text-2xl font-bold text-green-900">{inventory.length}</p>
                  </div>
                  <Package className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Date & Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Item
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Reason
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.slice(0, 10).map((transaction) => {
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
                              {['purchase', 'return'].includes(transaction.type) ? (
                                <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                              ) : (
                                <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                              )}
                              {transaction.quantity}
                            </div>
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
          </div>
        );

      case 'inventory':
        return (
          <div className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
              <h3 className="text-lg font-semibold">Inventory Audit</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Low Stock Alert */}
            {lowStockItems.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                  <h4 className="text-lg font-medium text-yellow-800">Low Stock Alert</h4>
                </div>
                <p className="text-yellow-700 mt-1">
                  {lowStockItems.length} items need attention
                </p>
              </div>
            )}

            {/* Inventory Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredInventory.map((item) => (
                <div 
                  key={item.id} 
                  className={`bg-white rounded-lg shadow-md p-6 ${
                    item.currentStock <= item.reorderLevel ? 'border-l-4 border-yellow-500' : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{item.name}</h4>
                      <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                      <p className="text-sm text-gray-500">{item.category}</p>
                    </div>
                    {item.currentStock <= item.reorderLevel && (
                      <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    )}
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Current Stock:</span>
                      <span className="text-sm font-medium">{item.currentStock} {item.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Reorder Level:</span>
                      <span className="text-sm">{item.reorderLevel} {item.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Location:</span>
                      <span className="text-sm">{item.location}</span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedItem(item);
                        setAuditForm({ ...auditForm, type: 'purchase' });
                        setShowAuditModal(true);
                      }}
                      className="flex-1 bg-green-100 hover:bg-green-200 text-green-700 py-2 px-3 rounded-lg font-medium transition-colors flex items-center justify-center"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setSelectedItem(item);
                        setAuditForm({ ...auditForm, type: 'sale' });
                        setShowAuditModal(true);
                      }}
                      className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 py-2 px-3 rounded-lg font-medium transition-colors flex items-center justify-center"
                    >
                      <Minus className="w-4 h-4 mr-1" />
                      Reduce
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'messages':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Messages</h3>
              <button
                onClick={() => setShowMessageModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
              >
                <Send className="w-4 h-4 mr-2" />
                New Message
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-md">
              {messages.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h4>
                  <p className="text-gray-600">Start a conversation with your team</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {messages.map((message) => (
                    <div key={message.id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="text-sm font-medium text-gray-900">
                              {message.subject}
                            </h4>
                            {!message.isRead && message.toUserId === currentUser?.uid && (
                              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                New
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{message.content}</p>
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
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-2xl font-bold mb-4">My Profile</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={currentUser?.email || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <input
                  type="text"
                  value={currentUser?.role || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Member Since</label>
                <input
                  type="text"
                  value={currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString() : ''}
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
      <div className="flex flex-col lg:flex-row">
        {/* Sidebar */}
        <div className="w-full lg:w-64 bg-white shadow-lg">
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
                <span className="hidden lg:block">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 lg:p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 capitalize">{activeTab}</h1>
          </div>
          {renderContent()}
        </div>
      </div>

      {/* Stock Audit Modal */}
      {showAuditModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div className="flex space-x-4 pt-4">
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
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Update Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Send Message</h3>
            
            <form onSubmit={handleSendMessage} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To (Admin)
                </label>
                <input
                  type="text"
                  value="admin"
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  required
                  value={messageForm.subject}
                  onChange={(e) => setMessageForm({ ...messageForm, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowMessageModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
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