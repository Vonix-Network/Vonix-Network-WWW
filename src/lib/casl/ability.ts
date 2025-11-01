/**
 * CASL Ability Type Definitions
 * Defines all actions and subjects for the permission system
 */

import { PureAbility, AbilityBuilder, AbilityClass } from '@casl/ability';

/**
 * All possible actions in the system
 */
export type Actions =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'manage'      // All actions
  | 'access'      // Access to a section/page
  | 'pin'         // Pin content
  | 'lock'        // Lock content
  | 'approve'     // Approve content
  | 'reject'      // Reject content
  | 'moderate'    // Moderate content
  | 'report'      // Report content
  | 'export';     // Export data

/**
 * All subjects (resources) in the system
 */
export type Subjects =
  // User & Auth
  | 'User'
  | 'Profile'
  | 'Session'
  
  // Content
  | 'Post'           // Social posts
  | 'Comment'        // Social comments
  | 'ForumPost'      // Forum posts
  | 'ForumReply'     // Forum replies
  | 'ForumCategory'  // Forum categories
  
  // Groups
  | 'Group'
  | 'GroupPost'
  | 'GroupComment'
  | 'GroupMember'
  
  // Messaging
  | 'Message'
  | 'PrivateMessage'
  
  // Events & Stories
  | 'Event'
  | 'Story'
  
  // Moderation
  | 'Report'
  | 'ReportedContent'
  
  // Admin
  | 'AdminPanel'
  | 'ModPanel'        // Moderation panel
  | 'UserManagement'
  | 'Donation'
  | 'DonationRank'
  | 'Server'
  | 'Settings'
  | 'Analytics'
  | 'ApiKey'
  
  // Donor Perks
  | 'DonorPerks'
  
  // Special
  | 'all';  // All subjects

/**
 * Subject type with conditions
 * Allows checking permissions on specific instances with conditions
 */
export interface SubjectWithConditions {
  __typename?: Subjects;
  id?: number | string;
  userId?: number;
  authorId?: number;
  role?: string;
  createdAt?: Date | number;
  isLocked?: boolean;
  isPinned?: boolean;
  isPrivate?: boolean;
  status?: string;
}

/**
 * App Ability Type
 * Combines actions and subjects for type-safe permission checking
 */
export type AppAbility = PureAbility<[Actions, Subjects | SubjectWithConditions]>;

/**
 * Create a new AbilityBuilder instance
 */
export function createAbilityBuilder() {
  return new AbilityBuilder<AppAbility>(PureAbility as AbilityClass<AppAbility>);
}

/**
 * Helper to create an ability instance
 */
export function createAbility() {
  const { build } = createAbilityBuilder();
  return build();
}
