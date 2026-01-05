
import { UserRole } from '../types';

export type PermissionAction = 
  | 'view_dashboard'
  | 'manage_all_products'
  | 'manage_all_orders'
  | 'manage_own_orders'
  | 'view_all_clients'
  | 'create_client'
  | 'delete_client'
  | 'manage_sellers'
  | 'view_catalog'
  | 'create_order'
  | 'order_status_in_progress'
  | 'order_status_invoiced'
  | 'order_status_cancelled';

const ROLE_PERMISSIONS: Record<UserRole, PermissionAction[] | '*'> = {
  [UserRole.MANAGER]: '*', // Acesso total
  [UserRole.SELLER]: [
    'view_dashboard',
    'manage_own_orders',
    'view_all_clients', // Pode ver para selecionar
    'create_client',    // Permissão concedida
    'order_status_in_progress',
    'order_status_invoiced',
    'order_status_cancelled'
  ],
  [UserRole.CLIENT]: [
    'view_catalog',
    'create_order'
  ]
};

/**
 * Verifica se um determinado perfil tem permissão para realizar uma ação.
 * @param role O papel do usuário (manager, seller, client)
 * @param action A ação que se deseja realizar
 */
export const can = (role: UserRole, action: PermissionAction): boolean => {
  const permissions = ROLE_PERMISSIONS[role];
  
  if (!permissions) return false;
  if (permissions === '*') return true;
  
  return permissions.includes(action);
};
