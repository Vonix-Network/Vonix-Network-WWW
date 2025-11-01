/**
 * Role-Based Access Control (RBAC) Utilities
 * Centralized permission checking for enterprise-grade security
 */

import { UserRole } from '@/types/next-auth';

export interface Permission {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'moderate' | '*';
}

/**
 * Role hierarchy (higher roles inherit lower role permissions)
 * superadmin (4) > admin (3) > moderator (2) > user (1)
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  user: 1,
  moderator: 2,
  admin: 3,
  superadmin: 4, // Highest privilege, can only be assigned via database
};

/**
 * Permission matrix defining what each role can do
 */
const PERMISSIONS: Record<UserRole, Permission[]> = {
  user: [
    { resource: 'post', action: 'create' },
    { resource: 'post', action: 'read' },
    { resource: 'comment', action: 'create' },
    { resource: 'comment', action: 'read' },
    { resource: 'profile', action: 'read' },
    { resource: 'profile', action: 'update' }, // Own profile only
    { resource: 'message', action: 'create' },
    { resource: 'message', action: 'read' },
  ],
  moderator: [
    // Inherits all user permissions
    { resource: 'post', action: 'moderate' },
    { resource: 'post', action: 'delete' }, // Any post
    { resource: 'comment', action: 'moderate' },
    { resource: 'comment', action: 'delete' }, // Any comment
    { resource: 'forum', action: 'moderate' },
    { resource: 'report', action: 'read' },
    { resource: 'report', action: 'update' },
  ],
  admin: [
    // Inherits all moderator and user permissions
    { resource: '*', action: 'create' },
    { resource: '*', action: 'read' },
    { resource: '*', action: 'update' },
    { resource: '*', action: 'delete' },
    { resource: '*', action: 'moderate' },
    { resource: 'user', action: 'moderate' }, // Can modify users/moderators, but NOT superadmins
    { resource: 'settings', action: 'update' },
    { resource: 'rank', action: 'create' },
    { resource: 'rank', action: 'update' },
    { resource: 'rank', action: 'delete' },
  ],
  superadmin: [
    // Inherits all admin, moderator, and user permissions
    // Plus additional superadmin-only permissions
    { resource: '*', action: '*' }, // Full access to everything
    { resource: 'superadmin', action: '*' }, // Can manage other superadmins
    { resource: 'system', action: '*' }, // System-level access
  ],
};

export class RBAC {
  /**
   * Check if a role has a specific permission
   */
  static hasPermission(
    userRole: UserRole | undefined,
    resource: string,
    action: Permission['action']
  ): boolean {
    if (!userRole) return false;

    // Superadmin and admin have all permissions
    if (userRole === 'superadmin' || userRole === 'admin') return true;

    // Get all permissions for this role and inherited roles
    const permissions = this.getAllPermissions(userRole);

    // Check for exact match or wildcard
    return permissions.some(
      (p) =>
        (p.resource === resource || p.resource === '*') &&
        (p.action === action || p.action === '*')
    );
  }

  /**
   * Get all permissions for a role including inherited permissions
   */
  static getAllPermissions(userRole: UserRole): Permission[] {
    const roleLevel = ROLE_HIERARCHY[userRole];
    const allPermissions: Permission[] = [];

    // Add permissions from all roles up to and including this role
    Object.entries(ROLE_HIERARCHY).forEach(([role, level]) => {
      if (level <= roleLevel) {
        allPermissions.push(...PERMISSIONS[role as UserRole]);
      }
    });

    return allPermissions;
  }

  /**
   * Check if user can perform action on their own resource
   */
  static canModifyOwn(
    userRole: UserRole | undefined,
    resource: string,
    isOwner: boolean
  ): boolean {
    if (!userRole) return false;
    if (!isOwner) return false;

    // Users can modify their own resources
    if (resource === 'post' || resource === 'comment' || resource === 'profile') {
      return true;
    }

    return false;
  }

  /**
   * Check if user is a superadmin
   */
  static isSuperAdmin(userRole: UserRole | undefined): boolean {
    return userRole === 'superadmin';
  }

  /**
   * Check if user can access admin panel
   */
  static canAccessAdmin(userRole: UserRole | undefined): boolean {
    return userRole === 'admin' || userRole === 'superadmin';
  }

  /**
   * Check if user can access moderation tools
   */
  static canAccessModeration(userRole: UserRole | undefined): boolean {
    return userRole === 'admin' || userRole === 'moderator' || userRole === 'superadmin';
  }

