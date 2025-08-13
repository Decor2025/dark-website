import React, { useState, useEffect } from 'react';
import { ref, push, set, remove, onValue } from 'firebase/database';
import { database } from '../../config/firebase';
import { uploadToCloudinary } from '../../config/cloudinary';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface Product {
  id?: string;
  name: string;
  category: string;
  description: string;
  images: string[];
  createdAt?: string;
  updatedAt?: string;
}

const ProductManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    imageFiles: [] as File[],
    imagePreviews: [] as string[],
  });

  useEffect(() => {
    const productsRef = ref(database, 'products');
    const unsubscribe = onValue(productsRef, (snapshot) => {
      if (snapshot.exists()) {
        const productsData = snapshot.val();
        const productsList: Product[] = Object.keys(productsData).map(key => ({
          id: key,
          ...productsData[key],
        }));
        setProducts(productsList);
      } else {
        setProducts([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setFormData(prev => ({
        ...prev,
        imageFiles: [...prev.imageFiles, ...files],
        imagePreviews: [...prev.imagePreviews, ...files.map(file => URL.createObjectURL(file))]
      }));
    }
  };

  const removeImagePreview = (index: number) => {
    setFormData(prev => {
      const newFiles = [...prev.imageFiles];
      const newPreviews = [...prev.imagePreviews];
      newFiles.splice(index, 1);
      newPreviews.splice(index, 1);
      return { ...prev, imageFiles: newFiles, imagePreviews: newPreviews };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrls: string[] = editingProduct?.images || [];

      if (formData.imageFiles.length > 0) {
        const uploads = await Promise.all(
          formData.imageFiles.map(file => uploadToCloudinary(file))
        );
        imageUrls = [...imageUrls, ...uploads];
      }

      const productData: Product = {
        name: formData.name,
        category: formData.category,
        description: formData.description,
        images: imageUrls,
        updatedAt: new Date().toISOString(),
        ...(editingProduct ? {} : { createdAt: new Date().toISOString() }),
      };

      if (editingProduct) {
        const productRef = ref(database, `products/${editingProduct.id}`);
        await set(productRef, productData);
        toast.success('Product updated successfully!');
      } else {
        const productsRef = ref(database, 'products');
        await push(productsRef, productData);
        toast.success('Product added successfully!');
      }

      resetForm();
    } catch (error) {
      toast.error('Failed to save product');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      description: product.description,
      imageFiles: [],
      imagePreviews: [],
    });
    setShowForm(true);
  };

  const handleDelete = async (productId: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        const productRef = ref(database, `products/${productId}`);
        await remove(productRef);
        toast.success('Product deleted successfully!');
      } catch (error) {
        toast.error('Failed to delete product');
        console.error(error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      description: '',
      imageFiles: [],
      imagePreviews: [],
    });
    setEditingProduct(null);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h2 className="text-2xl font-bold text-gray-900">Product Management</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Product Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Category</label>
                <input
                  type="text"
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </div>

              {/* Multiple Images */}
              <div>
                <label className="block text-sm font-medium">Product Images</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                />
                {formData.imagePreviews.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.imagePreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <img
                          src={preview}
                          alt="preview"
                          className="h-20 w-20 object-cover rounded"
                        />
                        <button
                          type="button"
                          onClick={() => removeImagePreview(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 py-2 px-4 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium disabled:opacity-50"
                >
                  {loading ? 'Saving...' : editingProduct ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Responsive Products Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <div key={product.id} className="bg-white rounded-lg shadow-md p-4 flex flex-col">
            <div className="flex overflow-x-auto gap-2 pb-2">
              {product.images?.length ? (
                product.images.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={product.name}
                    className="h-24 w-24 object-cover rounded"
                  />
                ))
              ) : (
                <img
                  src="https://via.placeholder.com/100"
                  alt="placeholder"
                  className="h-24 w-24 object-cover rounded"
                />
              )}
            </div>
            <h4 className="font-semibold text-lg mt-2">{product.name}</h4>
            <span className="text-sm text-gray-500">Category: {product.category}</span>
            {/* Description is saved but not shown here */}
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => handleEdit(product)}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded flex items-center justify-center"
              >
                <Edit className="w-4 h-4 mr-1" /> Edit
              </button>
              <button
                onClick={() => handleDelete(product.id!)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded flex items-center justify-center"
              >
                <Trash2 className="w-4 h-4 mr-1" /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductManagement;
