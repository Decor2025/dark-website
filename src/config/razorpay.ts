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
  try {
    // In production, this should be done on your backend
    const response = await fetch('/api/create-razorpay-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amount * 100, // Convert to paise
        currency: razorpayConfig.currency,
        receipt: orderId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create Razorpay order');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    // Fallback for demo purposes
    return {
      id: `order_${Date.now()}`,
      amount: amount * 100,
      currency: razorpayConfig.currency,
      receipt: orderId,
    };
  }
};

export const processRazorpayPayment = async (paymentData: any, quotationId: string) => {
  try {
    const response = await fetch('/api/verify-razorpay-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...paymentData,
        quotationId,
      }),
    });

    if (!response.ok) {
      throw new Error('Payment verification failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Error processing payment:', error);
    throw error;
  }
};