export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'Administrator' | 'Manager' | 'E-commerce' | 'Technician' | 'Marketing' | 'Design' | 'Support Agent' | 'Customer';
  department?: string;
  avatar?: string;
  isActive: boolean;
  lastLogin?: string;
  credits: number; // Credits in euros
  createdAt: string;
  updatedAt: string;
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
  id: string; // Format: PRS0001, PRS0002, etc.
  customerId: string;
  customer: Customer;
  products: OrderProduct[];
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  source: 'Manual' | 'Woo'; // Order source - Manual or WooCommerce
  shippingInfo: {
    address: string;
    city: string;
    zipCode: string;
    method: string;
  };
  total: number;
  teamNotes?: string; // Shënim shtesë për ekipin
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
  id: string; // Format: SRV0001, SRV0002, etc.
  createdBy: string; // Krijuar nga
  assignedBy?: string; // Përcaktuar nga
  customer: Customer;
  orderId?: string;
  relatedProducts: Product[];
  problemDescription: string;
  status: 'received' | 'in-progress' | 'waiting-parts' | 'completed' | 'delivered';
  category: string;
  assignedTo: string;
  warrantyInfo?: string; // Garancioni
  serviceHistory: ServiceHistoryEntry[];
  receptionPoint: string;
  underWarranty: boolean;
  qrCode: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string; // Time when service was completed
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
  id: string; // Format: TSK0001, TSK0002, etc.
  type: 'task' | 'ticket';
  title: string;
  description?: string; // Përshkrimi (excerpt)
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo: string; // Caktuar për
  assignedBy?: string; // Caktuar nga
  createdBy?: string; // Krijuar nga
  visibleTo: string[];
  category: string;
  department: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  attachments: FileAttachment[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string; // Time when task was completed
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

// Tiketat (TIK) interface
export interface Ticket {
  id: string; // Format: TIK0001, TIK0002, etc.
  title: string;
  source: 'Email' | 'Phone' | 'Website' | 'Social Media' | 'In Person' | 'Internal';
  createdBy: string; // Krijuar nga
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in-progress' | 'waiting-customer' | 'resolved' | 'closed';
  description?: string;
  assignedTo?: string;
  customerId?: string;
  relatedOrderId?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  comments: TicketComment[];
  history: TicketHistoryEntry[];
}

export interface TicketComment {
  id: string;
  ticketId: string;
  userId: string;
  userName: string;
  message: string;
  createdAt: string;
}

export interface TicketHistoryEntry {
  id: string;
  ticketId: string;
  date: string;
  action: string;
  userId: string;
  userName: string;
  details?: string;
}

// Media Files interface (për Dizajner)
export interface MediaFile {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  thumbnailUrl?: string;
  status: 'pending' | 'published' | 'rejected';
  uploadedBy: string;
  description?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

// Media Calendar interface
export interface MediaCalendarEvent {
  id: string;
  mediaId: string;
  eventDate: string; // Date format
  eventType: 'upload' | 'review' | 'publish' | 'reject';
  notes?: string;
  createdAt: string;
}

export interface SystemRole {
  name: string;
  permissions: {
    dashboard: RolePermissions['dashboard'];
    services: RolePermissions['services'];
    tasks: RolePermissions['tasks'];
    tickets: RolePermissions['tickets'];
    orders: RolePermissions['orders'];
    products: RolePermissions['products'];
    reports: RolePermissions['reports'];
    users: RolePermissions['users'];
    media: RolePermissions['media'];
    settings: RolePermissions['settings'];
  };
}