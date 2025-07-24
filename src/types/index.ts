export interface User {
  uid: string;
  email: string;
  displayName?: string;
  profileImage?: string;
  role: 'admin' | 'employee' | 'customer';
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  stock: number;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  userId: string;
}

export interface InventoryItem {
  id: string;
  productId: string;
  currentStock: number;
  minimumStock: number;
  lastUpdated: string;
  updatedBy: string;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  createdAt: string;
}

export interface Testimonial {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userImage?: string;
  rating: number;
  title: string;
  content: string;
  isApproved: boolean;
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  respondedAt?: string;
  response?: string;
}

export interface SiteContent {
  id: string;
  section: 'header' | 'footer' | 'hero' | 'about';
  key: string;
  value: string;
  updatedAt: string;
  updatedBy: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}