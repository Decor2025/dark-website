import React, { useState, useEffect } from 'react';
import { ref, onValue, set } from 'firebase/database';
import { database } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { Product, InventoryItem } from '../../types';
import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import toast from 'react-hot-toast';

const InventoryManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    const productsRef = ref(database, 'products');
    const inventoryRef = ref(database, 'inventory');

    const unsubscribeProducts = onValue(productsRef, (snapshot) => {
      if (snapshot.exists()) {
        const productsData = snapshot.val();
        const productsList: Product[] = Object.keys(productsData).map(key => ({
          id: key,
          ...productsData[key],
        }));
        setProducts(productsList);
      }
    });

    const unsubscribeInventory = onValue(inventoryRef, (snapshot) => {
      if (snapshot.exists()) {
        const inventoryData = snapshot.val();
        const inventoryList: InventoryItem[] = Object.keys(inventoryData).map(key => ({
          id: key,
          ...inventoryData[key],
        }));
        setInventory(inventoryList);
      }
    });

    return () => {
      unsubscribeProducts();
      unsubscribeInventory();
    };
  }, []);

  const updateStock = async (productId: string, newStock: number) => {
    setLoading(true);
    try {
      // Update product stock
      const productRef = ref(database, `products/${productId}`);
      const product = products.find(p => p.id === productId);
      if (product) {
        await set(productRef, {
          ...product,
          stock: newStock,
          updatedAt: new Date().toISOString(),
        });

        // Update inventory record
        const inventoryRef = ref(database, `inventory/${productId}`);
        await set(inventoryRef, {
          productId,
          currentStock: newStock,
          minimumStock: 10,
          lastUpdated: new Date().toISOString(),
          updatedBy: currentUser?.email || 'unknown',
        });

        toast.success('Stock updated successfully!');
      }
    } catch (error) {
      toast.error('Failed to update stock');
      console.error('Error updating stock:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLowStockItems = () => {
    return products.filter(product => product.stock < 10);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Inventory Management</h2>
      </div>

      {/* Low Stock Alert */}
      {getLowStockItems().length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
            <h3 className="text-lg font-medium text-yellow-800">Low Stock Alert</h3>
          </div>
          <p className="text-yellow-700 mt-1">
            {getLowStockItems().length} items are running low on stock
          </p>
          <div className="mt-2">
            {getLowStockItems().map(product => (
              <span key={product.id} className="inline-block bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm mr-2 mb-1">
                {product.name} ({product.stock} left)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Stock Levels</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img
                        src={product.imageUrl || 'https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg'}
                        alt={product.name}
                        className="w-10 h-10 object-cover rounded-lg mr-3"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.category}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-900">{product.stock}</span>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => updateStock(product.id, product.stock - 1)}
                          disabled={loading || product.stock <= 0}
                          className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                        >
                          <TrendingDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => updateStock(product.id, product.stock + 1)}
                          disabled={loading}
                          className="p-1 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                        >
                          <TrendingUp className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      product.stock === 0
                        ? 'bg-red-100 text-red-800'
                        : product.stock < 10
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {product.stock === 0 ? 'Out of Stock' : product.stock < 10 ? 'Low Stock' : 'In Stock'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <input
                      type="number"
                      min="0"
                      defaultValue={product.stock}
                      onBlur={(e) => {
                        const newStock = parseInt(e.target.value);
                        if (newStock !== product.stock && newStock >= 0) {
                          updateStock(product.id, newStock);
                        }
                      }}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryManagement;