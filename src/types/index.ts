export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'Administrator' | 'Marketer' | 'Dizajner' | 'Menaxher' | 'Agjent shitjeje' | 'Agjent mbështetje' | 'Serviser';
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
  city: string;
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
  source: 'WooCommerce' | 'Manual'; // Product source - WooCommerce or Manual
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

export type ViewMode = 'list' | 'kanban' | 'calendar';

export interface RolePermissions {
  [key: string]: {
    canView: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canExport: boolean;
  };
}

// Role-based permissions system
// Sipas specifikimeve:
// Taska - Taskat e përcaktuar për atë përdorues
// Tiketat - Agjent shitjeje, Agjent mbështetje, Menaxher, Serviser
// Servisi - Agjent shitjeje, Agjent mbështetje, Serviser
// Porositë - Agjent shitjeje, Agjent mbështetje, Serviser, Menaxher
// Raportet - Menaxher (tash për tash)
// Përdoruesit - Admin, Menaxher (View only)
// ***Admin kuptohet çasje e plotë
export const ROLE_PERMISSIONS = {
  'Administrator': {
    // Administrator - Çasje e plotë në të gjitha modulet
    tasks: { canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true },
    tickets: { canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true },
    services: { canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true },
    orders: { canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true },
    reports: { canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true },
    users: { canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true },
    products: { canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true },
    customers: { canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true }
  },
  'Menaxher': {
    // Menaxher - Çasje e plotë përveç Users (vetëm view) dhe Reports (tash për tash)
    tasks: { canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true },
    tickets: { canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true },
    services: { canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true },
    orders: { canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true },
    reports: { canView: true, canCreate: false, canEdit: false, canDelete: false, canExport: false }, // Tash për tash
    users: { canView: true, canCreate: false, canEdit: false, canDelete: false, canExport: false }, // View only
    products: { canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true },
    customers: { canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true }
  },
  'Agjent shitjeje': {
    // Agjent shitjeje - Tasks, Tiketat, Servisi, Porositë, Products, Customers
    tasks: { canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: false },
    tickets: { canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: false },
    services: { canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: false },
    orders: { canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: false },
    reports: { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
    users: { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
    products: { canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: false },
    customers: { canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: false },
    comments: { canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: false }
  },
  'Agjent mbështetje': {
    // Agjent mbështetje - Tasks, Tiketat, Servisi, Porositë, Products, Customers
    tasks: { canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: false },
    tickets: { canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: false },
    services: { canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: false },
    orders: { canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: false },
    reports: { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
    users: { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
    products: { canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: false },
    customers: { canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: false },
    comments: { canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: false }
  },
  'Serviser': {
    // Serviser - Tasks, Tiketat, Servisi, Porositë, Products, Customers
    tasks: { canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: false },
    tickets: { canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: false },
    services: { canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: false },
    orders: { canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: false },
    reports: { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
    users: { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
    products: { canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: false },
    customers: { canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: false },
    comments: { canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: false }
  },
  'Marketer': {
    // Marketer - Vetëm Tasks, Products, Customers
    tasks: { canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: false },
    tickets: { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
    services: { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
    orders: { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
    reports: { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
    users: { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
    products: { canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: false },
    customers: { canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: false },
    comments: { canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: false }
  },
  'Dizajner': {
    // Dizajner - Vetëm Tasks, Products, Customers
    tasks: { canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: false },
    tickets: { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
    services: { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
    orders: { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
    reports: { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
    users: { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
    products: { canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: false },
    customers: { canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: false },
    comments: { canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: false }
  }
} as const;

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