/**
 * Icon Loader Test Component
 *
 * This component demonstrates the new icon loading system.
 * Use this to verify icons load correctly before migrating files.
 *
 * Usage:
 * ```tsx
 * import { IconTest } from '@/components/shared/IconTest';
 * <IconTest />
 * ```
 */

import { Icon } from '@/utils/iconLoader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function IconTest() {
  // Sample of commonly used icons
  const commonIcons = [
    'Loader2',
    'AlertCircle',
    'CheckCircle2',
    'ArrowLeft',
    'ArrowRight',
    'Brain',
    'Shield',
    'Trophy',
    'Star',
    'User',
    'Settings',
    'Search',
    'Menu',
    'X',
    'Plus',
    'Trash2',
  ] as const;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Icon Loader Test</CardTitle>
        <p className="text-sm text-muted-foreground">
          All icons below are dynamically loaded using the new icon system
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
          {commonIcons.map(iconName => (
            <div
              key={iconName}
              className="flex flex-col items-center gap-2 p-2 border rounded hover:bg-accent transition-colors"
            >
              <Icon name={iconName} size={24} className="text-primary" />
              <span className="text-xs text-center break-all">{iconName}</span>
            </div>
          ))}
        </div>

        {/* Test animated icon */}
        <div className="mt-6 p-4 border rounded">
          <h3 className="font-semibold mb-2">Animated Icon Test:</h3>
          <div className="flex items-center gap-4">
            <Icon name="Loader2" size={24} className="animate-spin text-primary" />
            <span className="text-sm">Loading spinner (animated)</span>
          </div>
        </div>

        {/* Test different sizes */}
        <div className="mt-6 p-4 border rounded">
          <h3 className="font-semibold mb-2">Size Test:</h3>
          <div className="flex items-center gap-4">
            <Icon name="Star" size={16} className="text-yellow-500" />
            <Icon name="Star" size={24} className="text-yellow-500" />
            <Icon name="Star" size={32} className="text-yellow-500" />
            <Icon name="Star" size={48} className="text-yellow-500" />
            <span className="text-sm">16px, 24px, 32px, 48px</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
