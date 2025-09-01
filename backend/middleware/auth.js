import { supabase } from '../config/supabase.js';

// Middleware për të verifikuar autentifikimin
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Token i autentifikimit mungon' 
      });
    }

    const token = authHeader.substring(7); // Heq 'Bearer ' nga fillimi

    // Verifikon token-in me Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ 
        error: 'Token i pavlefshëm' 
      });
    }

    // Merr profilin e përdoruesit nga tabela users
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      return res.status(401).json({ 
        error: 'Profili i përdoruesit nuk u gjet' 
      });
    }

    // Shton të dhënat e përdoruesit në req për t'u përdorur në routes
    req.user = userProfile;
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
  if (req.user.role !== 'admin') {
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