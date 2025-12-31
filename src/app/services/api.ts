// API Configuration
const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

// Helper function for API requests
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string; error?: string }> {
  const token = localStorage.getItem('auth_token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'An error occurred',
        error: data.error,
      };
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    return {
      success: false,
      message: 'Network error. Please check your connection.',
    };
  }
}

// Types
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'customer';
  phone?: string;
  address?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent_id?: number;
  products_count?: number;
  children?: Category[];
  show_on_home?: boolean;
}

export interface Product {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  description: string;
  price: string;
  original_price?: string;
  stock: number;
  image?: string;
  image_url?: string; // Full URL computed by backend
  badge?: string;
  rating: string;
  reviews_count: number;
  is_featured: boolean;
  category?: Category;
}

export interface CartItem {
  id: number;
  product: Product;
  quantity: number;
  size?: string;
  color?: string;
  total: number;
}

export interface Cart {
  id: number;
  items: CartItem[];
  items_count: number;
  subtotal: string;
}

export interface Order {
  id: number;
  order_number: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  subtotal: string;
  shipping: string;
  tax: string;
  total: string;
  shipping_address: Record<string, string>;
  payment_method: string;
  coupon_code?: string;
  discount_amount?: string;
  created_at: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  price: string;
  quantity: number;
  size?: string;
  color?: string;
}

export interface Review {
  id: number;
  user_id: number;
  product_id: number;
  rating: number;
  title?: string;
  comment?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  user?: { id: number; name: string };
}

export interface Coupon {
  id: number;
  code: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount?: number;
  max_discount?: number;
  is_active: boolean;
}

export interface FAQ {
  id: number;
  question: string;
  answer: string;
  category?: string;
  order: number;
}

export interface Collection {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  is_active: boolean;
  products?: Product[];
  products_count?: number;
}

export interface Banner {
  id: number;
  title: string;
  subtitle?: string;
  description?: string;
  image: string;
  button_text: string;
  button_link: string;
  is_active?: boolean;
  display_order?: number;
  starts_at?: string;
  ends_at?: string;
  created_at?: string;
}

export interface UserAddress {
  id: number;
  title: string;
  first_name: string;
  last_name: string;
  phone: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}

export interface SupportTicket {
  id: number;
  ticket_number: string;
  subject: string;
  message: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  replies?: SupportTicketReply[];
}

export interface SupportTicketReply {
  id: number;
  message: string;
  is_admin_reply: boolean;
  created_at: string;
  user?: { id: number; name: string };
}

export interface PaginatedResponse<T> {
  current_page: number;
  data: T[];
  per_page: number;
  total: number;
  last_page: number;
}

// Auth API
export const authApi = {
  register: async (data: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    phone?: string;
    address?: string;
  }) => {
    const result = await apiRequest<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (result.success && result.data?.token) {
      localStorage.setItem('auth_token', result.data.token);
      localStorage.setItem('user', JSON.stringify(result.data.user));
    }
    return result;
  },

  login: async (email: string, password: string) => {
    const result = await apiRequest<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (result.success && result.data?.token) {
      localStorage.setItem('auth_token', result.data.token);
      localStorage.setItem('user', JSON.stringify(result.data.user));
    }
    return result;
  },

  logout: async () => {
    const result = await apiRequest('/auth/logout', { method: 'POST' });
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    return result;
  },

  getUser: async () => {
    return apiRequest<User>('/auth/user');
  },

  updateProfile: async (data: { name?: string; phone?: string; address?: string }) => {
    return apiRequest<User>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('auth_token');
  },

  getCurrentUser: (): User | null => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
};

// Categories API
export const categoriesApi = {
  getAll: async () => {
    return apiRequest<Category[]>('/categories');
  },

  getOne: async (id: number) => {
    return apiRequest<Category>(`/categories/${id}`);
  },

  getHome: async () => {
    return apiRequest<Category[]>('/categories/home');
  },
};

// Products API
export const productsApi = {
  getAll: async (params?: {
    category_id?: number;
    category?: string;
    search?: string;
    min_price?: number;
    max_price?: number;
    badge?: string;
    featured?: boolean;
    in_stock?: boolean;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    page?: number;
    per_page?: number;
  }) => {
    const queryString = params
      ? '?' + new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== null)
          .map(([k, v]) => [k, String(v)])
      ).toString()
      : '';
    return apiRequest<PaginatedResponse<Product>>(`/products${queryString}`);
  },

  getOne: async (id: number) => {
    return apiRequest<{ product: Product; related_products: Product[] }>(`/products/${id}`);
  },

  getFeatured: async () => {
    return apiRequest<Product[]>('/products/featured');
  },

  getOnSale: async () => {
    return apiRequest<Product[]>('/products/on-sale');
  },

  search: async (query: string) => {
    return apiRequest<{
      data: Product[];
      suggestions: {
        products: { id: number; name: string; price: string; image?: string }[];
        categories: { id: number; name: string; slug: string }[];
      };
    }>(`/products/search?q=${encodeURIComponent(query)}`);
  },

  getReviews: async (productId: number) => {
    return apiRequest<{
      data: PaginatedResponse<Review>;
      stats: {
        average_rating: number;
        total_reviews: number;
        rating_distribution: Record<number, number>;
      };
    }>(`/products/${productId}/reviews`);
  },
};

