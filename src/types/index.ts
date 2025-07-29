export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Administrator' | 'Manager' | 'E-commerce' | 'Technician' | 'Marketing' | 'Design' | 'Support Agent' | 'Customer';
  avatar?: string;
  isActive: boolean;
  lastLogin?: string;
  twoFactorEnabled: boolean;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  source: 'WooCommerce' | 'Internal';
}

export interface Product {
  id: string;
  image: string;
  title: string;
  category: string;
  basePrice: number;
  additionalCost: number;
  finalPrice: number;
  supplier: string;
  wooCommerceStatus: 'active' | 'inactive' | 'draft';
  wooCommerceCategory: string;
  lastSyncDate: string;
}

export interface Order {
  id: string;
  customerId: string;
  customer: Customer;
  products: OrderProduct[];
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingInfo: {
    address: string;
    city: string;
    zipCode: string;
    method: string;
  };
  total: number;
  createdAt: string;
  updatedAt: string;
  isEditable: boolean;
  notes?: string;
}

export interface OrderProduct extends Product {
  quantity: number;
  subtotal: number;
}

export interface Service {
  id: string;
  customer: Customer;
  orderId?: string;
  relatedProducts: Product[];
  problemDescription: string;
  status: 'received' | 'in-progress' | 'waiting-parts' | 'completed' | 'delivered';
  category: string;
  assignedTo: string;
  serviceHistory: ServiceHistoryEntry[];
  receptionPoint: string;
  underWarranty: boolean;
  qrCode: string;
  createdAt: string;
  updatedAt: string;
  emailNotificationsSent: boolean;
}

export interface ServiceHistoryEntry {
  id: string;
  date: string;
  action: string;
  notes: string;
  userId: string;
  userName: string;
  emailSent?: boolean;
}

export interface Task {
  id: string;
  type: 'task' | 'ticket';
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo: string;
  visibleTo: string[];
  category: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  attachments: FileAttachment[];
  createdAt: string;
  updatedAt: string;
  customerId?: string;
  relatedOrderId?: string;
  source?: 'Email' | 'Phone' | 'Website' | 'Social Media' | 'In Person' | 'Internal';
  comments: Comment[];
  history: TaskHistoryEntry[];
}

export interface FileAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: string;
  uploadedBy: string;
}

export interface TaskHistoryEntry {
  id: string;
  date: string;
  action: string;
  userId: string;
  userName: string;
  details?: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  message: string;
  createdAt: string;
  attachments?: FileAttachment[];
}

export interface ReportFilter {
  dateRange: 'today' | 'this-week' | 'this-month' | 'last-month' | 'this-year' | 'custom';
  startDate?: string;
  endDate?: string;
  status?: string;
  category?: string;
  assignedTo?: string;
  customer?: string;
  supplier?: string;
}

export interface UserAction {
  id: string;
  userId: string;
  userName: string;
  action: string;
  module: string;
  details: string;
  timestamp: string;
  ipAddress?: string;
}

export type ViewMode = 'list' | 'kanban';

export interface RolePermissions {
  [key: string]: {
    canView: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canExport: boolean;
  };
}

export interface SystemRole {
  name: string;
  permissions: {
    dashboard: RolePermissions['dashboard'];
    services: RolePermissions['services'];
    tasks: RolePermissions['tasks'];
    orders: RolePermissions['orders'];
    products: RolePermissions['products'];
    reports: RolePermissions['reports'];
    users: RolePermissions['users'];
    settings: RolePermissions['settings'];
  };
}