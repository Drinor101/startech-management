import { User, Customer, Product, Order, Service, Task, UserAction, OrderProduct } from '../types';

export const mockUsers: User[] = [
  { 
    id: '1', 
    name: 'John Admin', 
    email: 'admin@company.com', 
    role: 'Administrator',
    isActive: true,
    credits: 150.00,
    lastLogin: '2024-01-15T10:30:00Z'
  },
  { 
    id: '2', 
    name: 'Sarah Manager', 
    email: 'manager@company.com', 
    role: 'Manager',
    isActive: true,
    credits: 85.50,
    lastLogin: '2024-01-15T09:15:00Z'
  },
  { 
    id: '3', 
    name: 'Mike Tech', 
    email: 'tech@company.com', 
    role: 'Technician',
    isActive: true,
    credits: 200.00,
    lastLogin: '2024-01-15T08:45:00Z'
  },
  { 
    id: '4', 
    name: 'Lisa Support', 
    email: 'support@company.com', 
    role: 'Support Agent',
    isActive: true,
    credits: 75.25,
    lastLogin: '2024-01-15T11:20:00Z'
  },
  { 
    id: '5', 
    name: 'Tom Designer', 
    email: 'design@company.com', 
    role: 'Design',
    isActive: true,
    credits: 120.75,
    lastLogin: '2024-01-14T16:30:00Z'
  },
  { 
    id: '6', 
    name: 'Emma Marketing', 
    email: 'marketing@company.com', 
    role: 'Marketing',
    isActive: true,
    credits: 95.00,
    lastLogin: '2024-01-15T07:30:00Z'
  },
  { 
    id: '7', 
    name: 'Alex Ecommerce', 
    email: 'ecommerce@company.com', 
    role: 'E-commerce',
    isActive: true,
    credits: 180.50,
    lastLogin: '2024-01-15T12:00:00Z'
  },
];

export const mockCustomers: Customer[] = [
  { 
    id: '1', 
    name: 'Alice Johnson', 
    email: 'alice@email.com', 
    phone: '+1234567890', 
    address: '123 Main St, City',
    source: 'WooCommerce'
  },
  { 
    id: '2', 
    name: 'Bob Smith', 
    email: 'bob@email.com', 
    phone: '+0987654321', 
    address: '456 Oak Ave, Town',
    source: 'WooCommerce'
  },
  { 
    id: '3', 
    name: 'Carol Davis', 
    email: 'carol@email.com', 
    phone: '+1122334455', 
    address: '789 Pine Rd, Village',
    source: 'Internal'
  },
  { 
    id: '4', 
    name: 'David Wilson', 
    email: 'david@email.com', 
    phone: '+5566778899', 
    address: '321 Elm St, City',
    source: 'WooCommerce'
  },
];

export const mockProducts: Product[] = [
  {
    id: '1',
    image: 'https://images.pexels.com/photos/205926/pexels-photo-205926.jpeg?auto=compress&cs=tinysrgb&w=400',
    title: 'Wireless Headphones Pro',
    category: 'Electronics',
    basePrice: 99.99,
    additionalCost: 10.00,
    finalPrice: 109.99,
    supplier: 'TechCorp',
    wooCommerceStatus: 'active',
    wooCommerceCategory: 'Audio',
    lastSyncDate: '2024-01-15T12:00:00Z'
  },
  {
    id: '2',
    image: 'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=400',
    title: 'Premium Smartphone Case',
    category: 'Accessories',
    basePrice: 24.99,
    additionalCost: 5.00,
    finalPrice: 29.99,
    supplier: 'AccessoryPlus',
    wooCommerceStatus: 'active',
    wooCommerceCategory: 'Phone Accessories',
    lastSyncDate: '2024-01-15T12:00:00Z'
  },
  {
    id: '3',
    image: 'https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg?auto=compress&cs=tinysrgb&w=400',
    title: 'Adjustable Laptop Stand',
    category: 'Office',
    basePrice: 49.99,
    additionalCost: 8.00,
    finalPrice: 57.99,
    supplier: 'OfficeSupply',
    wooCommerceStatus: 'active',
    wooCommerceCategory: 'Office Equipment',
    lastSyncDate: '2024-01-15T12:00:00Z'
  },
  {
    id: '4',
    image: 'https://images.pexels.com/photos/1649771/pexels-photo-1649771.jpeg?auto=compress&cs=tinysrgb&w=400',
    title: 'Bluetooth Speaker',
    category: 'Electronics',
    basePrice: 79.99,
    additionalCost: 12.00,
    finalPrice: 91.99,
    supplier: 'TechCorp',
    wooCommerceStatus: 'active',
    wooCommerceCategory: 'Audio',
    lastSyncDate: '2024-01-15T12:00:00Z'
  },
  {
    id: '5',
    image: 'https://images.pexels.com/photos/1649771/pexels-photo-1649771.jpeg?auto=compress&cs=tinysrgb&w=400',
    title: 'Wireless Mouse',
    category: 'Accessories',
    basePrice: 34.99,
    additionalCost: 6.00,
    finalPrice: 40.99,
    supplier: 'AccessoryPlus',
    wooCommerceStatus: 'draft',
    wooCommerceCategory: 'Computer Accessories',
    lastSyncDate: '2024-01-15T12:00:00Z'
  },
];

