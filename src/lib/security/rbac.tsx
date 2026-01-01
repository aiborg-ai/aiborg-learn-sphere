/* eslint-disable react-refresh/only-export-components */
import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

/**
 * Role-Based Access Control (RBAC) system
 * @module rbac
 */

/**
 * User object type for RBAC
 */
export interface RBACUser {
  id: string;
  [key: string]: unknown;
}

/**
 * Resource data type for condition checking
 */
export interface ResourceData {
  id?: string;
  user_id?: string;
  instructor_id?: string;
  author_id?: string;
  is_public?: boolean;
  status?: string;
  course?: {
    instructor_id?: string;
  };
  submissions?: Array<{
    user_id: string;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

/**
 * User roles in the system
 * @enum
 */
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  INSTRUCTOR = 'instructor',
  STUDENT = 'student',
  GUEST = 'guest',
}

/**
 * System resources
 * @enum
 */
export enum Resource {
  COURSE = 'course',
  ENROLLMENT = 'enrollment',
  ASSIGNMENT = 'assignment',
  BLOG = 'blog',
  USER = 'user',
  ADMIN_PANEL = 'admin_panel',
  ANALYTICS = 'analytics',
  SETTINGS = 'settings',
  PAYMENT = 'payment',
  REVIEW = 'review',
}

/**
 * Available actions
 * @enum
 */
export enum Action {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  PUBLISH = 'publish',
  APPROVE = 'approve',
  EXPORT = 'export',
  MANAGE = 'manage',
}

/**
 * Permission rule
 * @interface
 */
interface PermissionRule {
  role: UserRole;
  resource: Resource;
  actions: Action[];
  condition?: (user: RBACUser, resource: ResourceData) => boolean;
}

/**
 * Permission matrix defining role-based access
 */
const PERMISSION_MATRIX: PermissionRule[] = [
  // Super Admin - Full access
  {
    role: UserRole.SUPER_ADMIN,
    resource: Resource.COURSE,
    actions: [
      Action.CREATE,
      Action.READ,
      Action.UPDATE,
      Action.DELETE,
      Action.PUBLISH,
      Action.MANAGE,
    ],
  },
  {
    role: UserRole.SUPER_ADMIN,
    resource: Resource.USER,
    actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.MANAGE],
  },
  {
    role: UserRole.SUPER_ADMIN,
    resource: Resource.ADMIN_PANEL,
    actions: [Action.READ, Action.MANAGE],
  },
  {
    role: UserRole.SUPER_ADMIN,
    resource: Resource.ANALYTICS,
    actions: [Action.READ, Action.EXPORT],
  },
  {
    role: UserRole.SUPER_ADMIN,
    resource: Resource.SETTINGS,
    actions: [Action.READ, Action.UPDATE, Action.MANAGE],
  },

