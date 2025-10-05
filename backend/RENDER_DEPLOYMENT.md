# 🚀 Render Deployment Guide

## Migrating from Railway to Render

This guide will help you migrate your Startech backend from Railway to Render.

### 1. Prerequisites

- GitHub repository with your code
- Supabase project with database
- Render account (free tier available)

### 2. Render Configuration

The project is now configured for Render with:
- ✅ `render.yaml` - Render configuration file
- ✅ `package.json` - Updated with Render-compatible scripts
- ✅ Health check endpoint at `/api/health`
- ✅ Environment variable support

### 3. Deploy to Render

#### Option A: Using Render Dashboard (Recommended)

1. Go to [render.com](https://render.com) and sign up/login
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `startech-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or choose paid plan)

#### Option B: Using render.yaml (Blueprints)

1. Go to [render.com](https://render.com)
2. Click "New +" → "Blueprint"
3. Connect your GitHub repository
4. Render will automatically detect `render.yaml` and configure the service

### 4. Environment Variables

In Render Dashboard, add these environment variables:

```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NODE_ENV=production
PORT=10000
```

**Important**: 
- Get your Supabase URL and Service Role Key from your Supabase dashboard
- The PORT is automatically set by Render, but you can override it

### 5. Domain Configuration

Render will provide a URL like:
`https://startech-backend.onrender.com`

### 6. Update Frontend Configuration

Update your frontend's API configuration to point to the new Render URL:

```typescript
// In src/config/api.ts
const API_BASE_URL = 'https://startech-backend.onrender.com/api';
```

### 7. Testing the Deployment

After deployment, test your API:

```bash
# Health check
curl https://your-app-name.onrender.com/api/health

# Database test
curl https://your-app-name.onrender.com/api/test-db
```

Expected health check response:
```json
{
  "status": "OK",
  "message": "Startech Backend API is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 8. Render vs Railway Comparison

| Feature | Railway | Render |
|---------|---------|--------|
| Free Tier | 500 hours/month | 750 hours/month |
| Auto Deploy | ✅ | ✅ |
| Custom Domain | ✅ | ✅ |
| SSL Certificate | ✅ | ✅ |
| Environment Variables | ✅ | ✅ |
| Health Checks | ✅ | ✅ |
| Logs | ✅ | ✅ |

### 9. Troubleshooting

#### Common Issues:

**Build Fails:**
- Check that all dependencies are in `package.json`
- Ensure Node.js version compatibility (>=18.0.0)

**Environment Variables Not Working:**
- Verify variables are set in Render Dashboard
- Check variable names match exactly (case-sensitive)

**CORS Errors:**
- Update CORS origins in `server.js` to include your Render domain
- Add your frontend domain to the allowed origins

**Database Connection Issues:**
- Verify Supabase URL and Service Role Key
- Check Supabase project is active
- Ensure database tables exist

#### Render-Specific Issues:

**Service Goes to Sleep (Free Plan):**
- Free services sleep after 15 minutes of inactivity
- First request after sleep takes ~30 seconds to respond
- Consider upgrading to paid plan for always-on service

**Build Timeout:**
- Free plan has 90-minute build timeout
- Optimize dependencies or upgrade plan

### 10. Migration Checklist

- [ ] Create Render account
- [ ] Deploy backend to Render
- [ ] Set environment variables
- [ ] Test API endpoints
- [ ] Update frontend API URL
- [ ] Test full application
- [ ] Update domain/DNS if using custom domain
- [ ] Remove Railway deployment (optional)

### 11. Cleanup Railway (Optional)

After successful migration:
1. Go to Railway dashboard
2. Delete the old service
3. Remove Railway-specific files:
   - `railway.json`
   - `Procfile`
   - `RAILWAY_DEPLOYMENT.md`

### 12. Monitoring and Maintenance

- Monitor logs in Render Dashboard
- Set up uptime monitoring
- Regular health checks
- Keep dependencies updated
- Monitor usage on free plan

## 🎉 Success!

Your Startech backend is now running on Render! The migration provides:
- Better free tier limits
- More reliable uptime
- Easier configuration management
- Better documentation and support
