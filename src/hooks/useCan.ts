/**
 * React Hook: useCan
 * Simplified hook to check if current user can perform an action
 */

'use client';

import { useMemo } from 'react';
import { useAbility } from './useAbility';
import { Actions, Subjects, SubjectWithConditions } from '@/lib/casl/ability';

/**
 * Hook to check if the current user can perform a specific action
 * 
 * @example
 * const canEdit = useCan('update', post);
 * const canDelete = useCan('delete', 'Post');
 * const canAccessAdmin = useCan('access', 'AdminPanel');
 */
export function useCan(
  action: Actions,
  subject: Subjects | SubjectWithConditions
): boolean {
  const ability = useAbility();
  
  return useMemo(() => {
    return ability.can(action, subject as any);
  }, [ability, action, subject]);
}

/**
 * Hook to check if the current user CANNOT perform a specific action
 */
export function useCannot(
  action: Actions,
  subject: Subjects | SubjectWithConditions
): boolean {
  return !useCan(action, subject);
}
