import React, { useState } from 'react';
import { ref, onValue, push } from 'firebase/database';
import { database } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { InventoryItem, Quotation, QuotationItem } from '../types';
import { formatCurrency } from '../config/razorpay';
import { Calculator, Send, Plus, Trash2, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const Estimate: React.FC = () => {
  const { currentUser } = useAuth();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [selectedItems, setSelectedItems] = useState<QuotationItem[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    description: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [dimensionInputs, setDimensionInputs] = useState<{[key: string]: {width: string, height: string}}>({});

  React.useEffect(() => {
    const inventoryRef = ref(database, 'inventory');
    const unsubscribe = onValue(inventoryRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const inventoryList: InventoryItem[] = Object.keys(data)
          .map(key => ({ id: key, ...data[key] }))
          .filter(item => item.isActive && item.currentStock > 0);
        setInventory(inventoryList);
      }
    });
    return () => unsubscribe();
  }, []);

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addItemToQuotation = (item: InventoryItem) => {
    const existingItem = selectedItems.find(si => si.inventoryItemId === item.id);
    if (existingItem) {
      setSelectedItems(selectedItems.map(si =>
        si.inventoryItemId === item.id
          ? { ...si, quantity: si.quantity + 1, total: calculateItemTotal(si, si.quantity + 1) }
          : si
      ));
    } else {
      const newItem: QuotationItem = {
        id: Date.now().toString(),
        inventoryItemId: item.id,
        name: item.name,
        description: item.description,
        quantity: 1,
        unitPrice: item.sellingPrice,
        pricePerUnit: item.pricePerUnit || item.sellingPrice,
        unitType: item.unitType || 'piece',
        width: item.width,
        height: item.height,
        area: item.width && item.height ? item.width * item.height : undefined,
        total: calculateItemTotal({
          pricePerUnit: item.pricePerUnit || item.sellingPrice,
          unitType: item.unitType || 'piece',
          width: item.width,
          height: item.height
        } as any, 1),
      };
      setSelectedItems([...selectedItems, newItem]);
    }
    setShowProductSearch(false);
    setSearchQuery('');
  };

  const calculateItemTotal = (item: QuotationItem, quantity: number, customWidth?: number, customHeight?: number) => {
    const width = customWidth || item.width || 1;
    const height = customHeight || item.height || 1;
    
    if (item.unitType === 'sqft' || item.unitType === 'meter') {
      const area = width * height;
      return quantity * area * item.pricePerUnit;
    } else {
      return quantity * item.unitPrice;
    }
  };

  const updateItemDimensions = (itemId: string, width: number, height: number) => {
    setSelectedItems(selectedItems.map(item =>
      item.id === itemId
        ? { 
            ...item, 
            width, 
            height, 
            area: width * height,
            total: calculateItemTotal(item, item.quantity, width, height)
          }
        : item
    ));
  };
  const updateItemQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setSelectedItems(selectedItems.filter(item => item.id !== itemId));
    } else {
      setSelectedItems(selectedItems.map(item =>
        item.id === itemId
          ? { ...item, quantity, total: calculateItemTotal(item, quantity) }
          : item
      ));
    }
  };

  const removeItem = (itemId: string) => {
    setSelectedItems(selectedItems.filter(item => item.id !== itemId));
  };

  const calculateTotals = () => {
    const subtotal = selectedItems.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.18; // 18% GST
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      toast.error('Please add at least one item to the quotation');
      return;
    }

    if (!currentUser) {
      toast.error('Please login to submit a quotation request');
      return;
    }

    setLoading(true);
    try {
      const { subtotal, tax, total } = calculateTotals();
      
      const quotationData: Omit<Quotation, 'id'> = {
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        description: formData.description,
        items: selectedItems,
        subtotal,
        tax,
        discount: 0,
        total,
        status: 'draft',
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        notes: formData.notes,
        createdBy: currentUser.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        paymentStatus: 'pending',
      };

      const quotationsRef = ref(database, 'quotations');
      await push(quotationsRef, quotationData);

      toast.success('Quotation request sent successfully! We\'ll contact you within 24 hours.');
      setFormData({
        name: '',
        email: '',
        phone: '',
        description: '',
        notes: '',
      });
      setSelectedItems([]);
    } catch (error) {
      toast.error('Failed to send quotation request');
      console.error('Error submitting quotation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const { subtotal, tax, total } = calculateTotals();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calculator className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Get Your Estimate</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Select products from our inventory and we'll provide you with a detailed quotation within 24 hours.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+91 9876543210"
                />
              </div>
            </div>

            {/* Product Selection */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Select Products</h3>
                <button
                  type="button"
                  onClick={() => setShowProductSearch(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </button>
              </div>

              {selectedItems.length > 0 ? (
                <div className="space-y-4">
                  {selectedItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        <p className="text-sm text-gray-600">{item.description}</p>
                        <p className="text-sm font-medium text-blue-600">
                          {formatCurrency(item.pricePerUnit)} per {item.unitType}
                        </p>
                        {(item.unitType === 'sqft' || item.unitType === 'meter') && (
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs text-gray-500">Width ({item.unitType === 'sqft' ? 'ft' : 'm'})</label>
                              <input
                                type="number"
                                step="0.1"
                                value={item.width || ''}
                                onChange={(e) => updateItemDimensions(item.id, parseFloat(e.target.value) || 0, item.height || 0)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                placeholder="Width"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500">Height ({item.unitType === 'sqft' ? 'ft' : 'm'})</label>
                              <input
                                type="number"
                                step="0.1"
                                value={item.height || ''}
                                onChange={(e) => updateItemDimensions(item.id, item.width || 0, parseFloat(e.target.value) || 0)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                placeholder="Height"
                              />
                            </div>
                          </div>
                        )}
                        {item.area && (
                          <p className="text-xs text-gray-500 mt-1">
                            Area: {item.area.toFixed(2)} {item.unitType}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center"
                          >
                            -
                          </button>
                          <span className="w-12 text-center font-medium">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{formatCurrency(item.total)}</p>
                          {item.area && (
                            <p className="text-xs text-gray-500">
                              {item.quantity} × {item.area.toFixed(2)} {item.unitType}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="text-red-600 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Totals */}
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax (18% GST):</span>
                      <span>{formatCurrency(tax)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total:</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <p className="text-gray-600">No products selected. Click "Add Product" to get started.</p>
                </div>
              )}
            </div>

            {/* Additional Information */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Project Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.budget}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe your requirements, timeline, or any special instructions..."
                />
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={4}
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Any additional information or special requests..."
                />
              </div>
            </div>

            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? (
                  'Sending Quotation Request...'
                ) : (
                  <>
                    Send Quotation Request
                    <Send className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• We'll review your request within 24 hours</li>
              <li>• Our team will contact you to discuss details</li>
              <li>• You'll receive a detailed quotation with pricing</li>
              <li>• We'll schedule a consultation if needed</li>
              <li>• Payment can be processed directly from the quotation</li>
            </ul>
          </div>
        </div>

        {/* Product Search Modal */}
        {showProductSearch && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Select Products</h3>
                  <button
                    onClick={() => setShowProductSearch(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="p-6 max-h-96 overflow-y-auto">
                <div className="space-y-3">
                  {filteredInventory.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => addItemToQuotation(item)}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        <p className="text-sm text-gray-600">{item.category} • SKU: {item.sku}</p>
                        <p className="text-sm text-gray-500">Stock: {item.currentStock} {item.unit}</p>
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded mt-2"
                          />
                        )}
                        {item.groupTag && (
                          <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full mt-1">
                            {item.groupTag}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-blue-600">{formatCurrency(item.pricePerUnit || item.sellingPrice)}</p>
                        <p className="text-sm text-gray-500">per {item.unitType || item.unit}</p>
                        {item.width && item.height && (
                          <p className="text-xs text-gray-500">
                            {item.width} × {item.height} {item.unitType}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  {filteredInventory.length === 0 && (
                    <p className="text-center text-gray-600 py-8">No products found</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Estimate;