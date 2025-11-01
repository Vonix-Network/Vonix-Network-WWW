/**
 * Permission Component: <Can>
 * Conditionally renders children based on user permissions
 */

'use client';

import { ReactNode } from 'react';
import { useAbility } from '@/hooks/useAbility';
import { Actions, Subjects, SubjectWithConditions } from '@/lib/casl/ability';

export interface CanProps {
  /**
   * The action to check (e.g., 'create', 'update', 'delete')
   */
  I: Actions;
  
  /**
   * The subject to check against (e.g., 'Post', post object)
   */
  a?: Subjects | SubjectWithConditions;
  
  /**
   * Alternative to 'a' prop - the subject
   */
  this?: Subjects | SubjectWithConditions;
  
  /**
   * Optional field to check (for field-level permissions)
   */
  field?: string;
  
  /**
   * Content to render if permission is granted
   */
  children: ReactNode;
  
  /**
   * Optional fallback content to render if permission is denied
   */
  fallback?: ReactNode;
  
  /**
   * If true, renders fallback when permission is denied
   * If false, renders nothing when permission is denied
   */
  passThrough?: boolean;
}

/**
 * Permission component for conditional rendering
 * 
 * @example
 * <Can I="update" this={post}>
 *   <button onClick={handleEdit}>Edit</button>
 * </Can>
 * 
 * @example
 * <Can I="delete" a="Post" fallback={<p>No permission</p>}>
 *   <button onClick={handleDelete}>Delete</button>
 * </Can>
 * 
 * @example
 * <Can I="update" this={user} field="role">
 *   <RoleSelector />
 * </Can>
 */
export function Can({
  I,
  a,
  this: thisSubject,
  field,
  children,
  fallback,
  passThrough = false,
}: CanProps) {
  const ability = useAbility();
  const subject = thisSubject || a;

  if (!subject) {
    console.warn('Can component: No subject provided');
    return passThrough ? <>{fallback}</> : null;
  }

  const canPerform = field
    ? ability.can(I, subject as any, field)
    : ability.can(I, subject as any);

  if (canPerform) {
    return <>{children}</>;
  }

  return passThrough ? <>{fallback}</> : null;
}

/**
 * Inverse permission component - renders when user CANNOT do something
 * 
 * @example
 * <Cannot I="update" this={post}>
 *   <p>You don't have permission to edit this post</p>
 * </Cannot>
 */
export function Cannot(props: CanProps) {
  const ability = useAbility();
  const subject = props.this || props.a;

  if (!subject) {
    return props.passThrough ? <>{props.fallback}</> : null;
  }

  const canPerform = props.field
    ? ability.can(props.I, subject as any, props.field)
    : ability.can(props.I, subject as any);

  // Inverse logic
  if (!canPerform) {
    return <>{props.children}</>;
  }

  return props.passThrough ? <>{props.fallback}</> : null;
}
