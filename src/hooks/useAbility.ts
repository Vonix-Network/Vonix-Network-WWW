/**
 * React Hook: useAbility
 * Returns the CASL ability object for the current user
 */

'use client';

import { useSession } from 'next-auth/react';
import { useMemo } from 'react';
import { defineAbilityFor } from '@/lib/casl/defineAbilityFor';
import { AppAbility } from '@/lib/casl/ability';

/**
 * Hook to get the current user's ability object
 * Automatically updates when session changes
 * 
 * @example
 * const ability = useAbility();
 * if (ability.can('update', post)) {
 *   // Show edit button
 * }
 */
export function useAbility(): AppAbility {
  const { data: session } = useSession();
  
  const ability = useMemo(() => {
    return defineAbilityFor(session?.user ? {
      id: session.user.id,
      role: session.user.role,
      donationRankId: session.user.donationRankId,
      totalDonated: session.user.totalDonated,
    } : null);
  }, [
    session?.user?.id,
    session?.user?.role,
    session?.user?.donationRankId,
    session?.user?.totalDonated,
  ]);
  
  return ability;
}
