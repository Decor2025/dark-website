import React, { useState, useEffect } from 'react';
import { ref, onValue, push, set, get } from 'firebase/database';
import { database } from '../../config/firebase';
import { uploadToCloudinary } from '../../config/cloudinary';
import { useAuth } from '../../context/AuthContext';
import { Order } from '../../types';
import { 
  Plus, 
  Package, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Edit,
  Eye,
  X,
  Upload,
  Calculator
} from 'lucide-react';
import toast from 'react-hot-toast';

const OrderManagement: React.FC = () => {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [productSKUs, setProductSKUs] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    orderType: 'normal' as 'normal' | 'wooden',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    width: 0,
    height: 0,
    quantity: 1,
    fabricCode: '',
    selectedSKU: '',
    imageFile: null as File | null,
    imageUrl: '',
    baseSize: '35mm' as '35mm' | '50mm',
    woodenColorCode: '',
    operatingSide: 'left' as 'left' | 'right',
    notes: '',
  });

  useEffect(() => {
    const ordersRef = ref(database, 'orders');
    const unsubscribe = onValue(ordersRef, (snapshot) => {
      if (snapshot.exists()) {
        const ordersData = snapshot.val();
        const ordersList: Order[] = Object.keys(ordersData).map(key => ({
          id: key,
          ...ordersData[key],
        }));
        setOrders(ordersList.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
      } else {
        setOrders([]);
      }
    });

    // Load product SKUs
    const skusRef = ref(database, 'productSKUs');
    const unsubscribeSKUs = onValue(skusRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const skusList = Object.keys(data).map(key => ({
          id: key,
          ...data[key],
        })).filter(sku => sku.isActive);
        setProductSKUs(skusList);
      }
    });
    return () => {
      unsubscribe();
      unsubscribeSKUs();
    };
  }, []);

  const generateOrderNumber = async (): Promise<string> => {
    try {
      const ordersRef = ref(database, 'orders');
      const snapshot = await get(ordersRef);
      
      let maxNumber = 672; // Starting from DDI-673
      
      if (snapshot.exists()) {
        const ordersData = snapshot.val();
        Object.values(ordersData).forEach((order: any) => {
          if (order.orderNumber) {
            const match = order.orderNumber.match(/DDI-(\d+)/);
            if (match) {
              const num = parseInt(match[1]);
              if (num > maxNumber) {
                maxNumber = num;
              }
            }
          }
        });
      }
      
      return `DDI-${maxNumber + 1}`;
    } catch (error) {
      console.error('Error generating order number:', error);
      return `DDI-${Date.now()}`;
    }
  };

  const calculateWoodenBlindsData = (width: number, height: number, baseSize: '35mm' | '50mm') => {
    const diSize = baseSize === '35mm' ? 1.27 : 1.81;
    const numberOfSlats = Math.ceil(height / diSize) + 1; // +1 always as requested
    const tiltCordLength = (height * 2) + 10;
    const cordLength = (height * 4) + (width - 10);
    const ladderTapeSize = height + 5;
    const msRoad = width - 5;
    const channelUching = (width - 12) / 4;
    const channelUchingCm = channelUching * 2.54;
    
    return { 
      numberOfSlats, 
      tiltCordLength, 
      cordLength,
      ladderTapeSize,
      msRoad,
      channelUching,
      channelUchingCm
    };
  };

  const handleImageUpload = async (file: File) => {
    setImageUploading(true);
    try {
      const imageUrl = await uploadToCloudinary(file);
      setFormData(prev => ({ ...prev, imageUrl }));
      toast.success('Image uploaded successfully!');
    } catch (error) {
      toast.error('Failed to upload image');
      console.error('Error uploading image:', error);
    } finally {
      setImageUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = formData.imageUrl;
      
      if (formData.imageFile) {
        setImageUploading(true);
        imageUrl = await uploadToCloudinary(formData.imageFile);
        setImageUploading(false);
      }

      const orderNumber = editingOrder ? editingOrder.orderNumber : await generateOrderNumber();
      
      let orderData: Partial<Order> = {
        orderNumber,
        orderType: formData.orderType,
        status: editingOrder ? editingOrder.status : 'pending',
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        width: formData.width,
        height: formData.height,
        quantity: formData.quantity,
        notes: formData.notes,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser?.email || 'admin',
      };

      if (formData.orderType === 'normal') {
        orderData = {
          ...orderData,
          fabricCode: formData.fabricCode,
          imageUrl,
        };
      } else {
        const calculations = calculateWoodenBlindsData(
          formData.width,
          formData.height,
          formData.baseSize
        );
        
        orderData = {
          ...orderData,
          baseSize: formData.baseSize,
          woodenColorCode: formData.woodenColorCode,
          numberOfSlats: calculations.numberOfSlats,
          tiltCordLength: calculations.tiltCordLength,
          cordLength: calculations.cordLength,
          ladderTapeSize: calculations.ladderTapeSize,
          msRoad: calculations.msRoad,
          channelUching: calculations.channelUching,
          channelUchingCm: calculations.channelUchingCm,
          operatingSide: formData.operatingSide,
        };
      }

      if (editingOrder) {
        const orderRef = ref(database, `orders/${editingOrder.id}`);
        await set(orderRef, orderData);
        toast.success('Order updated successfully!');
      } else {
        orderData.createdAt = new Date().toISOString();
        orderData.createdBy = currentUser?.email || 'admin';
        
        const ordersRef = ref(database, 'orders');
        await push(ordersRef, orderData);
        toast.success(`Order ${orderNumber} created successfully!`);
      }

      resetForm();
    } catch (error) {
      toast.error('Failed to save order');
      console.error('Error saving order:', error);
    } finally {
      setLoading(false);
      setImageUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      orderType: 'normal',
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      width: 0,
      height: 0,
      quantity: 1,
      fabricCode: '',
      imageFile: null,
      imageUrl: '',
      baseSize: '35mm',
      woodenColorCode: '',
      notes: '',
    });
    setEditingOrder(null);
    setShowForm(false);
  };

  const handleEdit = (order: Order) => {
    setEditingOrder(order);
    setFormData({
      orderType: order.orderType,
      customerName: order.customerName,
      customerEmail: order.customerEmail || '',
      customerPhone: order.customerPhone || '',
      width: order.width,
      height: order.height,
      quantity: order.quantity,
      fabricCode: order.fabricCode || '',
      imageFile: null,
      imageUrl: order.imageUrl || '',
      baseSize: order.baseSize || '35mm',
      woodenColorCode: order.woodenColorCode || '',
      notes: order.notes || '',
    });
    setShowForm(true);
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (order) {
        const orderRef = ref(database, `orders/${orderId}`);
        await set(orderRef, {
          ...order,
          status: newStatus,
          updatedAt: new Date().toISOString(),
          updatedBy: currentUser?.email || 'admin',
        });
        toast.success(`Order status updated to ${newStatus}`);
      }
    } catch (error) {
      toast.error('Failed to update order status');
      console.error('Error updating order status:', error);
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending': return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'in-progress': return <AlertCircle className="w-5 h-5 text-blue-500" />;
      case 'ready': return <Package className="w-5 h-5 text-green-500" />;
      case 'completed': return <CheckCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ready': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const pendingOrders = orders.filter(order => order.status === 'pending');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Order Management</h2>
          <p className="text-gray-600 mt-1">
            {orders.length} total orders • {pendingOrders.length} pending
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Order
        </button>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orders.map((order) => (
          <div key={order.id} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-l-blue-500">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{order.orderNumber}</h3>
                <p className="text-sm text-gray-600">{order.customerName}</p>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(order.status)}
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                  {order.status.replace('-', ' ').toUpperCase()}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Type:</span>
                <span className="font-medium capitalize">{order.orderType} Blinds</span>
              </div>
              <div className="flex justify-between">
                <span>Size:</span>
                <span className="font-medium">{order.width}" × {order.height}"</span>
              </div>
              <div className="flex justify-between">
                <span>Quantity:</span>
                <span className="font-medium">{order.quantity}</span>
              </div>
              
              {order.orderType === 'wooden' && (
                <>
                  <div className="flex justify-between">
                    <span>Base Size:</span>
                    <span className="font-medium">{order.baseSize}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Slats:</span>
                    <span className="font-medium">{order.numberOfSlats}</span>
                  </div>
                </>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <select
                  value={order.status}
                  onChange={(e) => updateOrderStatus(order.id, e.target.value as Order['status'])}
                  className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="ready">Ready</option>
                  <option value="completed">Completed</option>
                </select>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => setViewingOrder(order)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEdit(order)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Edit Order"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Order Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">
                  {editingOrder ? 'Edit Order' : 'Create New Order'}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Order Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order Type
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, orderType: 'normal' })}
                    className={`p-4 border-2 rounded-lg text-center transition-colors ${
                      formData.orderType === 'normal'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <Package className="w-6 h-6 mx-auto mb-2" />
                    <div className="font-medium">Normal Blinds</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, orderType: 'wooden' })}
                    className={`p-4 border-2 rounded-lg text-center transition-colors ${
                      formData.orderType === 'wooden'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <Package className="w-6 h-6 mx-auto mb-2" />
                    <div className="font-medium">Wooden Blinds</div>
                  </button>
                </div>
              </div>

              {/* Customer Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Dimensions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Width (inches) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.1"
                    value={formData.width || ''}
                    onChange={(e) => setFormData({ ...formData, width: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Height (inches) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.1"
                    value={formData.height || ''}
                    onChange={(e) => setFormData({ ...formData, height: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.quantity || ''}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Normal Blinds Fields */}
              {formData.orderType === 'normal' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Product SKU
                    </label>
                    <select
                      value={formData.selectedSKU}
                      onChange={(e) => {
                        const selectedProduct = productSKUs.find(p => p.id === e.target.value);
                        setFormData({ 
                          ...formData, 
                          selectedSKU: e.target.value,
                          fabricCode: selectedProduct?.sku || '',
                          imageUrl: selectedProduct?.imageUrl || ''
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a product...</option>
                      {productSKUs.filter(p => p.category === 'normal').map(product => (
                        <option key={product.id} value={product.id}>
                          {product.sku} - {product.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fabric Code
                    </label>
                    <input
                      type="text"
                      value={formData.fabricCode}
                      onChange={(e) => setFormData({ ...formData, fabricCode: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., FB001"
                      readOnly={!!formData.selectedSKU}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Image
                    </label>
                    {formData.imageUrl && (
                      <img
                        src={formData.imageUrl}
                        alt="Product"
                        className="w-32 h-32 object-cover rounded-lg mb-2"
                      />
                    )}
                    {!formData.selectedSKU && (
                      <label className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                        <Upload className="w-4 h-4 mr-2" />
                        {imageUploading ? 'Uploading...' : 'Upload Image'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setFormData({ ...formData, imageFile: file });
                              handleImageUpload(file);
                            }
                          }}
                          className="hidden"
                          disabled={imageUploading}
                        />
                      </label>
                    )}
                  </div>
                </div>
              )}

              {/* Wooden Blinds Fields */}
              {formData.orderType === 'wooden' && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 space-y-4">
                  <div className="flex items-center mb-4">
                    <Package className="w-5 h-5 text-amber-600 mr-2" />
                    <h4 className="font-semibold text-amber-800">Wooden Blinds Specifications</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Base Size
                      </label>
                      <select
                        value={formData.baseSize}
                        onChange={(e) => setFormData({ ...formData, baseSize: e.target.value as '35mm' | '50mm' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="35mm">35mm</option>
                        <option value="50mm">50mm</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Wooden Color Code
                      </label>
                      <input
                        type="text"
                        value={formData.woodenColorCode}
                        onChange={(e) => setFormData({ ...formData, woodenColorCode: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., WC001"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Operating Side
                      </label>
                      <select
                        value={formData.operatingSide}
                        onChange={(e) => setFormData({ ...formData, operatingSide: e.target.value as 'left' | 'right' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="left">Left</option>
                        <option value="right">Right</option>
                      </select>
                    </div>
                  </div>

                  {/* Calculated Values Preview */}
                  {formData.height > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                        <Calculator className="w-4 h-4 mr-2" />
                        Calculated Values
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Number of Slats:</span>
                          <div className="font-medium">{calculateWoodenBlindsData(formData.width, formData.height, formData.baseSize).numberOfSlats}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Tilt Cord:</span>
                          <div className="font-medium">{calculateWoodenBlindsData(formData.width, formData.height, formData.baseSize).tiltCordLength}"</div>
                        </div>
                        <div>
                          <span className="text-gray-600">1.8m Cord:</span>
                          <div className="font-medium">{calculateWoodenBlindsData(formData.width, formData.height, formData.baseSize).cordLength}"</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Ladder Tape Size:</span>
                          <div className="font-medium">{calculateWoodenBlindsData(formData.width, formData.height, formData.baseSize).ladderTapeSize}"</div>
                        </div>
                        <div>
                          <span className="text-gray-600">MS Road:</span>
                          <div className="font-medium">{calculateWoodenBlindsData(formData.width, formData.height, formData.baseSize).msRoad}"</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Channel Uching:</span>
                          <div className="font-medium">
                            {calculateWoodenBlindsData(formData.width, formData.height, formData.baseSize).channelUching.toFixed(2)}" 
                            ({calculateWoodenBlindsData(formData.width, formData.height, formData.baseSize).channelUchingCm.toFixed(1)}cm)
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Additional notes or specifications..."
                />
              </div>

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
                  disabled={loading || imageUploading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving...' : editingOrder ? 'Update Order' : 'Create Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {viewingOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Order Details</h3>
                <button
                  onClick={() => setViewingOrder(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900">Order Number</h4>
                  <p className="text-lg font-mono">{viewingOrder.orderNumber}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Status</h4>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(viewingOrder.status)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(viewingOrder.status)}`}>
                      {viewingOrder.status.replace('-', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Customer Information</h4>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div><strong>Name:</strong> {viewingOrder.customerName}</div>
                  {viewingOrder.customerEmail && <div><strong>Email:</strong> {viewingOrder.customerEmail}</div>}
                  {viewingOrder.customerPhone && <div><strong>Phone:</strong> {viewingOrder.customerPhone}</div>}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Order Specifications</h4>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div><strong>Type:</strong> {viewingOrder.orderType} Blinds</div>
                  <div><strong>Dimensions:</strong> {viewingOrder.width}" × {viewingOrder.height}"</div>
                  <div><strong>Quantity:</strong> {viewingOrder.quantity}</div>
                  
                  {viewingOrder.orderType === 'normal' && (
                    <>
                      {viewingOrder.fabricCode && <div><strong>Fabric Code:</strong> {viewingOrder.fabricCode}</div>}
                      {viewingOrder.imageUrl && (
                        <div>
                          <strong>Image:</strong>
                          <img src={viewingOrder.imageUrl} alt="Product" className="w-32 h-32 object-cover rounded-lg mt-2" />
                        </div>
                      )}
                    </>
                  )}
                  
                  {viewingOrder.orderType === 'wooden' && (
                    <>
                      <div><strong>Base Size:</strong> {viewingOrder.baseSize}</div>
                      <div><strong>Wooden Color Code:</strong> {viewingOrder.woodenColorCode}</div>
                      <div><strong>Number of Slats:</strong> {viewingOrder.numberOfSlats}</div>
                      <div><strong>Operating Side:</strong> {viewingOrder.operatingSide}</div>
                      <div><strong>Ladder Tape Size:</strong> {viewingOrder.ladderTapeSize}"</div>
                      <div><strong>MS Road:</strong> {viewingOrder.msRoad}"</div>
                      <div><strong>Channel Uching:</strong> {viewingOrder.channelUching?.toFixed(2)}" ({viewingOrder.channelUchingCm?.toFixed(1)}cm)</div>
                      <div><strong>Tilt Cord Length:</strong> {viewingOrder.tiltCordLength}"</div>
                      <div><strong>1.8m Cord Length:</strong> {viewingOrder.cordLength}"</div>
                    </>
                  )}
                </div>
              </div>

              {viewingOrder.notes && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {viewingOrder.notes}
                  </div>
                </div>
              )}

              <div className="text-sm text-gray-500 border-t pt-4">
                <div>Created: {new Date(viewingOrder.createdAt).toLocaleString()}</div>
                <div>Updated: {new Date(viewingOrder.updatedAt).toLocaleString()}</div>
                <div>Created by: {viewingOrder.createdBy}</div>
                {viewingOrder.updatedBy && <div>Updated by: {viewingOrder.updatedBy}</div>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;