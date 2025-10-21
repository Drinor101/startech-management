import { supabase } from '../config/supabase.js';

// Middleware për të verifikuar autentifikimin
const authenticateUser = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    
    console.log('Auth middleware - Headers:', req.headers);
    console.log('Auth middleware - User ID:', userId);
    console.log('Auth middleware - URL:', req.url);
    console.log('Auth middleware - Method:', req.method);
    
    if (!userId) {
      console.log('Auth middleware - No user ID provided');
      return res.status(401).json({ 
        error: 'User ID mungon' 
      });
    }

    // Merr profilin e përdoruesit nga tabela users
    console.log('Auth middleware - Fetching user profile for ID:', userId);
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    console.log('Auth middleware - User profile:', userProfile);
    console.log('Auth middleware - Profile error:', profileError);

    if (profileError || !userProfile) {
      console.log('Auth middleware - User profile not found or error');
      return res.status(401).json({ 
        error: 'Profili i përdoruesit nuk u gjet' 
      });
    }

    // Shton të dhënat e përdoruesit në req për t'u përdorur në routes
    req.user = userProfile;
    console.log('Auth middleware - User authenticated successfully:', userProfile.email);
    next();
  } catch (error) {
    console.error('Gabim në autentifikim:', error);
    res.status(500).json({ 
      error: 'Gabim i brendshëm në autentifikim' 
    });
  }
};

// Middleware për të verifikuar rolin e adminit
const requireAdmin = (req, res, next) => {
  const userRole = req.user.role?.toLowerCase();
  const isAdmin = userRole === 'admin' || userRole === 'administrator';
  
  if (!isAdmin) {
    return res.status(403).json({ 
      error: 'Kërkohet roli i adminit' 
    });
  }
  next();
};

export {
  authenticateUser,
  requireAdmin
};