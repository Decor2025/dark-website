import React from 'react';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../config/razorpay';
import { ShoppingCart, Eye } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onViewDetails: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onViewDetails }) => {
  const { addToCart } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-w-1 aspect-h-1">
        <img
          src={product.imageUrl || 'https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg'}
          alt={product.name}
          className="w-full h-48 object-cover"
        />
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
        
        <div className="flex items-center justify-between mb-4">
          <span className="text-2xl font-bold text-blue-600">{formatCurrency(product.price)}</span>
          <span className="text-sm text-gray-500">Stock: {product.stock}</span>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={onViewDetails}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-3 rounded-lg font-medium transition-colors flex items-center justify-center"
          >
            <Eye className="w-4 h-4 mr-1" />
            Details
          </button>
          
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white py-2 px-3 rounded-lg font-medium transition-colors flex items-center justify-center"
          >
            <ShoppingCart className="w-4 h-4 mr-1" />
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;