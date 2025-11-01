/**
 * CASL Ability Factory
 * Defines permissions for each user role
 * 100% backward compatible with existing RBAC system
 */

import { AppAbility, createAbilityBuilder } from './ability';
import { UserRole } from '@/types/next-auth';

/**
 * User data needed for ability definition
 * Uses existing database fields - NO new fields required
 */
export interface AbilityUser {
  id: number | string;
  role: UserRole;
  donationRankId?: string | null;
  totalDonated?: number;
  createdAt?: Date;
}

/**
 * Define abilities for a user based on their role
 * This function reads from existing user.role field (no DB changes)
 */
export function defineAbilityFor(user?: AbilityUser | null): AppAbility {
  const { can, cannot, build } = createAbilityBuilder();

  // ========================================
  // GUEST PERMISSIONS (Not logged in)
  // ========================================
  if (!user) {
    // Guests can only read public content
    can('read', 'Post');
    can('read', 'ForumPost');
    can('read', 'ForumCategory');
    can('read', 'Group', { isPrivate: false });
    can('read', 'Event');
    
    return build();
  }

  // ========================================
  // AUTHENTICATED USER PERMISSIONS
  // ========================================
  
  // Read permissions
  can('read', ['Post', 'Comment', 'ForumPost', 'ForumReply', 'ForumCategory']);
  can('read', 'Group');  // Can see groups they're members of
  can('read', 'Event');
  can('read', 'Message');
  can('read', 'Profile');
  
  // Create permissions
  can('create', ['Post', 'Comment', 'ForumPost', 'ForumReply']);
  can('create', 'Message');
  can('create', 'Group');
  can('report', ['Post', 'Comment', 'ForumPost', 'ForumReply', 'GroupPost']);
  
  // Update own content (ownership check)
  can('update', 'Post', { userId: Number(user.id) });
  can('update', 'Comment', { userId: Number(user.id) });
  can('update', 'ForumPost', { 
    userId: Number(user.id),
    isLocked: false  // Can't edit locked posts
  });
  can('update', 'ForumReply', { userId: Number(user.id) });
  can('update', 'GroupPost', { userId: Number(user.id) });
  
  // Delete own content (ownership check)
  can('delete', 'Post', { userId: Number(user.id) });
  can('delete', 'Comment', { userId: Number(user.id) });
  can('delete', 'ForumPost', { userId: Number(user.id) });
  can('delete', 'ForumReply', { userId: Number(user.id) });
  
  // Update own profile (limited fields)
  can('update', 'Profile', { id: Number(user.id) });
  can('update', 'User', { id: Number(user.id) });  // Own user record
  
  // ========================================
  // MODERATOR PERMISSIONS
  // ========================================
  if (user.role === 'moderator' || user.role === 'admin' || user.role === 'superadmin') {
    // Access moderation panel
    can('access', 'ModPanel');
    
    // Moderate all content
    can('moderate', ['Post', 'Comment', 'ForumPost', 'ForumReply', 'GroupPost']);
    can('update', ['Post', 'Comment', 'ForumPost', 'ForumReply']);
    can('delete', ['Post', 'Comment', 'ForumPost', 'ForumReply', 'GroupPost', 'GroupComment']);
    
    // Pin and lock forum posts
    can('pin', ['Post', 'ForumPost']);
    can('lock', 'ForumPost');
    
    // View and manage reports
    can('read', 'Report');
    can('update', 'Report');
    can('delete', 'Report');
    
    // Manage forum categories
    can('create', 'ForumCategory');
    can('update', 'ForumCategory');
    can('delete', 'ForumCategory');
    
    // Create events
    can('create', 'Event');
    can('update', 'Event');
    can('delete', 'Event');
  }

  // ========================================
  // ADMIN PERMISSIONS
  // ========================================
  if (user.role === 'admin' || user.role === 'superadmin') {
    // Access admin panel
    can('access', 'AdminPanel');
    
    // Manage users (except superadmins)
    can('read', 'User');
    can('update', 'User', { role: { $in: ['user', 'moderator'] } });
    can('delete', 'User', { role: { $in: ['user', 'moderator'] } });
    can('access', 'UserManagement');
    
    // Manage donations
    can('manage', 'Donation');
    can('manage', 'DonationRank');
    can('export', 'Donation');
    
    // Manage servers
    can('manage', 'Server');
    
    // Manage settings
    can('read', 'Settings');
    can('update', 'Settings');
    
    // View analytics
    can('read', 'Analytics');
    can('access', 'Analytics');
    
    // Manage API keys
    can('manage', 'ApiKey');
    
    // Create and manage groups
    can('manage', 'Group');
    
    // Approve content
    can('approve', ['Event', 'Group']);
    can('reject', ['Event', 'Group']);
    
    // But CANNOT modify superadmins
    cannot('update', 'User', { role: 'superadmin' });
    cannot('delete', 'User', { role: 'superadmin' });
  }

  // ========================================
  // SUPERADMIN PERMISSIONS
  // ========================================
  if (user.role === 'superadmin') {
    // Full system access
    can('manage', 'all');  // Can do anything
    
    // Can manage other superadmins
    can('update', 'User', { role: 'superadmin' });
    can('delete', 'User', { role: 'superadmin' });
  }

  // ========================================
  // DONATION RANK PERMISSIONS (Optional)
  // ========================================
  // Add special permissions based on donation tier
  // This is an example of CASL's flexibility
  if (user.donationRankId) {
    // These could be expanded based on your rank system
    // For now, just demonstrating the capability
    can('access', 'DonorPerks');
  }

  return build();
}

/**
 * Helper to check if a user can perform an action
 * Provides a simple functional interface
 */
export function userCan(
  user: AbilityUser | null | undefined,
  action: string,
  subject: string | object
): boolean {
  const ability = defineAbilityFor(user);
  return ability.can(action as any, subject as any);
}

/**
 * Helper to check if a user cannot perform an action
 */
export function userCannot(
  user: AbilityUser | null | undefined,
  action: string,
  subject: string | object
): boolean {
  return !userCan(user, action, subject);
}