const createOrderProducts = (products: Product[], quantities: number[]): OrderProduct[] => {
  return products.map((product, index) => ({
    ...product,
    quantity: quantities[index] || 1,
    subtotal: product.finalPrice * (quantities[index] || 1)
  }));
};

export const mockOrders: Order[] = [
  {
    id: 'ORD001',
    customerId: '1',
    customer: mockCustomers[0],
    products: createOrderProducts([mockProducts[0], mockProducts[1]], [1, 2]),
    status: 'processing',
    source: 'Woo',
    shippingInfo: {
      address: '123 Main St',
      city: 'City',
      zipCode: '12345',
      method: 'Standard Post'
    },
    total: 169.97,
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T11:00:00Z',
    isEditable: true,
    notes: 'Customer requested expedited processing'
  },
  {
    id: 'ORD002',
    customerId: '2',
    customer: mockCustomers[1],
    products: createOrderProducts([mockProducts[2]], [1]),
    status: 'shipped',
    source: 'Woo',
    shippingInfo: {
      address: '456 Oak Ave',
      city: 'Town',
      zipCode: '67890',
      method: 'Express Post'
    },
    total: 57.99,
    createdAt: '2024-01-14T14:15:00Z',
    updatedAt: '2024-01-15T09:30:00Z',
    isEditable: false
  },
  {
    id: 'ORD003',
    customerId: '3',
    customer: mockCustomers[2],
    products: createOrderProducts([mockProducts[3], mockProducts[4]], [1, 1]),
    status: 'pending',
    source: 'Manual',
    shippingInfo: {
      address: '789 Pine Rd',
      city: 'Village',
      zipCode: '11111',
      method: 'Standard Post'
    },
    total: 132.98,
    createdAt: '2024-01-15T13:45:00Z',
    updatedAt: '2024-01-15T13:45:00Z',
    isEditable: true
  },
];

