export const razorpayConfig = {
  keyId: 'rzp_test_5KAIiglEAjfDfA', 
  keySecret: 'ReTHyqWILzUD/spDCKvdHqGRW', 
  currency: 'INR',
  companyName: 'Decor Drapes',
  description: 'Payment for your order',
  image: '/logo.png',
  theme: {
    color: '#2563eb'
  }
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const createRazorpayOrder = async (amount: number, orderId: string) => {
  // This would typically be done on your backend
  // For demo purposes, we'll simulate the order creation
  return {
    id: `order_${Date.now()}`,
    amount: amount * 100, // Razorpay expects amount in paise
    currency: razorpayConfig.currency,
    receipt: orderId,
  };
};