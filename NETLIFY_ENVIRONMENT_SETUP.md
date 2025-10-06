# Netlify Environment Variables Setup

## Required Environment Variables for Netlify

Add these environment variables in your Netlify dashboard:

### 1. Go to Netlify Dashboard
1. Navigate to your site
2. Go to Site settings → Environment variables
3. Add the following variables:

### 2. Frontend Variables
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=https://startech-management.onrender.com
```

### 3. Important Notes
- **VITE_API_URL**: This should point to your backend (Render.com)
- **Custom Domain**: After adding custom domain, you may need to update VITE_API_URL
- **Redeploy**: After adding environment variables, redeploy your site

## Current Issues Fixed

✅ **CORS Configuration**: Added `https://menaxhimi.startech24.com` to backend CORS origins
✅ **API Configuration**: Updated frontend to use environment variables
✅ **WooCommerce Integration**: Backend has proper WooCommerce API configuration

## Next Steps

1. **Add Environment Variables** in Netlify dashboard
2. **Redeploy** your site
3. **Test** the application with your custom domain
4. **Check** WooCommerce sync functionality

## Troubleshooting

### API Not Working
- Check if `VITE_API_URL` is correctly set
- Verify backend is running on Render
- Check browser console for CORS errors

### WooCommerce Not Syncing
- Verify WooCommerce credentials in backend environment
- Check if WooCommerce store URL is correct
- Ensure WooCommerce API is enabled in your store

### Authentication Issues
- Verify Supabase environment variables
- Check if user exists in Supabase users table
- Ensure proper role assignment (admin/user)
