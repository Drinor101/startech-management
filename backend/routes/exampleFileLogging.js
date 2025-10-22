import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';
import { logUserActivityToFile, logActivityToFile } from '../middleware/fileActivityLogger.js';

const router = express.Router();

// Example route that uses file-based logging
router.get('/example-with-file-logging', authenticateUser, logUserActivityToFile('VIEW', 'EXAMPLE'), async (req, res) => {
  try {
    // Your business logic here
    const result = { message: 'This is an example with file-based logging' };
    
    // Manual logging example
    await logActivityToFile(
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
router.post('/example-post-with-file-logging', authenticateUser, logUserActivityToFileAfter('CREATE', 'EXAMPLE'), async (req, res) => {
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
    const sampleActions = ['CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN', 'LOGOUT'];
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
          timestamp: new Date().toISOString()
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

export default router;
