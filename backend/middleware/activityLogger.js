import { supabase } from '../config/supabase.js';

// Middleware për të ruajtur aktivitetet e përdoruesve
export const logUserActivity = (action, module, details = null) => {
  return async (req, res, next) => {
    try {
      // Ruaj aktivitetin nëse ka përdorues të autentifikuar
      if (req.user && req.user.id) {
        const activityData = {
          user_id: req.user.id,
          user_name: req.user.email?.split('@')[0] || req.user.name || 'Unknown',
          action: action,
          module: module,
          details: details,
          timestamp: new Date().toISOString(),
          ip_address: req.ip || req.connection.remoteAddress
        };

        // Ruaj në user_actions tabelën
        await supabase
          .from('user_actions')
          .insert(activityData);
      }
    } catch (error) {
      console.error('Gabim në ruajtjen e aktivitetit:', error);
      // Mos ndaloj request-in nëse logging-u dështon
    }
    
    next();
  };
};

// Middleware për të ruajtur aktivitetet pas përgjigjes
export const logUserActivityAfter = (action, module, details = null) => {
  return async (req, res, next) => {
    // Ruaj aktivitetin pas përgjigjes
    res.on('finish', async () => {
      try {
        if (req.user && req.user.id && res.statusCode >= 200 && res.statusCode < 300) {
          const activityData = {
            user_id: req.user.id,
            user_name: req.user.email?.split('@')[0] || req.user.name || 'Unknown',
            action: action,
            module: module,
            details: details,
            timestamp: new Date().toISOString(),
            ip_address: req.ip || req.connection.remoteAddress
          };

          await supabase
            .from('user_actions')
            .insert(activityData);
        }
      } catch (error) {
        console.error('Gabim në ruajtjen e aktivitetit:', error);
      }
    });
    
    next();
  };
};

// Funksion për të ruajtur aktivitetin manualisht
export const logActivity = async (userId, userName, action, module, details = null, ipAddress = null) => {
  try {
    const activityData = {
      user_id: userId,
      user_name: userName,
      action: action,
      module: module,
      details: details,
      timestamp: new Date().toISOString(),
      ip_address: ipAddress
    };

    const { error } = await supabase
      .from('user_actions')
      .insert(activityData);

    if (error) {
      console.error('Gabim në ruajtjen e aktivitetit:', error);
    }
  } catch (error) {
    console.error('Gabim në ruajtjen e aktivitetit:', error);
  }
};
