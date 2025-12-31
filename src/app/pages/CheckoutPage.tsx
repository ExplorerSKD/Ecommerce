import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { CreditCard, Lock, Check, Loader2, ArrowLeft, CheckCircle, Banknote } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { ordersApi } from '../services/api';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

export function CheckoutPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { cart, clearCart, refreshCart, coupon, discountAmount } = useCart();
  const [step, setStep] = useState(1);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'razorpay'>('cod');

  const [shippingInfo, setShippingInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
  });

  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Pre-fill user info
  useEffect(() => {
    if (user) {
      const nameParts = user.name.split(' ');
      setShippingInfo(prev => ({
        ...prev,
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        email: user.email,
        phone: user.phone || '',
        address: user.address || '',
      }));
    }
  }, [user]);

  // Calculate totals
  const subtotal = cart?.items?.reduce((sum: number, item: any) =>
    sum + parseFloat(item.product.price) * item.quantity, 0
  ) || 0;

  const shipping = subtotal > 0 ? 15.00 : 0;
  const taxable = Math.max(0, subtotal - discountAmount);
  const tax = taxable * 0.08; // 8% GST
  const codFee = paymentMethod === 'cod' ? 50 : 0;
  const total = taxable + shipping + tax + codFee;

  const initiateRazorpayPayment = async (orderId: number, razorpayOrderId: string, amount: number) => {
    const options = {
      key: 'rzp_test_YOUR_KEY_HERE', // Replace with your Razorpay key
      amount: amount * 100, // Amount in paise
      currency: 'INR',
      name: 'LUXE Store',
      description: `Order #${orderId}`,
      order_id: razorpayOrderId,
      handler: async function (response: any) {
        // Verify payment on backend
        const token = localStorage.getItem('auth_token');
        try {
          const verifyRes = await fetch(`${API_BASE_URL}/razorpay/verify`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          const data = await verifyRes.json();
          if (data.success) {
            setOrderNumber(data.data.order_number || orderId.toString());
            setOrderPlaced(true);
            await clearCart();
            await refreshCart();
          } else {
            setError('Payment verification failed. Please contact support.');
          }
        } catch (err) {
          setError('Payment verification failed. Please contact support.');
        }
        setIsPlacingOrder(false);
      },
      prefill: {
        name: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
        email: shippingInfo.email,
        contact: shippingInfo.phone,
      },
      theme: {
        color: '#7C3AED',
      },
      modal: {
        ondismiss: function () {
          setIsPlacingOrder(false);
          setError('Payment was cancelled');
        }
      }
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  };

  const handlePlaceOrder = async () => {
    if (!agreedToTerms) {
      setError('Please agree to the terms and conditions');
      return;
    }

    setIsPlacingOrder(true);
    setError('');

    try {
      // 1. Create Order
      const orderData = {
        shipping_address: {
          first_name: shippingInfo.firstName, // Changed to match backend expected keys
          last_name: shippingInfo.lastName,
          email: shippingInfo.email,
          phone: shippingInfo.phone,
          address: shippingInfo.address,
          city: shippingInfo.city,
          state: shippingInfo.state,
          zip: shippingInfo.zipCode,
          country: shippingInfo.country,
        },
        payment_method: paymentMethod === 'cod' ? 'cash_on_delivery' : 'card',
        notes: '',
        coupon_code: coupon?.code,
      };

      const result = await ordersApi.create(orderData as any);

      if (!result.success || !result.data) {
        throw new Error(result.message || 'Failed to place order');
      }

      const order = result.data;

      if (paymentMethod === 'razorpay') {
        // 2. Initiate Razorpay Payment
        const token = localStorage.getItem('auth_token');
        const razorpayRes = await fetch(`${API_BASE_URL}/razorpay/create-order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ order_id: order.id }),
        });

        const razorpayData = await razorpayRes.json();

        if (razorpayData.success) {
          initiateRazorpayPayment(
            order.id,
            razorpayData.data.razorpay_order_id,
            razorpayData.data.amount / 100
          );
        } else {
          throw new Error(razorpayData.message || 'Failed to create payment order');
        }
      } else {
        // 3. Cash on Delivery - Done
        setOrderNumber(order.order_number);
        setOrderPlaced(true);
        await clearCart();
        await refreshCart();
        setIsPlacingOrder(false);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred. Please try again.');
      setIsPlacingOrder(false);
    }
  };

  const isShippingValid = () => {
    return shippingInfo.firstName && shippingInfo.lastName &&
      shippingInfo.email && shippingInfo.phone &&
      shippingInfo.address && shippingInfo.city &&
      shippingInfo.state && shippingInfo.zipCode;
  };

  const isPaymentValid = () => {
    return paymentMethod !== null;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
      </div>
    );
  }

  // Order success screen
  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-gray-50 py-6 sm:py-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="bg-white rounded-xl p-6 sm:p-12 shadow-sm"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
            >
              <CheckCircle className="w-16 h-16 sm:w-24 sm:h-24 text-green-500 mx-auto mb-4 sm:mb-6" />
            </motion.div>
            <h1 className="text-2xl sm:text-4xl mb-3 sm:mb-4">Order Placed!</h1>
            <p className="text-sm sm:text-base text-gray-600 mb-2">Thank you for your purchase</p>
            <p className="text-purple-600 text-lg sm:text-xl mb-3 sm:mb-4">Order #{orderNumber}</p>
            {paymentMethod === 'cod' && (
              <p className="text-sm sm:text-base text-orange-600 mb-3 sm:mb-4">
                💰 Pay ₹{total.toFixed(2)} on delivery
              </p>
            )}
            <p className="text-xs sm:text-sm text-gray-500 mb-6 sm:mb-8">
              We've sent a confirmation email to {shippingInfo.email}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/profile')}
                className="px-6 sm:px-8 py-2.5 sm:py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm sm:text-base"
              >
                View Orders
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/shop')}
                className="px-6 sm:px-8 py-2.5 sm:py-3 border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 text-sm sm:text-base"
              >
                Continue Shopping
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Empty cart check
  if (!cart?.items?.length) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="bg-white rounded-xl p-12 shadow-sm">
            <h1 className="text-2xl mb-4">Your cart is empty</h1>
            <p className="text-gray-600 mb-8">Add some items to checkout</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/shop')}
              className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Browse Products
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center mb-4 sm:mb-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={() => navigate('/cart')}
            className="flex items-center text-sm sm:text-base text-gray-600 hover:text-purple-600"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
            Back to Cart
          </motion.button>
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl sm:text-4xl mb-6 sm:mb-8"
        >
          Checkout
        </motion.h1>

        {/* Progress Steps */}
        <div className="mb-8 sm:mb-12">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {['Shipping', 'Payment', 'Review'].map((label, index) => {
              const stepNum = index + 1;
              const isActive = step >= stepNum;
              return (
                <div key={label} className="flex items-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base ${isActive ? 'bg-purple-600 text-white' : 'bg-gray-300 text-gray-600'
                      }`}
                  >
                    {step > stepNum ? <Check className="w-4 h-4 sm:w-6 sm:h-6" /> : stepNum}
                  </motion.div>
                  <span className={`ml-1 sm:ml-2 text-xs sm:text-base hidden xs:inline ${isActive ? 'text-purple-600' : 'text-gray-600'}`}>
                    {label}
                  </span>
                  {index < 2 && (
                    <div className={`w-8 sm:w-24 h-1 mx-1 sm:mx-4 ${isActive ? 'bg-purple-600' : 'bg-gray-300'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 text-red-700 rounded-lg text-sm sm:text-base">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-xl p-4 sm:p-8 shadow-sm"
              >
                <h2 className="text-xl sm:text-2xl mb-4 sm:mb-6">Shipping Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <input
                    type="text"
                    placeholder="First Name *"
                    value={shippingInfo.firstName}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, firstName: e.target.value })}
                    className="col-span-1 px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 text-sm sm:text-base"
                  />
                  <input
                    type="text"
                    placeholder="Last Name *"
                    value={shippingInfo.lastName}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, lastName: e.target.value })}
                    className="col-span-1 px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 text-sm sm:text-base"
                  />
                  <input
                    type="email"
                    placeholder="Email *"
                    value={shippingInfo.email}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, email: e.target.value })}
                    className="col-span-1 sm:col-span-2 px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 text-sm sm:text-base"
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number *"
                    value={shippingInfo.phone}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, phone: e.target.value })}
                    className="col-span-1 sm:col-span-2 px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 text-sm sm:text-base"
                  />
                  <input
                    type="text"
                    placeholder="Street Address *"
                    value={shippingInfo.address}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })}
                    className="col-span-1 sm:col-span-2 px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 text-sm sm:text-base"
                  />
                  <input
                    type="text"
                    placeholder="City *"
                    value={shippingInfo.city}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, city: e.target.value })}
                    className="col-span-1 px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 text-sm sm:text-base"
                  />
                  <input
                    type="text"
                    placeholder="State *"
                    value={shippingInfo.state}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, state: e.target.value })}
                    className="col-span-1 px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 text-sm sm:text-base"
                  />
                  <input
                    type="text"
                    placeholder="PIN Code *"
                    value={shippingInfo.zipCode}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, zipCode: e.target.value })}
                    className="col-span-1 px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 text-sm sm:text-base"
                  />
                  <select
                    value={shippingInfo.country}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, country: e.target.value })}
                    className="col-span-1 px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 text-sm sm:text-base"
                  >
                    <option>India</option>
                    <option>United States</option>
                    <option>United Kingdom</option>
                  </select>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-xl p-4 sm:p-8 shadow-sm"
              >
                <h2 className="text-xl sm:text-2xl mb-4 sm:mb-6 flex items-center space-x-2">
                  <CreditCard className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span>Select Payment Method</span>
                </h2>

                <div className="space-y-3 sm:space-y-4">
                  {/* Cash on Delivery Option */}
                  <label
                    className={`flex items-start sm:items-center p-3 sm:p-4 border-2 rounded-xl cursor-pointer transition-all ${paymentMethod === 'cod'
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 mt-1 sm:mt-0"
                    />
                    <div className="ml-3 sm:ml-4 flex flex-col sm:flex-row sm:items-center flex-1 gap-2 sm:gap-0">
                      <div className="hidden sm:flex w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full items-center justify-center mr-0 sm:mr-4">
                        <Banknote className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm sm:text-base text-gray-900">Cash on Delivery</h3>
                        <p className="text-xs sm:text-sm text-gray-500">Pay when your order arrives</p>
                      </div>
                      <span className="text-xs sm:text-sm text-orange-600 font-medium">+₹50 COD Fee</span>
                    </div>
                  </label>

                  {/* Razorpay Option */}
                  <label
                    className={`flex items-start sm:items-center p-3 sm:p-4 border-2 rounded-xl cursor-pointer transition-all ${paymentMethod === 'razorpay'
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="razorpay"
                      checked={paymentMethod === 'razorpay'}
                      onChange={() => setPaymentMethod('razorpay')}
                      className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 mt-1 sm:mt-0"
                    />
                    <div className="ml-3 sm:ml-4 flex flex-col sm:flex-row sm:items-center flex-1 gap-2 sm:gap-0">
                      <div className="hidden sm:flex w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full items-center justify-center mr-0 sm:mr-4">
                        <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm sm:text-base text-gray-900">Pay Online (Razorpay)</h3>
                        <p className="text-xs sm:text-sm text-gray-500">Cards, UPI, Net Banking, Wallets</p>
                      </div>
                    </div>
                  </label>
                </div>

                <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
                    <Lock className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>Your payment information is secure and encrypted</span>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-xl p-4 sm:p-8 shadow-sm"
              >
                <h2 className="text-xl sm:text-2xl mb-4 sm:mb-6">Review Your Order</h2>
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <h3 className="font-semibold text-sm sm:text-base mb-1 sm:mb-2 text-gray-700">Shipping Address</h3>
                    <p className="text-sm sm:text-base text-gray-600">
                      {shippingInfo.firstName} {shippingInfo.lastName}<br />
                      {shippingInfo.address}<br />
                      {shippingInfo.city}, {shippingInfo.state} {shippingInfo.zipCode}<br />
                      {shippingInfo.country}
                    </p>
                  </div>
                  <div className="border-t border-gray-200 pt-3 sm:pt-4">
                    <h3 className="font-semibold text-sm sm:text-base mb-1 sm:mb-2 text-gray-700">Payment Method</h3>
                    <div className="flex items-center">
                      {paymentMethod === 'cod' ? (
                        <>
                          <Banknote className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mr-2" />
                          <span className="text-sm sm:text-base text-gray-600">Cash on Delivery</span>
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mr-2" />
                          <span className="text-sm sm:text-base text-gray-600">Pay Online (Razorpay)</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="border-t border-gray-200 pt-3 sm:pt-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        className="w-4 h-4 text-purple-600"
                      />
                      <span className="text-xs sm:text-sm text-gray-600">
                        I agree to the terms and conditions
                      </span>
                    </label>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between gap-3">
              {step > 1 && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep(step - 1)}
                  className="px-4 sm:px-8 py-2.5 sm:py-3 border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors text-sm sm:text-base"
                >
                  Back
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={
                  (step === 1 && !isShippingValid()) ||
                  (step === 2 && !isPaymentValid()) ||
                  isPlacingOrder
                }
                onClick={() => {
                  if (step < 3) {
                    setStep(step + 1);
                  } else {
                    handlePlaceOrder();
                  }
                }}
                className="ml-auto px-4 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50 flex items-center text-sm sm:text-base"
              >
                {isPlacingOrder ? (
                  <>
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                    <span className="hidden sm:inline">{paymentMethod === 'razorpay' ? 'Processing...' : 'Placing Order...'}</span>
                    <span className="sm:hidden">Processing...</span>
                  </>
                ) : step === 3 ? (
                  paymentMethod === 'razorpay' ? 'Pay Now' : 'Place Order'
                ) : (
                  'Continue'
                )}
              </motion.button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl p-4 sm:p-6 shadow-sm sticky top-24"
            >
              <h3 className="text-lg sm:text-xl mb-3 sm:mb-4">Order Summary</h3>
              <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6 text-sm sm:text-base">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span>{shipping === 0 ? 'FREE' : `₹${shipping.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax (8% GST)</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({coupon?.code})</span>
                    <span>-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                {paymentMethod === 'cod' && (
                  <div className="flex justify-between text-orange-600">
                    <span>COD Fee</span>
                    <span>₹{codFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-2 sm:pt-3">
                  <div className="flex justify-between text-lg sm:text-xl font-semibold">
                    <span>Total</span>
                    <span className="text-purple-600">₹{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 sm:space-y-3 max-h-48 sm:max-h-64 overflow-y-auto">
                {cart?.items?.map((item: any) => (
                  <div key={item.id} className="flex space-x-2 sm:space-x-3">
                    <img
                      src={item.product.image_url || item.product.image || 'https://via.placeholder.com/64'}
                      alt={item.product.name}
                      className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm line-clamp-2">{item.product.name}</p>
                      <p className="text-xs sm:text-sm text-gray-600">Qty: {item.quantity}</p>
                      <p className="text-xs sm:text-sm text-purple-600">
                        ₹{(parseFloat(item.product.price) * item.quantity).toFixed(0)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