  // Admin - Limited management access
  {
    role: UserRole.ADMIN,
    resource: Resource.COURSE,
    actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.PUBLISH],
  },
  {
    role: UserRole.ADMIN,
    resource: Resource.ENROLLMENT,
    actions: [Action.READ, Action.UPDATE, Action.APPROVE],
  },
  {
    role: UserRole.ADMIN,
    resource: Resource.BLOG,
    actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.PUBLISH],
  },
  {
    role: UserRole.ADMIN,
    resource: Resource.USER,
    actions: [Action.READ, Action.UPDATE],
    condition: (user, targetUser) => user.id !== targetUser.id, // Can't modify own account
  },
  {
    role: UserRole.ADMIN,
    resource: Resource.ADMIN_PANEL,
    actions: [Action.READ],
  },
  {
    role: UserRole.ADMIN,
    resource: Resource.ANALYTICS,
    actions: [Action.READ],
  },

  // Instructor - Course and content management
  {
    role: UserRole.INSTRUCTOR,
    resource: Resource.COURSE,
    actions: [Action.CREATE, Action.READ, Action.UPDATE],
    condition: (user, course) => course.instructor_id === user.id, // Only own courses
  },
  {
    role: UserRole.INSTRUCTOR,
    resource: Resource.ASSIGNMENT,
    actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
    condition: (user, assignment) => assignment.instructor_id === user.id,
  },
  {
    role: UserRole.INSTRUCTOR,
    resource: Resource.ENROLLMENT,
    actions: [Action.READ],
    condition: (user, enrollment) => enrollment.course?.instructor_id === user.id,
  },
  {
    role: UserRole.INSTRUCTOR,
    resource: Resource.BLOG,
    actions: [Action.CREATE, Action.READ, Action.UPDATE],
    condition: (user, blog) => blog.author_id === user.id,
  },
  {
    role: UserRole.INSTRUCTOR,
    resource: Resource.REVIEW,
    actions: [Action.READ],
  },

  // Student - Limited access
  {
    role: UserRole.STUDENT,
    resource: Resource.COURSE,
    actions: [Action.READ],
  },
  {
    role: UserRole.STUDENT,
    resource: Resource.ENROLLMENT,
    actions: [Action.CREATE, Action.READ],
    condition: (user, enrollment) => enrollment.user_id === user.id, // Only own enrollments
  },
  {
    role: UserRole.STUDENT,
    resource: Resource.ASSIGNMENT,
    actions: [Action.READ, Action.UPDATE],
    condition: (user, assignment) => assignment.submissions?.some(s => s.user_id === user.id),
  },
  {
    role: UserRole.STUDENT,
    resource: Resource.BLOG,
    actions: [Action.READ],
  },
  {
    role: UserRole.STUDENT,
    resource: Resource.REVIEW,
    actions: [Action.CREATE, Action.READ, Action.UPDATE],
    condition: (user, review) => review.user_id === user.id,
  },
  {
    role: UserRole.STUDENT,
    resource: Resource.PAYMENT,
    actions: [Action.CREATE, Action.READ],
    condition: (user, payment) => payment.user_id === user.id,
  },

  // Guest - Minimal access
  {
    role: UserRole.GUEST,
    resource: Resource.COURSE,
    actions: [Action.READ],
    condition: (user, course) => course.is_public === true,
  },
  {
    role: UserRole.GUEST,
    resource: Resource.BLOG,
    actions: [Action.READ],
    condition: (user, blog) => blog.status === 'published',
  },
];

/**
 * RBAC Manager class
 * @class
 */
export class RBACManager {
  private userRole: UserRole = UserRole.GUEST;
  private userId: string | null = null;
  private permissions: Map<string, Set<Action>> = new Map();

  /**
   * Initialize RBAC with user data
   * @param {RBACUser | null} user - User object
   */
  async initialize(user: RBACUser | null): Promise<void> {
    if (!user) {
      this.userRole = UserRole.GUEST;
      this.userId = null;
    } else {
      this.userId = user.id;
      await this.fetchUserRole(user.id);
    }

    this.buildPermissionCache();
  }