export const mockServices: Service[] = [
  {
    id: 'SRV001',
    customer: mockCustomers[0],
    orderId: 'ORD001',
    relatedProducts: [mockProducts[0]],
    problemDescription: 'Headphones not charging properly, LED indicator not working',
    status: 'in-progress',
    category: 'Repair',
    assignedTo: 'Mike Tech',
    serviceHistory: [
      { 
        id: '1', 
        date: '2024-01-15T11:00:00Z', 
        action: 'Service received', 
        notes: 'Initial inspection completed, charging port appears damaged', 
        userId: '3', 
        userName: 'Mike Tech',
        emailSent: true
      },
      { 
        id: '2', 
        date: '2024-01-15T14:30:00Z', 
        action: 'Diagnosis completed', 
        notes: 'Confirmed charging port replacement needed, ordered parts', 
        userId: '3', 
        userName: 'Mike Tech',
        emailSent: true
      }
    ],
    receptionPoint: 'Main Office',
    underWarranty: true,
    qrCode: 'QR_SRV001_2024',
    createdAt: '2024-01-15T11:00:00Z',
    updatedAt: '2024-01-15T14:30:00Z',
    emailNotificationsSent: true
  },
  {
    id: 'SRV002',
    customer: mockCustomers[1],
    orderId: 'ORD002',
    relatedProducts: [mockProducts[2]],
    problemDescription: 'Laptop stand wobbling, adjustment mechanism loose',
    status: 'completed',
    category: 'Quality Issue',
    assignedTo: 'Mike Tech',
    serviceHistory: [
      { 
        id: '3', 
        date: '2024-01-14T16:30:00Z', 
        action: 'Service received', 
        notes: 'Product inspection started', 
        userId: '3', 
        userName: 'Mike Tech',
        emailSent: true
      },
      { 
        id: '4', 
        date: '2024-01-15T09:00:00Z', 
        action: 'Repair completed', 
        notes: 'Replaced base mechanism, tested stability', 
        userId: '3', 
        userName: 'Mike Tech',
        emailSent: true
      },
      { 
        id: '5', 
        date: '2024-01-15T10:00:00Z', 
        action: 'Quality check passed', 
        notes: 'Ready for customer pickup', 
        userId: '2', 
        userName: 'Sarah Manager',
        emailSent: true
      }
    ],
    receptionPoint: 'Warehouse',
    underWarranty: false,
    qrCode: 'QR_SRV002_2024',
    createdAt: '2024-01-14T16:30:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    completedAt: '2024-01-15T10:00:00Z',
    emailNotificationsSent: true
  },
  {
    id: 'SRV003',
    customer: mockCustomers[2],
    relatedProducts: [mockProducts[3]],
    problemDescription: 'Bluetooth speaker not pairing with devices',
    status: 'received',
    category: 'Technical Support',
    assignedTo: 'Lisa Support',
    serviceHistory: [
      { 
        id: '6', 
        date: '2024-01-15T13:00:00Z', 
        action: 'Service received', 
        notes: 'Initial assessment scheduled', 
        userId: '4', 
        userName: 'Lisa Support',
        emailSent: true
      }
    ],
    receptionPoint: 'Service Center',
    underWarranty: true,
    qrCode: 'QR_SRV003_2024',
    createdAt: '2024-01-15T13:00:00Z',
    updatedAt: '2024-01-15T13:00:00Z',
    emailNotificationsSent: true
  },
];

