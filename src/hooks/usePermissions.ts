import { useAuth } from '../context/AuthContext';
import { ROLE_PERMISSIONS } from '../types';

export const usePermissions = () => {
  const { user } = useAuth();

  const hasPermission = (module: string, action: 'canView' | 'canCreate' | 'canEdit' | 'canDelete' | 'canExport'): boolean => {
    if (!user) {
      console.log('usePermissions: No user');
      return false;
    }
    
    // Map database role to permission role
    const roleMapping: { [key: string]: string } = {
      'admin': 'Administrator',
      'manager': 'Menaxher',
      'marketer': 'Marketer',
      'designer': 'Dizajner',
      'sales_agent': 'Agjent shitjeje',
      'support_agent': 'Agjent mbështetje',
      'technician': 'Serviser'
    };
    
    const mappedRole = roleMapping[user.role] || user.role;
    console.log('usePermissions: User role:', user.role, '-> Mapped to:', mappedRole);
    console.log('usePermissions: Available roles:', Object.keys(ROLE_PERMISSIONS));
    
    const rolePermissions = ROLE_PERMISSIONS[mappedRole as keyof typeof ROLE_PERMISSIONS];
    if (!rolePermissions) {
      console.log('usePermissions: No permissions found for role:', mappedRole);
      return false;
    }
    
    const modulePermissions = rolePermissions[module as keyof typeof rolePermissions];
    if (!modulePermissions) {
      console.log('usePermissions: No module permissions found for:', module);
      return false;
    }
    
    const result = modulePermissions[action];
    console.log(`usePermissions: ${mappedRole} can ${action} ${module}:`, result);
    return result;
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
