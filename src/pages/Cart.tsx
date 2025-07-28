import React from 'react';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../config/razorpay';
import { razorpayConfig, createRazorpayOrder } from '../config/razorpay';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const Cart: React.FC = () => {
  const { cartItems, updateQuantity, removeFromCart, getTotalPrice, clearCart } = useCart();

  const handleCheckout = async () => {
    try {
      const totalAmount = getTotalPrice();
      const orderId = `order_${Date.now()}`;
      
      // Create Razorpay order
      const order = await createRazorpayOrder(totalAmount, orderId);
      
      const options = {
        key: razorpayConfig.keyId,
        amount: order.amount,
        currency: order.currency,
        name: razorpayConfig.companyName,
        description: razorpayConfig.description,
        order_id: order.id,
        image: razorpayConfig.image,
        theme: razorpayConfig.theme,
        handler: function (response: any) {
          handlePaymentSuccess(response);
        },
        prefill: {
          name: currentUser?.displayName || 'Customer',
          email: currentUser?.email || '',
          contact: currentUser?.phone || ''
        },
        modal: {
          ondismiss: function() {
            toast.error('Payment cancelled');
          }
        }
      };

      // @ts-ignore
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      toast.error('Failed to initiate payment');
      console.error('Payment error:', error);
    }
  };

  const handlePaymentSuccess = async (response: any) => {
    try {
      // Verify payment on backend
      await processRazorpayPayment(response, `cart_${Date.now()}`);
      
      // Create order record
      const orderData = {
        userId: currentUser?.uid,
        items: cartItems,
        total: getTotalPrice(),
        paymentId: response.razorpay_payment_id,
        orderId: response.razorpay_order_id,
        signature: response.razorpay_signature,
        status: 'paid',
        createdAt: new Date().toISOString(),
      };
      
      // Save order to database
      const ordersRef = ref(database, 'orders');
      await push(ordersRef, orderData);
      
      toast.success('Payment successful! Order placed.');
      clearCart();
    } catch (error) {
      toast.error('Payment verification failed');
      console.error('Payment verification error:', error);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Start shopping to add items to your cart</p>
            <Link
              to="/catalogue"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <button
            onClick={clearCart}
            className="text-red-600 hover:text-red-700 font-medium"
          >
            Clear Cart
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6">
            {cartItems.map((item) => (
              <div key={item.id} className="flex items-center py-4 border-b border-gray-200 last:border-b-0">
                <img
                  src={item.product.imageUrl || 'https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg'}
                  alt={item.product.name}
                  className="w-16 h-16 object-cover rounded-lg mr-4"
                />
                
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{item.product.name}</h3>
                  <p className="text-gray-600">${item.product.price} each</p>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  
                  <span className="text-lg font-medium w-8 text-center">{item.quantity}</span>
                  
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    disabled={item.quantity >= item.product.stock}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-lg font-semibold text-gray-900 ml-6 w-20 text-right">
                  {formatCurrency(item.product.price * item.quantity)}
                </div>

                <button
                  onClick={() => removeFromCart(item.id)}
                  className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xl font-semibold">Total: {formatCurrency(getTotalPrice())}</span>
            </div>
            
            <div className="flex space-x-4">
              <Link
                to="/catalogue"
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-medium transition-colors text-center"
              >
                Continue Shopping
              </Link>
              
              <button 
                onClick={handleCheckout}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
              >
                Pay {formatCurrency(getTotalPrice())}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;