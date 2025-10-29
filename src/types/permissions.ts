export type PermissionRole =
  | 'judge'
  | 'head_judge'
  | 'operations'
  | 'admin'
  | 'owner';

export const ADMIN_ROLES: PermissionRole[] = ['head_judge', 'operations', 'admin', 'owner'];

export function isAdminRole(role: PermissionRole | null | undefined): role is PermissionRole {
  if (!role) {
    return false;
  }

  return ADMIN_ROLES.includes(role);
}
