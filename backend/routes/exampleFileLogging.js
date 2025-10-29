import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';
import { logUserActivity, logUserActivityAfter, logActivity } from '../middleware/activityLogger.js';

const router = express.Router();

// Example route that uses file-based logging
router.get('/example-with-file-logging', authenticateUser, async (req, res) => {
  try {
    // Your business logic here
    const result = { message: 'This is an example with file-based logging' };
    
    // Manual logging example
    await logActivity(
      req.user.id,
      req.user.email?.split('@')[0] || req.user.name || 'Unknown',
      'CUSTOM_ACTION',
      'EXAMPLE',
      { customData: 'some value' },
      req.ip
    );
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error in example route:', error);
    res.status(500).json({
      success: false,
      error: 'Error in example route'
    });
  }
});

// Example route that logs after response
router.post('/example-post-with-file-logging', authenticateUser, logUserActivityAfter('CREATE', 'EXAMPLE'), async (req, res) => {
  try {
    // Your business logic here
    const result = { message: 'This is a POST example with file-based logging after response' };
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error in example POST route:', error);
    res.status(500).json({
      success: false,
      error: 'Error in example POST route'
    });
  }
});

// Test route to generate some sample logs
router.post('/generate-sample-logs', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const sampleActions = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'];
    const sampleModules = ['USERS', 'ORDERS', 'PRODUCTS', 'TASKS', 'SERVICES', 'TICKETS', 'CUSTOMERS'];
    
    // Generate 10 sample log entries
    for (let i = 0; i < 10; i++) {
      const action = sampleActions[Math.floor(Math.random() * sampleActions.length)];
      const module = sampleModules[Math.floor(Math.random() * sampleModules.length)];
      
      await logActivityToFile(
        req.user.id,
        req.user.email?.split('@')[0] || req.user.name || 'Unknown',
        action,
        module,
        { 
          sampleData: `Sample log entry ${i + 1}`,
          timestamp: new Date().toISOString(),
          title: `Sample ${module} ${i + 1}`,
          name: `Sample Name ${i + 1}`
        },
        req.ip
      );
    }
    
    res.json({
      success: true,
      message: 'Generated 10 sample log entries'
    });
  } catch (error) {
    console.error('Error generating sample logs:', error);
    res.status(500).json({
      success: false,
      error: 'Error generating sample logs'
    });
  }
});

// Test route to generate realistic activity logs
router.post('/generate-realistic-logs', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const realisticActivities = [
      { action: 'CREATE', module: 'TASKS', details: { title: 'Fix website bug', name: 'Website Bug Fix' } },
      { action: 'UPDATE', module: 'SERVICES', details: { title: 'Laptop repair', name: 'Laptop Repair Service' } },
      { action: 'CREATE', module: 'ORDERS', details: { title: 'Order #1234', name: 'Customer Order' } },
      { action: 'UPDATE', module: 'PRODUCTS', details: { title: 'iPhone 15', name: 'iPhone 15 Pro' } },
      { action: 'CREATE', module: 'TICKETS', details: { title: 'Support ticket', name: 'Customer Support' } },
      { action: 'DELETE', module: 'TASKS', details: { title: 'Old task', name: 'Completed Task' } },
      { action: 'UPDATE', module: 'USERS', details: { name: 'Admin User', email: 'admin@startech.com' } },
      { action: 'CREATE', module: 'SERVICES', details: { title: 'Phone repair', name: 'Phone Repair Service' } }
    ];
    
    // Generate realistic log entries
    for (const activity of realisticActivities) {
      await logActivity(
        req.user.id,
        req.user.email?.split('@')[0] || req.user.name || 'Unknown',
        activity.action,
        activity.module,
        activity.details,
        req.ip
      );
      
      // Add small delay between logs
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    res.json({
      success: true,
      message: 'Generated realistic activity logs'
    });
  } catch (error) {
    console.error('Error generating realistic logs:', error);
    res.status(500).json({
      success: false,
      error: 'Error generating realistic logs'
    });
  }
});

export default router;
