export interface User {
  uid: string;
  email: string;
  displayName?: string;
  profileImage?: string;
  role: 'admin' | 'employee' | 'customer' | 'editor' | 'viewer';
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

export interface TeamMember {
  id: string;
  name: string;
  position: string;
  bio: string;
  image: string;
  email?: string;
  linkedin?: string;
  twitter?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SiteSettings {
  id: string;
  category: 'general' | 'contact' | 'social' | 'seo' | 'store';
  key: string;
  value: string;
  type: 'text' | 'email' | 'url' | 'textarea' | 'image' | 'boolean';
  label: string;
  description?: string;
  updatedAt: string;
  updatedBy: string;
}