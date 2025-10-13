import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
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
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
};

// Setup routes
await setupRoutes();

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Startech Backend API is running',
    timestamp: new Date().toISOString()
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

app.listen(PORT, () => {
  console.log(`🚀 Startech Backend API po funksionon në portin ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});
