import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();

// Enable garbage collection for memory management
if (global.gc) {
  console.log('Garbage collection is available');
} else {
  console.log('Garbage collection is not available. Start with --expose-gc flag for better memory management.');
}

// Memory monitoring function
const logMemoryUsage = (label = 'Memory Usage') => {
  const used = process.memoryUsage();
  console.log(`${label}:`, {
    rss: `${Math.round(used.rss / 1024 / 1024 * 100) / 100} MB`,
    heapTotal: `${Math.round(used.heapTotal / 1024 / 1024 * 100) / 100} MB`,
    heapUsed: `${Math.round(used.heapUsed / 1024 / 1024 * 100) / 100} MB`,
    external: `${Math.round(used.external / 1024 / 1024 * 100) / 100} MB`
  });
  
  // Warn if memory usage is high
  if (used.heapUsed > 400 * 1024 * 1024) { // 400MB
    console.warn('⚠️  HIGH MEMORY USAGE DETECTED! Consider optimizing or restarting the service.');
  }
};

// Log initial memory usage
logMemoryUsage('Initial Memory Usage');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false
}));
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:5174', 
    'http://localhost:5175',
    'https://startechmanagement.netlify.app',
    'https://startechapp.netlify.app',
    'https://startechapp.vercel.app',
    'https://menaxhimi.startech24.com', // Your custom domain
    // Render domains (will be updated after deployment)
    'https://startech-backend.onrender.com',
    'https://startech-management.onrender.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-ID'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar']
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Handle preflight requests
app.options('*', cors());

// CORS debugging middleware
app.use((req, res, next) => {
  console.log(`CORS Debug - ${req.method} ${req.url}`);
  console.log('Origin:', req.headers.origin);
  console.log('User-Agent:', req.headers['user-agent']);
  next();
});

// Import routes after dotenv.config()
const setupRoutes = async () => {
  const userRoutes = (await import('./routes/users.js')).default;
  const productRoutes = (await import('./routes/products.js')).default;
  const orderRoutes = (await import('./routes/orders.js')).default;
  const serviceRoutes = (await import('./routes/services.js')).default;
  const taskRoutes = (await import('./routes/tasks.js')).default;
  const ticketRoutes = (await import('./routes/tickets.js')).default;
  const customerRoutes = (await import('./routes/customers.js')).default;
  const reportRoutes = (await import('./routes/reports.js')).default;
  const activityLogRoutes = (await import('./routes/activityLogs.js')).default;
  const fileActivityLogRoutes = (await import('./routes/fileActivityLogs.js')).default;
  const exampleFileLoggingRoutes = (await import('./routes/exampleFileLogging.js')).default;
  const commentRoutes = (await import('./routes/comments.js')).default;

  // Routes
  app.use('/api/users', userRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/services', serviceRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/tickets', ticketRoutes);
  app.use('/api/customers', customerRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/activity', activityLogRoutes);
  app.use('/api/file-activity', fileActivityLogRoutes);
  app.use('/api/example-file-logging', exampleFileLoggingRoutes);
  app.use('/api/comments', commentRoutes);
};

// Setup routes
await setupRoutes();

// Health check with memory monitoring
app.get('/api/health', (req, res) => {
  const used = process.memoryUsage();
  const memoryInfo = {
    rss: Math.round(used.rss / 1024 / 1024 * 100) / 100,
    heapTotal: Math.round(used.heapTotal / 1024 / 1024 * 100) / 100,
    heapUsed: Math.round(used.heapUsed / 1024 / 1024 * 100) / 100,
    external: Math.round(used.external / 1024 / 1024 * 100) / 100,
    unit: 'MB'
  };
  
  res.json({ 
    status: 'OK', 
    message: 'Startech Backend API is running',
    timestamp: new Date().toISOString(),
    memory: memoryInfo,
    uptime: process.uptime(),
    cors: {
      origin: req.headers.origin,
      allowedOrigins: [
        'http://localhost:5173', 
        'http://localhost:5174', 
        'http://localhost:5175',
        'https://startechmanagement.netlify.app',
        'https://startechapp.netlify.app',
        'https://startechapp.vercel.app',
        'https://menaxhimi.startech24.com',
        'https://startech-backend.onrender.com',
        'https://startech-management.onrender.com'
      ]
    }
  });
});

// Test database connection
app.get('/api/test-db', async (req, res) => {
  try {
    const { supabase } = await import('./config/supabase.js');
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role')
      .limit(5);
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    res.json({ users: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Diçka shkoi keq!', 
    message: process.env.NODE_ENV === 'development' ? err.message : 'Gabim i brendshëm i serverit'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route nuk u gjet', 
    message: 'API endpoint nuk ekziston' 
  });
});

// Memory monitoring endpoint
app.get('/api/memory', (req, res) => {
  const used = process.memoryUsage();
  const memoryInfo = {
    rss: Math.round(used.rss / 1024 / 1024 * 100) / 100,
    heapTotal: Math.round(used.heapTotal / 1024 / 1024 * 100) / 100,
    heapUsed: Math.round(used.heapUsed / 1024 / 1024 * 100) / 100,
    external: Math.round(used.external / 1024 / 1024 * 100) / 100,
    unit: 'MB',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  };
  
  res.json(memoryInfo);
});

// Periodic memory monitoring (every 5 minutes)
setInterval(() => {
  logMemoryUsage('Periodic Memory Check');
}, 5 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`🚀 Startech Backend API po funksionon në portin ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🧠 Memory monitoring: http://localhost:${PORT}/api/memory`);
  logMemoryUsage('Server Started');
});