  /**
   * Check if a user can modify another user
   * Superadmins cannot be modified by anyone except other superadmins
   * Admins cannot be modified by moderators
   */
  static canModifyUser(
    modifierRole: UserRole | undefined,
    targetRole: UserRole
  ): boolean {
    if (!modifierRole) return false;

    // Superadmins can modify anyone
    if (modifierRole === 'superadmin') return true;

    // Admins cannot modify superadmins
    if (targetRole === 'superadmin') return false;

    // Admins can modify admins, moderators, and users
    if (modifierRole === 'admin') {
      return targetRole === 'admin' || targetRole === 'moderator' || targetRole === 'user';
    }

    // Moderators cannot modify anyone's role
    return false;
  }

  /**
   * Check if a role can be assigned by the current user
   * Superadmin role can only be assigned via direct database access
   */
  static canAssignRole(
    assignerRole: UserRole | undefined,
    roleToAssign: UserRole
  ): boolean {
    if (!assignerRole) return false;

    // Superadmin role can NEVER be assigned through the UI
    if (roleToAssign === 'superadmin') return false;

    // Superadmins can assign any role except superadmin
    if (assignerRole === 'superadmin') return true;

    // Admins can assign moderator and user roles, but not admin or superadmin
    if (assignerRole === 'admin') {
      return roleToAssign === 'moderator' || roleToAssign === 'user';
    }

    // Moderators cannot assign roles
    return false;
  }

  /**
   * Check if user can create events
   */
  static canCreateEvents(userRole: UserRole | undefined): boolean {
    return this.canAccessModeration(userRole);
  }

  /**
   * Check if user can manage users
   */
  static canManageUsers(userRole: UserRole | undefined): boolean {
    return userRole === 'admin';
  }

  /**
   * Check if user can manage donation ranks
   */
  static canManageDonationRanks(userRole: UserRole | undefined): boolean {
    return userRole === 'admin';
  }

  /**
   * Check if user can pin/lock forum posts
   */
  static canPinLockPosts(userRole: UserRole | undefined): boolean {
    return this.canAccessModeration(userRole);
  }

  /**
   * Check if user can delete any content (not just their own)
   */
  static canDeleteAnyContent(userRole: UserRole | undefined): boolean {
    return this.canAccessModeration(userRole);
  }

  /**
   * Check if user can view reports
   */
  static canViewReports(userRole: UserRole | undefined): boolean {
    return this.canAccessModeration(userRole);
  }

  /**
   * Get user permissions summary
   */
  static getPermissionsSummary(userRole: UserRole | undefined): {
    role: UserRole | 'guest';
    isSuperAdmin: boolean;
    canAccessAdmin: boolean;
    canAccessModeration: boolean;
    canCreateEvents: boolean;
    canManageUsers: boolean;
    canViewReports: boolean;
  } {
    return {
      role: userRole || 'guest',
      isSuperAdmin: this.isSuperAdmin(userRole),
      canAccessAdmin: this.canAccessAdmin(userRole),
      canAccessModeration: this.canAccessModeration(userRole),
      canCreateEvents: this.canCreateEvents(userRole),
      canManageUsers: this.canManageUsers(userRole),
      canViewReports: this.canViewReports(userRole),
    };
  }
}

/**
 * Helper to check permissions in API routes
 */
export function requirePermission(
  userRole: UserRole | undefined,
  resource: string,
  action: Permission['action']
): { authorized: boolean; error?: string } {
  if (!userRole) {
    return { authorized: false, error: 'Authentication required' };
  }

  if (!RBAC.hasPermission(userRole, resource, action)) {
    return { authorized: false, error: 'Insufficient permissions' };
  }

  return { authorized: true };
}

/**
 * Helper to check if user is admin
 */
export function requireAdmin(userRole: UserRole | undefined): {
  authorized: boolean;
  error?: string;
} {
  if (!userRole) {
    return { authorized: false, error: 'Authentication required' };
  }

  if (!RBAC.canAccessAdmin(userRole)) {
    return { authorized: false, error: 'Admin access required' };
  }

  return { authorized: true };
}

/**
 * Helper to check if user is moderator or admin
 */
export function requireModerator(userRole: UserRole | undefined): {
  authorized: boolean;
  error?: string;
} {
  if (!userRole) {
    return { authorized: false, error: 'Authentication required' };
  }

  if (!RBAC.canAccessModeration(userRole)) {
    return { authorized: false, error: 'Moderator access required' };
  }

  return { authorized: true };
}

/**
 * Helper to check if user is superadmin
 */
export function requireSuperAdmin(userRole: UserRole | undefined): {
  authorized: boolean;
  error?: string;
} {
  if (!userRole) {
    return { authorized: false, error: 'Authentication required' };
  }

  if (!RBAC.isSuperAdmin(userRole)) {
    return { authorized: false, error: 'Superadmin access required' };
  }

  return { authorized: true };
}
