/**
 * Service Layer Validation
 *
 * Validation helpers for dashboard services
 */

import { dashboardConfigSchema, sanitizeString, validateUUID } from '@/utils/validation';
import { AppError, ERROR_CODES } from '@/utils/errorHandling';
import { verifyDashboardOwnership, checkRateLimit } from '@/utils/authorization';
import { SECURITY_CONFIG } from '@/config/security';
import { WidgetRegistry } from './WidgetRegistry';
import type { DashboardConfig, DashboardWidget } from '@/types/dashboard';

// Validate dashboard configuration
export function validateDashboardConfig(config: DashboardConfig): {
  isValid: boolean;
  errors: string[];
  sanitizedConfig?: DashboardConfig;
} {
  const errors: string[] = [];

  try {
    // Validate with Zod schema
    const result = dashboardConfigSchema.safeParse(config);
    if (!result.success) {
      errors.push(...result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`));
      return { isValid: false, errors };
    }
  } catch (error) {
    errors.push('Invalid configuration structure');
    return { isValid: false, errors };
  }

  // Validate widget count
  if (config.widgets.length > SECURITY_CONFIG.MAX_WIDGETS_PER_DASHBOARD) {
    errors.push(
      `Maximum ${SECURITY_CONFIG.MAX_WIDGETS_PER_DASHBOARD} widgets allowed per dashboard`
    );
  }

  // Validate each widget
  for (let i = 0; i < config.widgets.length; i++) {
    const widget = config.widgets[i];

    // Validate widget type exists
    const widgetDef = WidgetRegistry.get(widget.type as any);
    if (!widgetDef) {
      errors.push(`Widget ${i}: Unknown widget type '${widget.type}'`);
      continue;
    }

    // Validate position
    if (widget.position.x < 0 || widget.position.x >= SECURITY_CONFIG.GRID_COLUMNS) {
      errors.push(`Widget ${i}: Invalid X position (${widget.position.x})`);
    }

    if (widget.position.y < 0) {
      errors.push(`Widget ${i}: Invalid Y position (${widget.position.y})`);
    }

    // Validate size
    if (
      widget.size.width < widgetDef.minSize.width ||
      widget.size.width > widgetDef.maxSize.width
    ) {
      errors.push(
        `Widget ${i}: Width must be between ${widgetDef.minSize.width} and ${widgetDef.maxSize.width}`
      );
    }

    if (
      widget.size.height < widgetDef.minSize.height ||
      widget.size.height > widgetDef.maxSize.height
    ) {
      errors.push(
        `Widget ${i}: Height must be between ${widgetDef.minSize.height} and ${widgetDef.maxSize.height}`
      );
    }

    // Check for overlaps
    for (let j = i + 1; j < config.widgets.length; j++) {
      const other = config.widgets[j];
      const overlaps = !(
        widget.position.x >= other.position.x + other.size.width ||
        widget.position.x + widget.size.width <= other.position.x ||
        widget.position.y >= other.position.y + other.size.height ||
        widget.position.y + widget.size.height <= other.position.y
      );

      if (overlaps) {
        errors.push(`Widgets ${i} and ${j} overlap`);
      }
    }
  }

  // If valid, sanitize the config
  if (errors.length === 0) {
    const sanitizedConfig = sanitizeDashboardConfig(config);
    return { isValid: true, errors: [], sanitizedConfig };
  }

  return { isValid: false, errors };
}

// Sanitize dashboard configuration
export function sanitizeDashboardConfig(config: DashboardConfig): DashboardConfig {
  return {
    ...config,
    widgets: config.widgets.map(sanitizeWidget),
  };
}

// Sanitize individual widget
function sanitizeWidget(widget: DashboardWidget): DashboardWidget {
  return {
    ...widget,
    config: {
      ...widget.config,
      title: widget.config.title
        ? sanitizeString(widget.config.title, SECURITY_CONFIG.MAX_WIDGET_TITLE_LENGTH)
        : undefined,
    },
  };
}

// Validate ownership and rate limit
export async function validateUserAccess(
  userId: string,
  viewId: string | undefined,
  operation: string
): Promise<void> {
  // Check rate limit
  if (!checkRateLimit(userId, operation)) {
    throw new AppError(
      'Rate limit exceeded. Please try again later.',
      ERROR_CODES.RATE_LIMIT_EXCEEDED.code,
      ERROR_CODES.RATE_LIMIT_EXCEEDED.statusCode
    );
  }

  // Verify ownership if viewId provided
  if (viewId) {
    if (!validateUUID(viewId)) {
      throw new AppError(
        'Invalid view ID format',
        ERROR_CODES.INVALID_INPUT.code,
        ERROR_CODES.INVALID_INPUT.statusCode
      );
    }

    const ownsView = await verifyDashboardOwnership(viewId, userId);
    if (!ownsView) {
      throw new AppError(
        'You do not have permission to access this dashboard',
        ERROR_CODES.FORBIDDEN.code,
        ERROR_CODES.FORBIDDEN.statusCode
      );
    }
  }
}

export default {
  validateDashboardConfig,
  sanitizeDashboardConfig,
  validateUserAccess,
};
