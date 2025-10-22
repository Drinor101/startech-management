import express from 'express';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';
import { readLogFiles, getLogStatistics } from '../middleware/fileActivityLogger.js';

const router = express.Router();

// Get activity logs from files
router.get('/file-activity-logs', authenticateUser, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      userId, 
      module, 
      startDate, 
      endDate,
      action 
    } = req.query;
    
    const offset = (page - 1) * limit;

    // Read logs from files
    let logs = await readLogFiles(startDate, endDate, 10000); // Get more for filtering

    // Apply filters
    if (userId) {
      logs = logs.filter(log => log.user_id === userId);
    }
    if (module) {
      logs = logs.filter(log => log.module === module);
    }
    if (action) {
      logs = logs.filter(log => log.action === action);
    }

    // Calculate pagination
    const total = logs.length;
    const paginatedLogs = logs.slice(offset, offset + parseInt(limit));

    res.json({
      success: true,
      data: paginatedLogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting file activity logs:', error);
    res.status(500).json({
      success: false,
      error: 'Error getting file activity logs'
    });
  }
});

// Get activity logs for a specific user from files
router.get('/file-activity-logs/:userId', authenticateUser, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, startDate, endDate } = req.query;

    let logs = await readLogFiles(startDate, endDate, parseInt(limit) * 2);
    
    // Filter by user
    logs = logs.filter(log => log.user_id === userId);
    
    // Apply limit
    logs = logs.slice(0, parseInt(limit));

    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('Error getting user file activity logs:', error);
    res.status(500).json({
      success: false,
      error: 'Error getting user file activity logs'
    });
  }
});

// Get activity statistics from files
router.get('/file-activity-stats', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const stats = await getLogStatistics(startDate, endDate);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting file activity statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Error getting file activity statistics'
    });
  }
});

// Export activity logs to JSON file
router.get('/export-file-logs', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate, format = 'json' } = req.query;

    const logs = await readLogFiles(startDate, endDate, 50000); // Large limit for export

    if (format === 'csv') {
      // Convert to CSV format
      if (logs.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'No logs found for export'
        });
      }

      const headers = Object.keys(logs[0]).join(',');
      const csvRows = logs.map(log => 
        Object.values(log).map(value => 
          typeof value === 'string' && value.includes(',') 
            ? `"${value.replace(/"/g, '""')}"` 
            : value
        ).join(',')
      );
      
      const csvContent = [headers, ...csvRows].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="activity-logs-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);
    } else {
      // JSON format
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="activity-logs-${new Date().toISOString().split('T')[0]}.json"`);
      res.json({
        success: true,
        data: logs,
        exportInfo: {
          totalRecords: logs.length,
          exportDate: new Date().toISOString(),
          dateRange: { startDate, endDate }
        }
      });
    }
  } catch (error) {
    console.error('Error exporting file logs:', error);
    res.status(500).json({
      success: false,
      error: 'Error exporting file logs'
    });
  }
});

// Get log file information
router.get('/log-files-info', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    const { fileURLToPath } = await import('url');

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const LOGS_DIR = path.join(__dirname, '..', 'logs');

    try {
      const files = await fs.readdir(LOGS_DIR);
      const logFiles = files
        .filter(file => file.startsWith('activity-') && file.endsWith('.log'))
        .map(async file => {
          const filePath = path.join(LOGS_DIR, file);
          const stats = await fs.stat(filePath);
          return {
            name: file,
            size: stats.size,
            sizeFormatted: formatFileSize(stats.size),
            created: stats.birthtime,
            modified: stats.mtime,
            path: filePath
          };
        });

      const fileInfo = await Promise.all(logFiles);
      fileInfo.sort((a, b) => b.modified - a.modified);

      res.json({
        success: true,
        data: {
          files: fileInfo,
          totalFiles: fileInfo.length,
          totalSize: fileInfo.reduce((sum, file) => sum + file.size, 0),
          totalSizeFormatted: formatFileSize(fileInfo.reduce((sum, file) => sum + file.size, 0))
        }
      });
    } catch (error) {
      res.json({
        success: true,
        data: {
          files: [],
          totalFiles: 0,
          totalSize: 0,
          totalSizeFormatted: '0 B',
          error: 'Logs directory not found or empty'
        }
      });
    }
  } catch (error) {
    console.error('Error getting log files info:', error);
    res.status(500).json({
      success: false,
      error: 'Error getting log files info'
    });
  }
});

// Helper function to format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default router;