export const mockTasks: Task[] = [
  {
    id: 'TASK001',
    type: 'task',
    title: 'Update product catalog synchronization',
    description: 'Sync latest products from WooCommerce and update pricing structure',
    priority: 'medium',
    assignedTo: 'Alex Ecommerce',
    visibleTo: ['1', '2', '7'],
    category: 'System Maintenance',
    status: 'in-progress',
    attachments: [
      {
        id: 'att1',
        name: 'sync_requirements.pdf',
        url: '/files/sync_requirements.pdf',
        type: 'application/pdf',
        size: 245760,
        uploadedAt: '2024-01-15T09:00:00Z',
        uploadedBy: 'Sarah Manager'
      }
    ],
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-01-15T11:30:00Z',
    comments: [
      {
        id: 'c1',
        userId: '7',
        userName: 'Alex Ecommerce',
        message: 'Started working on the WooCommerce API integration',
        createdAt: '2024-01-15T11:30:00Z'
      }
    ],
    history: [
      {
        id: 'h1',
        date: '2024-01-15T09:00:00Z',
        action: 'Task created',
        userId: '2',
        userName: 'Sarah Manager'
      },
      {
        id: 'h2',
        date: '2024-01-15T09:15:00Z',
        action: 'Assigned to Alex Ecommerce',
        userId: '2',
        userName: 'Sarah Manager'
      },
      {
        id: 'h3',
        date: '2024-01-15T11:30:00Z',
        action: 'Status changed to in-progress',
        userId: '7',
        userName: 'Alex Ecommerce'
      }
    ]
  },
  {
    id: 'TICK001',
    type: 'ticket',
    title: 'Customer complaint about delivery damage',
    description: 'Customer reports package was damaged during shipping, requesting replacement',
    priority: 'high',
    assignedTo: 'Lisa Support',
    visibleTo: ['1', '2', '4'],
    category: 'Customer Service',
    status: 'todo',
    attachments: [
      {
        id: 'att2',
        name: 'damage_photo.jpg',
        url: '/files/damage_photo.jpg',
        type: 'image/jpeg',
        size: 1024000,
        uploadedAt: '2024-01-15T12:30:00Z',
        uploadedBy: 'Lisa Support'
      }
    ],
    createdAt: '2024-01-15T12:30:00Z',
    updatedAt: '2024-01-15T13:00:00Z',
    customerId: '2',
    relatedOrderId: 'ORD002',
    source: 'Email',
    comments: [
      { 
        id: 'c2', 
        userId: '4', 
        userName: 'Lisa Support', 
        message: 'Investigating the shipping issue with courier service', 
        createdAt: '2024-01-15T13:00:00Z' 
      }
    ],
    history: [
      {
        id: 'h4',
        date: '2024-01-15T12:30:00Z',
        action: 'Ticket created',
        userId: '4',
        userName: 'Lisa Support'
      },
      {
        id: 'h5',
        date: '2024-01-15T12:45:00Z',
        action: 'Photo evidence uploaded',
        userId: '4',
        userName: 'Lisa Support'
      }
    ]
  },
  {
    id: 'TASK002',
    type: 'task',
    title: 'Design new service request form',
    description: 'Create improved UI/UX for service request submission',
    priority: 'low',
    assignedTo: 'Tom Designer',
    visibleTo: ['1', '2', '5'],
    category: 'Design',
    status: 'review',
    attachments: [
      {
        id: 'att3',
        name: 'mockup_v1.png',
        url: '/files/mockup_v1.png',
        type: 'image/png',
        size: 2048000,
        uploadedAt: '2024-01-14T16:00:00Z',
        uploadedBy: 'Tom Designer'
      }
    ],
    createdAt: '2024-01-14T10:00:00Z',
    updatedAt: '2024-01-15T08:30:00Z',
    comments: [
      {
        id: 'c3',
        userId: '5',
        userName: 'Tom Designer',
        message: 'First mockup ready for review',
        createdAt: '2024-01-15T08:30:00Z'
      }
    ],
    history: [
      {
        id: 'h6',
        date: '2024-01-14T10:00:00Z',
        action: 'Task created',
        userId: '2',
        userName: 'Sarah Manager'
      },
      {
        id: 'h7',
        date: '2024-01-15T08:30:00Z',
        action: 'Status changed to review',
        userId: '5',
        userName: 'Tom Designer'
      }
    ]
  },
  {
    id: 'TASK003',
    type: 'task',
    title: 'Update customer database records',
    description: 'Clean up and update customer contact information in the database',
    priority: 'medium',
    assignedTo: 'Lisa Support',
    visibleTo: ['1', '2', '4'],
    category: 'Data Management',
    status: 'done',
    attachments: [],
    createdAt: '2024-01-14T09:00:00Z',
    updatedAt: '2024-01-15T11:00:00Z',
    completedAt: '2024-01-15T11:00:00Z',
    comments: [
      {
        id: 'c4',
        userId: '4',
        userName: 'Lisa Support',
        message: 'Database cleanup completed successfully',
        createdAt: '2024-01-15T11:00:00Z'
      }
    ],
    history: [
      {
        id: 'h8',
        date: '2024-01-14T09:00:00Z',
        action: 'Task created',
        userId: '2',
        userName: 'Sarah Manager'
      },
      {
        id: 'h9',
        date: '2024-01-15T11:00:00Z',
        action: 'Task completed',
        userId: '4',
        userName: 'Lisa Support'
      }
    ]
  }
];

export const mockUserActions: UserAction[] = [
  {
    id: '1',
    userId: '3',
    userName: 'Mike Tech',
    action: 'Updated service status',
    module: 'Services',
    details: 'Changed SRV001 status from received to in-progress',
    timestamp: '2024-01-15T14:30:00Z',
    ipAddress: '192.168.1.100'
  },
  {
    id: '2',
    userId: '4',
    userName: 'Lisa Support',
    action: 'Created new ticket',
    module: 'Tasks',
    details: 'Created TICK001 for customer complaint',
    timestamp: '2024-01-15T12:30:00Z',
    ipAddress: '192.168.1.101'
  },
  {
    id: '3',
    userId: '7',
    userName: 'Alex Ecommerce',
    action: 'Synced products',
    module: 'Products',
    details: 'Synchronized 145 products from WooCommerce',
    timestamp: '2024-01-15T12:00:00Z',
    ipAddress: '192.168.1.102'
  },
  {
    id: '4',
    userId: '2',
    userName: 'Sarah Manager',
    action: 'Exported report',
    module: 'Reports',
    details: 'Exported services report for January 2024',
    timestamp: '2024-01-15T11:45:00Z',
    ipAddress: '192.168.1.103'
  }
];