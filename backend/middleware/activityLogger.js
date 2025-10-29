import { supabase } from '../config/supabase.js';

// Middleware për të ruajtur aktivitetet e përdoruesve në tabelën activity_logs
export const logUserActivity = (action, module, details = null) => {
  return async (req, res, next) => {
    try {
      // Ruaj aktivitetin nëse ka përdorues të autentifikuar
      if (req.user && req.user.id) {
        const activityData = {
          user_id: req.user.id,
          user_name: req.user.email?.split('@')[0] || req.user.name || 'Unknown',
          user_email: req.user.email || null,
          action: action,
          module: module,
          details: details,
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent') || null,
          method: req.method,
          url: req.originalUrl,
          created_at: new Date().toISOString()
        };

        // Ruaj në activity_logs tabelën
        await supabase
          .from('activity_logs')
          .insert(activityData);
      }
    } catch (error) {
      console.error('Gabim në ruajtjen e aktivitetit:', error);
      // Mos ndaloj request-in nëse logging-u dështon
    }
    
    next();
  };
};

// Middleware për të ruajtur aktivitetet pas përgjigjes në activity_logs
export const logUserActivityAfter = (action, module, details = null) => {
  return async (req, res, next) => {
    // Ruaj aktivitetin pas përgjigjes
    res.on('finish', async () => {
      try {
        if (req.user && req.user.id && res.statusCode >= 200 && res.statusCode < 300) {
          // Merge dynamic details from route if provided
          const mergedDetails = {
            ...(typeof details === 'object' ? details : details ? { message: details } : {}),
            ...(res.locals && res.locals.activityDetails ? res.locals.activityDetails : {})
          };

          const activityData = {
            user_id: req.user.id,
            user_name: req.user.email?.split('@')[0] || req.user.name || 'Unknown',
            user_email: req.user.email || null,
            action: action,
            module: module,
            details: Object.keys(mergedDetails).length ? mergedDetails : null,
            ip_address: req.ip || req.connection.remoteAddress,
            user_agent: req.get('User-Agent') || null,
            method: req.method,
            url: req.originalUrl,
            created_at: new Date().toISOString(),
            // Top-level entity metadata for easier querying
            entity_type: mergedDetails.entity_type || null,
            entity_id: mergedDetails.entity_id || null
          };

          await supabase
            .from('activity_logs')
            .insert(activityData);
        }
      } catch (error) {
        console.error('Gabim në ruajtjen e aktivitetit:', error);
      }
    });
    
    next();
  };
};

// Funksion për të ruajtur aktivitetin manualisht në activity_logs
export const logActivity = async (userId, userName, action, module, details = null, ipAddress = null) => {
  try {
    // Kontrollo nëse userId është valid
    if (!userId) {
      console.warn('Activity logging skipped: userId is null or undefined');
      return;
    }

    const activityData = {
      user_id: userId,
      user_name: userName || 'Unknown',
      user_email: null,
      action: action,
      module: module,
      details: details,
      ip_address: ipAddress,
      user_agent: null,
      method: null,
      url: null,
      created_at: new Date().toISOString()
    };

    console.log('Logging activity:', activityData);

    const { error } = await supabase
      .from('activity_logs')
      .insert(activityData);

    if (error) {
      console.error('Gabim në ruajtjen e aktivitetit:', error);
    } else {
      console.log('Activity logged successfully');
    }
  } catch (error) {
    console.error('Gabim në ruajtjen e aktivitetit:', error);
  }
};
