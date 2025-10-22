import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create logs directory if it doesn't exist
const LOGS_DIR = path.join(__dirname, '..', 'logs');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file
const MAX_FILES = 5; // Keep max 5 log files

// Ensure logs directory exists
const ensureLogsDir = async () => {
  try {
    await fs.access(LOGS_DIR);
  } catch {
    await fs.mkdir(LOGS_DIR, { recursive: true });
  }
};

// Get current log file path
const getCurrentLogFile = () => {
  const today = new Date().toISOString().split('T')[0];
  return path.join(LOGS_DIR, `activity-${today}.log`);
};

// Write to log file
const writeToLogFile = async (logData) => {
  try {
    await ensureLogsDir();
    const logFile = getCurrentLogFile();
    
    // Check file size and rotate if needed
    try {
      const stats = await fs.stat(logFile);
      if (stats.size > MAX_FILE_SIZE) {
        await rotateLogFile(logFile);
      }
    } catch {
      // File doesn't exist, that's fine
    }

    // Format log entry
    const logEntry = {
      timestamp: new Date().toISOString(),
      ...logData
    };

    // Append to log file
    await fs.appendFile(logFile, JSON.stringify(logEntry) + '\n');
    
    // Clean up old files
    await cleanupOldLogs();
  } catch (error) {
    console.error('Error writing to log file:', error);
  }
};

// Rotate log file when it gets too large
const rotateLogFile = async (currentFile) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const rotatedFile = currentFile.replace('.log', `-${timestamp}.log`);
    await fs.rename(currentFile, rotatedFile);
  } catch (error) {
    console.error('Error rotating log file:', error);
  }
};

