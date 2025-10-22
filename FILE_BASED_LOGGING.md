# File-Based Activity Logging System

This system provides an alternative to database-based activity logging by saving logs to temporary files instead of the database. This approach is useful for:

- **Performance**: Avoids database overhead for logging
- **Temporary Storage**: Logs are stored in files that can be easily cleaned up
- **Debugging**: Easy to inspect log files directly
- **Backup**: Simple file-based backup and export

## Features

- ✅ **File-based logging** instead of database storage
- ✅ **Automatic file rotation** when files get too large (10MB limit)
- ✅ **Automatic cleanup** of old log files (keeps max 5 files)
- ✅ **Daily log files** with date-based naming
- ✅ **JSON format** for easy parsing and analysis
- ✅ **Export functionality** (JSON and CSV formats)
- ✅ **Statistics and analytics** from log files
- ✅ **File management** endpoints

## File Structure

```
backend/
├── logs/                          # Log files directory
│   ├── activity-2024-01-15.log   # Daily log files
│   ├── activity-2024-01-16.log
│   └── activity-2024-01-17.log
├── middleware/
│   └── fileActivityLogger.js     # File logging middleware
└── routes/
    └── fileActivityLogs.js       # File logging API routes
```

## Usage

### 1. Middleware Usage

#### Before Request Processing
```javascript
import { logUserActivityToFile } from '../middleware/fileActivityLogger.js';

// Log activity before processing the request
router.get('/users', authenticateUser, logUserActivityToFile('VIEW', 'USERS'), async (req, res) => {
  // Your route logic here
});
```

#### After Response
```javascript
import { logUserActivityToFileAfter } from '../middleware/fileActivityLogger.js';

// Log activity after successful response
router.post('/users', authenticateUser, logUserActivityToFileAfter('CREATE', 'USERS'), async (req, res) => {
  // Your route logic here
});
```

### 2. Manual Logging

```javascript
import { logActivityToFile } from '../middleware/fileActivityLogger.js';

// Manual logging anywhere in your code
await logActivityToFile(
  userId,
  userName,
  'CUSTOM_ACTION',
  'MODULE_NAME',
  { customData: 'some value' },
  ipAddress
);
```

### 3. API Endpoints

#### Get Activity Logs
```http
GET /api/file-activity/file-activity-logs
```

Query Parameters:
- `page` (default: 1) - Page number
- `limit` (default: 50) - Items per page
- `userId` - Filter by user ID
- `module` - Filter by module
- `action` - Filter by action
- `startDate` - Start date filter (ISO format)
- `endDate` - End date filter (ISO format)

#### Get User-Specific Logs
```http
GET /api/file-activity/file-activity-logs/:userId
```

#### Get Statistics
```http
GET /api/file-activity/file-activity-stats
```

#### Export Logs
```http
GET /api/file-activity/export-file-logs?format=json
GET /api/file-activity/export-file-logs?format=csv
```

#### Get Log Files Info
```http
GET /api/file-activity/log-files-info
```

## Log Entry Format

Each log entry is stored as a JSON object with the following structure:

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "user_id": "user123",
  "user_name": "john_doe",
  "action": "CREATE",
  "module": "USERS",
  "details": {
    "customData": "some value"
  },
  "ip_address": "192.168.1.1",
  "method": "POST",
  "url": "/api/users",
  "status_code": 201,
  "user_agent": "Mozilla/5.0..."
}
```

## Configuration

### File Size and Rotation
- **Max file size**: 10MB per file
- **Max files**: 5 files kept
- **Rotation**: Automatic when file exceeds size limit
- **Cleanup**: Oldest files are deleted when limit is reached

### Log Directory
- **Default location**: `backend/logs/`
- **File naming**: `activity-YYYY-MM-DD.log`
- **Format**: JSON lines (one JSON object per line)

## Migration from Database Logging

To migrate from database-based logging to file-based logging:

1. **Replace middleware imports**:
   ```javascript
   // Old
   import { logUserActivity } from '../middleware/activityLogger.js';
   
   // New
   import { logUserActivityToFile } from '../middleware/fileActivityLogger.js';
   ```

2. **Update route middleware**:
   ```javascript
   // Old
   router.get('/users', authenticateUser, logUserActivity('VIEW', 'USERS'), handler);
   
   // New
   router.get('/users', authenticateUser, logUserActivityToFile('VIEW', 'USERS'), handler);
   ```

3. **Update API endpoints**:
   ```javascript
   // New
   GET /api/file-activity/file-activity-logs
   ```

## Advantages of File-Based Logging

1. **Performance**: No database queries for logging
2. **Simplicity**: Easy to inspect and debug
3. **Flexibility**: Easy to implement custom log processing
4. **Temporary**: Files can be easily cleaned up
5. **Portable**: Logs can be easily moved or backed up
6. **Format**: JSON format is easy to parse and analyze

## Disadvantages

1. **Persistence**: Files are not permanent (can be deleted)
2. **Search**: No built-in search capabilities
3. **Concurrent Access**: Multiple processes writing to same file
4. **Storage**: Files consume disk space
5. **Backup**: Requires manual backup strategy

## Best Practices

1. **Use appropriate middleware**: Choose between `logUserActivityToFile` and `logUserActivityToFileAfter` based on your needs
2. **Include relevant details**: Add meaningful information in the `details` field
3. **Monitor file sizes**: Keep an eye on log file sizes and cleanup
4. **Regular exports**: Export logs periodically for long-term storage
5. **Error handling**: Always handle logging errors gracefully

## Example Implementation

See `backend/routes/exampleFileLogging.js` for complete examples of how to implement file-based logging in your routes.

## Troubleshooting

### Common Issues

1. **Logs directory not created**: The system automatically creates the logs directory, but ensure proper permissions
2. **File rotation not working**: Check file permissions and disk space
3. **Logs not appearing**: Verify middleware is properly applied and user is authenticated
4. **Export errors**: Ensure sufficient disk space for export operations

### Debug Commands

```bash
# Check log files
ls -la backend/logs/

# View latest log file
tail -f backend/logs/activity-$(date +%Y-%m-%d).log

# Check file sizes
du -h backend/logs/*
```
