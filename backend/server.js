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
    'https://startechapp.vercel.app'
  ],
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
import userRoutes from './routes/users.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import serviceRoutes from './routes/services.js';
import taskRoutes from './routes/tasks.js';
import customerRoutes from './routes/customers.js';
import reportRoutes from './routes/reports.js';

// Routes
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/reports', reportRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Startech Backend API is running',
    timestamp: new Date().toISOString()
  });
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