// Clean up old log files
const cleanupOldLogs = async () => {
  try {
    const files = await fs.readdir(LOGS_DIR);
    const logFiles = files
      .filter(file => file.startsWith('activity-') && file.endsWith('.log'))
      .map(file => ({
        name: file,
        path: path.join(LOGS_DIR, file),
        stats: null
      }));

    // Get file stats
    for (const file of logFiles) {
      try {
        file.stats = await fs.stat(file.path);
      } catch {
        // File might have been deleted
      }
    }

    // Sort by modification time (oldest first)
    const validFiles = logFiles.filter(f => f.stats);
    validFiles.sort((a, b) => a.stats.mtime - b.stats.mtime);

    // Remove old files if we have too many
    if (validFiles.length > MAX_FILES) {
      const filesToDelete = validFiles.slice(0, validFiles.length - MAX_FILES);
      for (const file of filesToDelete) {
        try {
          await fs.unlink(file.path);
          console.log(`Deleted old log file: ${file.name}`);
        } catch (error) {
          console.error(`Error deleting log file ${file.name}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Error cleaning up old logs:', error);
  }
};

// Middleware for logging user activity to files
export const logUserActivityToFile = (action, module, details = null) => {
  return async (req, res, next) => {
    try {
      // Log activity if user is authenticated
      if (req.user && req.user.id) {
        const activityData = {
          user_id: req.user.id,
          user_name: req.user.email?.split('@')[0] || req.user.name || 'Unknown',
          action: action,
          module: module,
          details: details,
          ip_address: req.ip || req.connection.remoteAddress,
          method: req.method,
          url: req.originalUrl,
          user_agent: req.get('User-Agent')
        };

        // Write to file asynchronously (don't wait)
        writeToLogFile(activityData).catch(error => {
          console.error('Error writing activity to file:', error);
        });
      }
    } catch (error) {
      console.error('Error in file activity logging middleware:', error);
      // Don't stop the request if logging fails
    }
    
    next();
  };
};

// Middleware for logging user activity after response
export const logUserActivityToFileAfter = (action, module, details = null) => {
  return async (req, res, next) => {
    // Log activity after response
    res.on('finish', async () => {
      try {
        if (req.user && req.user.id && res.statusCode >= 200 && res.statusCode < 300) {
          const activityData = {
            user_id: req.user.id,
            user_name: req.user.email?.split('@')[0] || req.user.name || 'Unknown',
            action: action,
            module: module,
            details: details,
            ip_address: req.ip || req.connection.remoteAddress,
            method: req.method,
            url: req.originalUrl,
            status_code: res.statusCode,
            user_agent: req.get('User-Agent')
          };

          // Write to file asynchronously
          writeToLogFile(activityData).catch(error => {
            console.error('Error writing activity to file:', error);
          });
        }
      } catch (error) {
        console.error('Error in file activity logging after response:', error);
      }
    });
    
    next();
  };
};

// Function for manual activity logging to files
export const logActivityToFile = async (userId, userName, action, module, details = null, ipAddress = null) => {
  try {
    // Check if userId is valid
    if (!userId) {
      console.warn('File activity logging skipped: userId is null or undefined');
      return;
    }

    const activityData = {
      user_id: userId,
      user_name: userName || 'Unknown',
      action: action,
      module: module,
      details: details,
      ip_address: ipAddress,
      type: 'manual'
    };

    console.log('Logging activity to file:', activityData);
    await writeToLogFile(activityData);
    console.log('Activity logged to file successfully');
  } catch (error) {
    console.error('Error logging activity to file:', error);
  }
};

// Function to read log files
export const readLogFiles = async (startDate = null, endDate = null, limit = 100) => {
  try {
    await ensureLogsDir();
    const files = await fs.readdir(LOGS_DIR);
    const logFiles = files
      .filter(file => file.startsWith('activity-') && file.endsWith('.log'))
      .sort()
      .reverse(); // Most recent first

    let allLogs = [];

    for (const file of logFiles) {
      try {
        const filePath = path.join(LOGS_DIR, file);
        const content = await fs.readFile(filePath, 'utf8');
        const lines = content.trim().split('\n').filter(line => line.trim());
        
        const fileLogs = lines.map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        }).filter(log => log !== null);

        allLogs = allLogs.concat(fileLogs);
      } catch (error) {
        console.error(`Error reading log file ${file}:`, error);
      }
    }

    // Sort by timestamp (most recent first)
    allLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Apply date filters
    if (startDate) {
      allLogs = allLogs.filter(log => new Date(log.timestamp) >= new Date(startDate));
    }
    if (endDate) {
      allLogs = allLogs.filter(log => new Date(log.timestamp) <= new Date(endDate));
    }

    // Apply limit
    return allLogs.slice(0, limit);
  } catch (error) {
    console.error('Error reading log files:', error);
    return [];
  }
};

// Function to get log statistics
export const getLogStatistics = async (startDate = null, endDate = null) => {
  try {
    const logs = await readLogFiles(startDate, endDate, 10000); // Get more logs for stats

    const stats = {
      totalActions: logs.length,
      actionsByModule: {},
      actionsByUser: {},
      actionsByDay: {},
      topUsers: [],
      topModules: [],
      actionsByHour: {},
      uniqueUsers: new Set(),
      uniqueIPs: new Set()
    };

    logs.forEach(log => {
      // Statistics by module
      stats.actionsByModule[log.module] = (stats.actionsByModule[log.module] || 0) + 1;
      
      // Statistics by user
      stats.actionsByUser[log.user_name] = (stats.actionsByUser[log.user_name] || 0) + 1;
      
      // Statistics by day
      const day = new Date(log.timestamp).toISOString().split('T')[0];
      stats.actionsByDay[day] = (stats.actionsByDay[day] || 0) + 1;

      // Statistics by hour
      const hour = new Date(log.timestamp).getHours();
      stats.actionsByHour[hour] = (stats.actionsByHour[hour] || 0) + 1;

      // Unique users and IPs
      stats.uniqueUsers.add(log.user_id);
      if (log.ip_address) {
        stats.uniqueIPs.add(log.ip_address);
      }
    });

    // Top users
    stats.topUsers = Object.entries(stats.actionsByUser)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([user, count]) => ({ user, count }));

    // Top modules
    stats.topModules = Object.entries(stats.actionsByModule)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([module, count]) => ({ module, count }));

    // Convert sets to counts
    stats.uniqueUsersCount = stats.uniqueUsers.size;
    stats.uniqueIPsCount = stats.uniqueIPs.size;
    delete stats.uniqueUsers;
    delete stats.uniqueIPs;

    return stats;
  } catch (error) {
    console.error('Error getting log statistics:', error);
    return {
      totalActions: 0,
      actionsByModule: {},
      actionsByUser: {},
      actionsByDay: {},
      topUsers: [],
      topModules: [],
      actionsByHour: {},
      uniqueUsersCount: 0,
      uniqueIPsCount: 0
    };
  }
};

export default {
  logUserActivityToFile,
  logUserActivityToFileAfter,
  logActivityToFile,
  readLogFiles,
  getLogStatistics
};
