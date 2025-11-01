/**
 * CASL API Validation
 * Server-side permission checking for API routes
 */

import { NextResponse } from 'next/server';
import { auth } from '../../../auth';
import { defineAbilityFor, AbilityUser } from './defineAbilityFor';
import { Actions, Subjects, SubjectWithConditions } from './ability';

/**
 * Get the current user's ability from server session
 */
export async function getServerAbility() {
  const session = await auth();
  
  if (!session?.user) {
    return defineAbilityFor(null);
  }
  
  const abilityUser: AbilityUser = {
    id: session.user.id,
    role: session.user.role,
    donationRankId: session.user.donationRankId,
    totalDonated: session.user.totalDonated,
  };
  
  return defineAbilityFor(abilityUser);
}

/**
 * Require specific ability in API route
 * Returns error response if user lacks permission
 * 
 * @example
 * const forbidden = await requireAbility('update', post);
 * if (forbidden) return forbidden;
 */
export async function requireAbility(
  action: Actions,
  subject: Subjects | SubjectWithConditions,
  field?: string
): Promise<NextResponse | null> {
  const ability = await getServerAbility();
  
  const canPerform = field
    ? ability.can(action, subject as any, field)
    : ability.can(action, subject as any);
  
  if (!canPerform) {
    return NextResponse.json(
      { error: 'Forbidden - Insufficient permissions' },
      { status: 403 }
    );
  }
  
  return null;  // Permission granted
}

/**
 * Require authentication (any logged-in user)
 */
export async function requireAuth(): Promise<NextResponse | null> {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json(
      { error: 'Unauthorized - Authentication required' },
      { status: 401 }
    );
  }
  
  return null;
}

/**
 * Require specific role (backward compatible with RBAC)
 * Use this during migration period to maintain compatibility
 */
export async function requireRole(
  ...roles: Array<'user' | 'moderator' | 'admin' | 'superadmin'>
): Promise<NextResponse | null> {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json(
      { error: 'Unauthorized - Authentication required' },
      { status: 401 }
    );
  }
  
  if (!roles.includes(session.user.role)) {
    return NextResponse.json(
      { error: `Forbidden - Requires one of: ${roles.join(', ')}` },
      { status: 403 }
    );
  }
  
  return null;
}

/**
 * Check if current user can perform action
 * Returns boolean (doesn't send error response)
 */
export async function canPerform(
  action: Actions,
  subject: Subjects | SubjectWithConditions,
  field?: string
): Promise<boolean> {
  const ability = await getServerAbility();
  
  return field
    ? ability.can(action, subject as any, field)
    : ability.can(action, subject as any);
}

/**
 * Get current session user for ability checks
 */
export async function getAbilityUser(): Promise<AbilityUser | null> {
  const session = await auth();
  
  if (!session?.user) {
    return null;
  }
  
  return {
    id: session.user.id,
    role: session.user.role,
    donationRankId: session.user.donationRankId,
    totalDonated: session.user.totalDonated,
  };
}