// Cart API
export const cartApi = {
  get: async () => {
    return apiRequest<Cart>('/cart');
  },

  addItem: async (productId: number, quantity: number, size?: string, color?: string) => {
    return apiRequest<CartItem>('/cart/items', {
      method: 'POST',
      body: JSON.stringify({
        product_id: productId,
        quantity,
        size,
        color,
      }),
    });
  },

  updateItem: async (itemId: number, quantity: number) => {
    return apiRequest<CartItem>(`/cart/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  },

  removeItem: async (itemId: number) => {
    return apiRequest(`/cart/items/${itemId}`, { method: 'DELETE' });
  },

  clear: async () => {
    return apiRequest('/cart', { method: 'DELETE' });
  },
};

// Orders API
export const ordersApi = {
  getAll: async () => {
    return apiRequest<PaginatedResponse<Order>>('/orders');
  },

  getOne: async (id: number) => {
    return apiRequest<Order>(`/orders/${id}`);
  },

  create: async (data: {
    shipping_address: {
      first_name: string;
      last_name: string;
      email: string;
      phone: string;
      address: string;
      city: string;
      state: string;
      zip: string;
      country: string;
    };
    billing_address?: Record<string, string>;
    payment_method: 'card' | 'cash_on_delivery' | 'bank_transfer';
    notes?: string;
    coupon_code?: string;
  }) => {
    return apiRequest<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  cancel: async (id: number) => {
    return apiRequest(`/orders/${id}/cancel`, { method: 'POST' });
  },
};

// Wishlist API
export const wishlistApi = {
  getAll: async () => {
    return apiRequest<Product[]>('/wishlist');
  },

  add: async (productId: number) => {
    return apiRequest('/wishlist', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId }),
    });
  },

  remove: async (productId: number) => {
    return apiRequest(`/wishlist/${productId}`, { method: 'DELETE' });
  },

  toggle: async (productId: number) => {
    return apiRequest<{ in_wishlist: boolean }>('/wishlist/toggle', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId }),
    });
  },

  check: async (productId: number) => {
    return apiRequest<{ in_wishlist: boolean }>(`/wishlist/check/${productId}`);
  },
};

// Payment Method interface
export interface PaymentMethod {
  id: number;
  type: 'card' | 'upi' | 'netbanking';
  name?: string;
  last_four?: string;
  card_brand?: string;
  upi_id?: string;
  bank_name?: string;
  expiry_month?: string;
  expiry_year?: string;
  is_default: boolean;
  created_at?: string;
}

// Payment Methods API
export const paymentMethodsApi = {
  getAll: async () => {
    return apiRequest<PaymentMethod[]>('/payment-methods');
  },

  add: async (data: {
    type: 'card' | 'upi' | 'netbanking';
    name?: string;
    last_four?: string;
    card_brand?: string;
    upi_id?: string;
    bank_name?: string;
    expiry_month?: string;
    expiry_year?: string;
    is_default?: boolean;
  }) => {
    return apiRequest<PaymentMethod>('/payment-methods', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: Partial<PaymentMethod>) => {
    return apiRequest<PaymentMethod>(`/payment-methods/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number) => {
    return apiRequest(`/payment-methods/${id}`, { method: 'DELETE' });
  },

  setDefault: async (id: number) => {
    return apiRequest<PaymentMethod>(`/payment-methods/${id}/default`, {
      method: 'POST',
    });
  },
};

// Reviews API
export const reviewsApi = {
  create: async (data: {
    product_id: number;
    rating: number;
    title?: string;
    comment?: string;
  }) => {
    return apiRequest<Review>('/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getForProduct: async (productId: number) => {
    return apiRequest<{
      data: Review[];
      stats: {
        average_rating: number;
        total_reviews: number;
        rating_distribution: Record<number, number>;
      };
    }>(`/products/${productId}/reviews`);
  },

  getMyReviews: async () => {
    return apiRequest<PaginatedResponse<Review>>('/reviews/my-reviews');
  },
};

// Coupons API
export const couponsApi = {
  apply: async (code: string, orderAmount: number) => {
    return apiRequest<{
      coupon: Coupon;
      discount_amount: number;
      final_amount: number;
    }>('/coupons/apply', {
      method: 'POST',
      body: JSON.stringify({ code, order_amount: orderAmount }),
    });
  },
};

// FAQs API
export const faqsApi = {
  getAll: async () => {
    return apiRequest<{
      data: FAQ[];
      grouped: Record<string, FAQ[]>;
      categories: string[];
    }>('/faqs');
  },
};

// Collections API
export const collectionsApi = {
  getAll: async () => {
    return apiRequest<Collection[]>('/collections');
  },

  getOne: async (slug: string) => {
    return apiRequest<Collection>(`/collections/${slug}`);
  },
};

// Addresses API
export const addressesApi = {
  getAll: async () => {
    return apiRequest<UserAddress[]>('/addresses');
  },

  create: async (data: Omit<UserAddress, 'id'>) => {
    return apiRequest<UserAddress>('/addresses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: Partial<UserAddress>) => {
    return apiRequest<UserAddress>(`/addresses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number) => {
    return apiRequest(`/addresses/${id}`, { method: 'DELETE' });
  },

  setDefault: async (id: number) => {
    return apiRequest(`/addresses/${id}/default`, { method: 'POST' });
  },
};

// Support API
export const supportApi = {
  getAll: async () => {
    return apiRequest<PaginatedResponse<SupportTicket>>('/support');
  },

  getOne: async (id: number) => {
    return apiRequest<SupportTicket>(`/support/${id}`);
  },

  create: async (data: {
    subject: string;
    message: string;
    category: string;
    priority?: string;
    order_id?: number;
  }) => {
    return apiRequest<SupportTicket>('/support', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  reply: async (ticketId: number, message: string) => {
    return apiRequest<SupportTicketReply>(`/support/${ticketId}/reply`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },

  close: async (ticketId: number) => {
    return apiRequest(`/support/${ticketId}/close`, { method: 'POST' });
  },
};

// Password Reset API
export const passwordApi = {
  forgotPassword: async (email: string) => {
    return apiRequest<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  resetPassword: async (data: {
    email: string;
    token: string;
    password: string;
    password_confirmation: string;
  }) => {
    return apiRequest<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Razorpay Payment API
export interface RazorpayOrder {
  order_id: string;
  amount: number;
  currency: string;
  key_id: string;
  order_db_id: number;
}

export const razorpayApi = {
  createOrder: async (orderId: number) => {
    return apiRequest<RazorpayOrder>('/razorpay/create-order', {
      method: 'POST',
      body: JSON.stringify({ order_id: orderId }),
    });
  },

  verifyPayment: async (data: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
    order_id: number;
  }) => {
    return apiRequest<{ order: Order }>('/razorpay/verify-payment', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getPaymentStatus: async (orderId: number) => {
    return apiRequest<{ status: string; payment_id?: string }>(`/razorpay/payment-status/${orderId}`);
  },
};

// Shiprocket Shipping API
export interface ShippingRate {
  courier_name: string;
  courier_company_id: number;
  rate: number;
  etd: string;
  cod: boolean;
}

export interface TrackingInfo {
  awb_code: string;
  courier_name: string;
  current_status: string;
  tracking_history: Array<{
    date: string;
    status: string;
    location: string;
  }>;
}

export const shippingApi = {
  checkServiceability: async (deliveryPincode: string, pickupPincode?: string) => {
    const params = new URLSearchParams({
      delivery_pincode: deliveryPincode,
      ...(pickupPincode && { pickup_pincode: pickupPincode }),
    });
    return apiRequest<{ available: boolean; couriers: ShippingRate[] }>(`/shipping/check?${params}`);
  },

  getAvailableCouriers: async (deliveryPincode: string, weight: number, orderValue: number) => {
    const params = new URLSearchParams({
      delivery_pincode: deliveryPincode,
      weight: weight.toString(),
      order_value: orderValue.toString(),
    });
    return apiRequest<{ couriers: ShippingRate[] }>(`/shipping/couriers?${params}`);
  },

  trackByOrderId: async (orderId: number) => {
    return apiRequest<TrackingInfo>(`/shipping/track/${orderId}`);
  },
};

// Admin API
export const adminApi = {
  // Dashboard
  getStats: async () => {
    return apiRequest<{
      totalProducts: number;
      totalOrders: number;
      totalRevenue: number;
      totalCustomers: number;
      recentOrders: Order[];
    }>('/admin/dashboard/stats');
  },

  // Users
  getUsers: async (page = 1) => {
    return apiRequest<PaginatedResponse<User>>(`/admin/users?page=${page}`);
  },

  getUserDetails: async (userId: number) => {
    return apiRequest<User & { orders: Order[]; addresses: UserAddress[] }>(`/admin/users/${userId}`);
  },

  updateUserStatus: async (userId: number, isBlocked: boolean) => {
    return apiRequest(`/admin/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ is_blocked: isBlocked }),
    });
  },

  // Reviews
  getReviews: async (params?: { page?: number; status?: string }) => {
    const queryString = params
      ? '?' + new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      ).toString()
      : '';
    return apiRequest<PaginatedResponse<Review>>(`/admin/reviews${queryString}`);
  },

  updateReviewStatus: async (reviewId: number, status: string) => {
    return apiRequest(`/admin/reviews/${reviewId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  deleteReview: async (reviewId: number) => {
    return apiRequest(`/admin/reviews/${reviewId}`, { method: 'DELETE' });
  },

  // Support
  getTickets: async (params?: { page?: number; status?: string }) => {
    const queryString = params
      ? '?' + new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      ).toString()
      : '';
    return apiRequest<PaginatedResponse<SupportTicket>>(`/admin/support${queryString}`);
  },

  getTicketDetails: async (ticketId: number) => {
    return apiRequest<SupportTicket>(`/admin/support/${ticketId}`);
  },

  replyToTicket: async (ticketId: number, message: string) => {
    return apiRequest<SupportTicketReply>(`/admin/support/${ticketId}/reply`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },

  updateTicketStatus: async (ticketId: number, status: string) => {
    return apiRequest(`/admin/support/${ticketId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  // Shipping (Admin)
  createShipment: async (orderId: number) => {
    return apiRequest('/admin/shipping/create-shipment', {
      method: 'POST',
      body: JSON.stringify({ order_id: orderId }),
    });
  },

  generateAwb: async (shipmentId: number, courierId: number) => {
    return apiRequest('/admin/shipping/generate-awb', {
      method: 'POST',
      body: JSON.stringify({ shipment_id: shipmentId, courier_id: courierId }),
    });
  },

  schedulePickup: async (shipmentId: number) => {
    return apiRequest('/admin/shipping/schedule-pickup', {
      method: 'POST',
      body: JSON.stringify({ shipment_id: shipmentId }),
    });
  },

  cancelShipment: async (orderId: number) => {
    return apiRequest('/admin/shipping/cancel', {
      method: 'POST',
      body: JSON.stringify({ order_id: orderId }),
    });
  },

  trackByAwb: async (awb: string) => {
    return apiRequest<TrackingInfo>(`/admin/shipping/track/awb/${awb}`);
  },
};

// Banners API
export const bannersApi = {
  // Public: Get active banners
  getAll: async () => {
    return apiRequest<Banner[]>('/banners');
  },

  // Admin: Get all banners
  adminGetAll: async () => {
    return apiRequest<Banner[]>('/admin/banners');
  },

  // Admin: Create banner
  create: async (formData: FormData) => {
    const token = localStorage.getItem('auth_token');
    try {
      const response = await fetch(`${API_BASE_URL}/admin/banners`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });
      return await response.json();
    } catch (error) {
      console.error('Banner create error:', error);
      return { success: false, message: 'Network error' };
    }
  },

  // Admin: Update banner
  update: async (id: number, formData: FormData) => {
    const token = localStorage.getItem('auth_token');
    formData.append('_method', 'PUT');
    try {
      const response = await fetch(`${API_BASE_URL}/admin/banners/${id}`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });
      return await response.json();
    } catch (error) {
      console.error('Banner update error:', error);
      return { success: false, message: 'Network error' };
    }
  },

  // Admin: Delete banner
  delete: async (id: number) => {
    return apiRequest(`/admin/banners/${id}`, { method: 'DELETE' });
  },

  // Admin: Toggle status
  toggleStatus: async (id: number) => {
    return apiRequest(`/admin/banners/${id}/toggle`, { method: 'PUT' });
  },

  // Admin: Reorder banners
  reorder: async (order: { id: number; display_order: number }[]) => {
    return apiRequest('/admin/banners/reorder', {
      method: 'POST',
      body: JSON.stringify({ order }),
    });
  },
};

export default {
  auth: authApi,
  categories: categoriesApi,
  products: productsApi,
  cart: cartApi,
  orders: ordersApi,
  wishlist: wishlistApi,
  reviews: reviewsApi,
  coupons: couponsApi,
  faqs: faqsApi,
  collections: collectionsApi,
  addresses: addressesApi,
  support: supportApi,
  password: passwordApi,
  razorpay: razorpayApi,
  shipping: shippingApi,
  admin: adminApi,
  banners: bannersApi,
};