  /**
   * Fetch user role from database
   * @private
   * @param {string} userId - User ID
   */
  private async fetchUserRole(userId: string): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        // Default to student if no role found
        this.userRole = UserRole.STUDENT;
      } else {
        this.userRole = data.role as UserRole;
      }
    } catch (_error) {
      logger.error('Error fetching user role:', _error);
      this.userRole = UserRole.STUDENT;
    }
  }

  /**
   * Build permission cache for quick lookup
   * @private
   */
  private buildPermissionCache(): void {
    this.permissions.clear();

    const relevantRules = PERMISSION_MATRIX.filter(rule => rule.role === this.userRole);

    for (const rule of relevantRules) {
      const key = rule.resource;

      if (!this.permissions.has(key)) {
        this.permissions.set(key, new Set());
      }

      for (const action of rule.actions) {
        this.permissions.get(key)!.add(action);
      }
    }
  }

  /**
   * Check if user can perform an action on a resource
   * @param {Action} action - Action to perform
   * @param {Resource} resource - Resource to access
   * @param {ResourceData} [resourceData] - Optional resource data for condition checking
   * @returns {boolean} True if action is allowed
   */
  can(action: Action, resource: Resource, resourceData?: ResourceData): boolean {
    // Super admin can do everything
    if (this.userRole === UserRole.SUPER_ADMIN) {
      return true;
    }

    // Check basic permissions
    const resourcePermissions = this.permissions.get(resource);
    if (!resourcePermissions || !resourcePermissions.has(action)) {
      return false;
    }

    // Check conditional permissions
    if (resourceData) {
      const rules = PERMISSION_MATRIX.filter(
        rule =>
          rule.role === this.userRole &&
          rule.resource === resource &&
          rule.actions.includes(action) &&
          rule.condition
      );

      for (const rule of rules) {
        if (rule.condition && !rule.condition({ id: this.userId }, resourceData)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Check if user cannot perform an action
   * @param {Action} action - Action to perform
   * @param {Resource} resource - Resource to access
   * @param {ResourceData} [resourceData] - Optional resource data
   * @returns {boolean} True if action is not allowed
   */
  cannot(action: Action, resource: Resource, resourceData?: ResourceData): boolean {
    return !this.can(action, resource, resourceData);
  }

  /**
   * Check if user has a specific role
   * @param {UserRole} role - Role to check
   * @returns {boolean} True if user has the role
   */
  hasRole(role: UserRole): boolean {
    return this.userRole === role;
  }

  /**
   * Check if user has any of the specified roles
   * @param {UserRole[]} roles - Roles to check
   * @returns {boolean} True if user has any of the roles
   */
  hasAnyRole(roles: UserRole[]): boolean {
    return roles.includes(this.userRole);
  }

  /**
   * Get user's current role
   * @returns {UserRole} Current user role
   */
  getRole(): UserRole {
    return this.userRole;
  }

  /**
   * Get all permissions for current user
   * @returns {Map<string, Set<Action>>} Permission map
   */
  getPermissions(): Map<string, Set<Action>> {
    return new Map(this.permissions);
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} True if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.userId !== null && this.userRole !== UserRole.GUEST;
  }

  /**
   * Check if user is admin or super admin
   * @returns {boolean} True if user is admin
   */
  isAdmin(): boolean {
    return this.hasAnyRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
  }

  /**
   * Check if user is instructor
   * @returns {boolean} True if user is instructor
   */
  isInstructor(): boolean {
    return this.hasRole(UserRole.INSTRUCTOR);
  }
}

/**
 * Global RBAC instance
 */
export const rbac = new RBACManager();

/**
 * React hook for RBAC
 * @returns {object} RBAC utilities
 */
export function useRBAC() {
  return {
    can: (action: Action, resource: Resource, data?: ResourceData) =>
      rbac.can(action, resource, data),
    cannot: (action: Action, resource: Resource, data?: ResourceData) =>
      rbac.cannot(action, resource, data),
    hasRole: (role: UserRole) => rbac.hasRole(role),
    hasAnyRole: (roles: UserRole[]) => rbac.hasAnyRole(roles),
    isAuthenticated: () => rbac.isAuthenticated(),
    isAdmin: () => rbac.isAdmin(),
    isInstructor: () => rbac.isInstructor(),
    getRole: () => rbac.getRole(),
  };
}

/**
 * Protected route component
 * @param {object} props - Component props
 * @returns {JSX.Element | null} Protected content or null
 */
export function ProtectedRoute({
  children,
  requiredRole,
  requiredPermission,
  fallback = null,
}: {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
  requiredPermission?: { action: Action; resource: Resource };
  fallback?: React.ReactNode;
}): React.ReactElement {
  // Check role requirement
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!rbac.hasAnyRole(roles)) {
      return <React.Fragment>{fallback}</React.Fragment>;
    }
  }

  // Check permission requirement
  if (requiredPermission) {
    if (!rbac.can(requiredPermission.action, requiredPermission.resource)) {
      return <React.Fragment>{fallback}</React.Fragment>;
    }
  }

  return <React.Fragment>{children}</React.Fragment>;
}
