import { useAuth } from '../context/AuthContext';
import { ROLE_PERMISSIONS } from '../types';

export const usePermissions = () => {
  const { user } = useAuth();

  const hasPermission = (module: string, action: 'canView' | 'canCreate' | 'canEdit' | 'canDelete' | 'canExport'): boolean => {
    if (!user) return false;
    
    const rolePermissions = ROLE_PERMISSIONS[user.role as keyof typeof ROLE_PERMISSIONS];
    if (!rolePermissions) return false;
    
    const modulePermissions = rolePermissions[module as keyof typeof rolePermissions];
    if (!modulePermissions) return false;
    
    return modulePermissions[action];
  };

  const canView = (module: string) => hasPermission(module, 'canView');
  const canCreate = (module: string) => hasPermission(module, 'canCreate');
  const canEdit = (module: string) => hasPermission(module, 'canEdit');
  const canDelete = (module: string) => hasPermission(module, 'canDelete');
  const canExport = (module: string) => hasPermission(module, 'canExport');

  const canEditOrDelete = (module: string) => canEdit(module) && canDelete(module);

  return {
    hasPermission,
    canView,
    canCreate,
    canEdit,
    canDelete,
    canExport,
    canEditOrDelete,
    userRole: user?.role
  };
};
