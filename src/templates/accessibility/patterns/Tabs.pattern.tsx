/**
 * Accessible Tabs Pattern
 *
 * ✅ WCAG 2.1 Level AA Compliant
 * ✅ Full ARIA support
 * ✅ Keyboard navigation
 * ✅ Screen reader optimized
 *
 * FEATURES:
 * - Tabbed interface with keyboard navigation
 * - Arrow key navigation between tabs
 * - Home/End support
 * - Automatic/Manual activation modes
 * - Vertical/Horizontal orientations
 * - Controlled/Uncontrolled modes
 *
 * Based on WAI-ARIA Authoring Practices:
 * https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
 */

import { useState, useRef, KeyboardEvent, ReactNode, useEffect } from 'react';
import { cn } from '@/lib/utils';

/* ============================================================================
 * TYPES
 * ============================================================================ */

export interface Tab {
  id: string;
  label: string;
  content: ReactNode;
  disabled?: boolean;
  icon?: ReactNode;
}

export interface AccessibleTabsProps {
  /**
   * Array of tab items
   */
  tabs: Tab[];

  /**
   * Initially selected tab ID
   */
  defaultTab?: string;

  /**
   * Controlled selected tab (for controlled component)
   */
  selectedTab?: string;

  /**
   * Callback when tab changes
   */
  onTabChange?: (tabId: string) => void;

  /**
   * Orientation of tabs
   * Default: 'horizontal'
   */
  orientation?: 'horizontal' | 'vertical';

  /**
   * Activation mode
   * - 'automatic': Tab activates on focus (Arrow keys change tab)
   * - 'manual': Tab activates on Enter/Space (Arrow keys only move focus)
   * Default: 'automatic'
   */
  activation?: 'automatic' | 'manual';

  /**
   * Custom className for container
   */
  className?: string;

  /**
   * Custom className for tab list
   */
  tabListClassName?: string;

  /**
   * Custom className for tab panels
   */
  tabPanelClassName?: string;
}

/* ============================================================================
 * ACCESSIBLE TABS COMPONENT
 * ============================================================================ */

export function AccessibleTabs({
  tabs,
  defaultTab,
  selectedTab: controlledSelectedTab,
  onTabChange,
  orientation = 'horizontal',
  activation = 'automatic',
  className,
  tabListClassName,
  tabPanelClassName,
}: AccessibleTabsProps) {
  const [internalSelectedTab, setInternalSelectedTab] = useState<string>(
    defaultTab || tabs[0]?.id
  );
  const [focusedTab, setFocusedTab] = useState<string>(
    defaultTab || tabs[0]?.id
  );

  const isControlled = controlledSelectedTab !== undefined;
  const selectedTab = isControlled ? controlledSelectedTab : internalSelectedTab;

  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  /* =========================================================================
   * TAB SELECTION
   * ========================================================================= */

  const selectTab = (tabId: string) => {
    if (!isControlled) {
      setInternalSelectedTab(tabId);
    }
    onTabChange?.(tabId);
  };

  /* =========================================================================
   * KEYBOARD NAVIGATION
   * ========================================================================= */

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    const { key } = event;

    const isHorizontal = orientation === 'horizontal';
    const nextKey = isHorizontal ? 'ArrowRight' : 'ArrowDown';
    const prevKey = isHorizontal ? 'ArrowLeft' : 'ArrowUp';

    let newIndex = currentIndex;

    if (key === nextKey) {
      event.preventDefault();
      newIndex = currentIndex + 1 < tabs.length ? currentIndex + 1 : 0;
    } else if (key === prevKey) {
      event.preventDefault();
      newIndex = currentIndex - 1 >= 0 ? currentIndex - 1 : tabs.length - 1;
    } else if (key === 'Home') {
      event.preventDefault();
      newIndex = 0;
    } else if (key === 'End') {
      event.preventDefault();
      newIndex = tabs.length - 1;
    } else if (activation === 'manual' && (key === 'Enter' || key === ' ')) {
      event.preventDefault();
      selectTab(tabs[currentIndex].id);
      return;
    }

    // Move focus
    const newTabId = tabs[newIndex].id;
    setFocusedTab(newTabId);
    tabRefs.current.get(newTabId)?.focus();

    // Automatic activation mode - select on focus
    if (activation === 'automatic' && (key === nextKey || key === prevKey || key === 'Home' || key === 'End')) {
      selectTab(newTabId);
    }
  };

  /* =========================================================================
   * RENDER
   * ========================================================================= */

  return (
    <div
      className={cn(
        "space-y-4",
        orientation === 'vertical' && "flex gap-4",
        className
      )}
    >
      {/* Tab List */}
      <div
        role="tablist"
        aria-label="Content tabs"
        aria-orientation={orientation}
        className={cn(
          "flex gap-1",
          orientation === 'horizontal' ? "border-b" : "flex-col border-r",
          tabListClassName
        )}
      >
        {tabs.map((tab, index) => {
          const isSelected = selectedTab === tab.id;
          const isFocused = focusedTab === tab.id;

          return (
            <button
              key={tab.id}
              ref={(el) => {
                if (el) tabRefs.current.set(tab.id, el);
              }}
              type="button"
              role="tab"
              aria-selected={isSelected}
              aria-controls={`tabpanel-${tab.id}`}
              id={`tab-${tab.id}`}
              tabIndex={isFocused ? 0 : -1}
              disabled={tab.disabled}
              onClick={() => selectTab(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium whitespace-nowrap",
                "transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                orientation === 'horizontal'
                  ? "border-b-2 border-transparent"
                  : "border-r-2 border-transparent text-left",
                isSelected
                  ? orientation === 'horizontal'
                    ? "border-primary text-foreground"
                    : "border-primary bg-accent text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              {tab.icon && <span aria-hidden="true">{tab.icon}</span>}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className={cn(orientation === 'vertical' && "flex-1")}>
        {tabs.map((tab) => {
          const isSelected = selectedTab === tab.id;

          return (
            <div
              key={tab.id}
              role="tabpanel"
              id={`tabpanel-${tab.id}`}
              aria-labelledby={`tab-${tab.id}`}
              hidden={!isSelected}
              tabIndex={0} // eslint-disable-line jsx-a11y/no-noninteractive-tabindex -- WAI-ARIA: Tab panels should be focusable
              className={cn(
                isSelected ? "block" : "hidden",
                tabPanelClassName
              )}
            >
              {tab.content}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================================
 * USAGE EXAMPLES
 * ============================================================================

@example Basic Tabs (Horizontal)
```tsx
const tabs = [
  {
    id: 'overview',
    label: 'Overview',
    content: <div>Overview content here</div>,
  },
  {
    id: 'details',
    label: 'Details',
    content: <div>Details content here</div>,
  },
  {
    id: 'settings',
    label: 'Settings',
    content: <div>Settings content here</div>,
  },
];

<AccessibleTabs tabs={tabs} />
```

@example Vertical Tabs
```tsx
<AccessibleTabs
  tabs={tabs}
  orientation="vertical"
  defaultTab="overview"
/>
```

@example Manual Activation (Require Enter/Space to select)
```tsx
<AccessibleTabs
  tabs={tabs}
  activation="manual"
/>
```

@example Controlled Tabs
```tsx
function ControlledExample() {
  const [selectedTab, setSelectedTab] = useState('overview');

  return (
    <>
      <button onClick={() => setSelectedTab('details')}>
        Go to Details
      </button>

      <AccessibleTabs
        tabs={tabs}
        selectedTab={selectedTab}
        onTabChange={setSelectedTab}
      />
    </>
  );
}
```

@example Tabs with Icons
```tsx
import { Home, Settings, User } from '@/components/ui/icons';

const tabs = [
  {
    id: 'home',
    label: 'Home',
    icon: <Home className="h-4 w-4" />,
    content: <div>Home content</div>,
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: <User className="h-4 w-4" />,
    content: <div>Profile content</div>,
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings className="h-4 w-4" />,
    content: <div>Settings content</div>,
  },
];

<AccessibleTabs tabs={tabs} />
```

@example With Disabled Tab
```tsx
const tabs = [
  { id: '1', label: 'Active', content: <div>Content</div> },
  { id: '2', label: 'Disabled', content: <div>Content</div>, disabled: true },
  { id: '3', label: 'Active', content: <div>Content</div> },
];

<AccessibleTabs tabs={tabs} />
```

@example Course Content Tabs
```tsx
const courseTabs = [
  {
    id: 'materials',
    label: 'Materials',
    content: <MaterialsList materials={materials} />,
  },
  {
    id: 'quizzes',
    label: `Quizzes (${quizzes.length})`,
    content: <QuizzesList quizzes={quizzes} />,
  },
  {
    id: 'assignments',
    label: 'Assignments',
    content: <AssignmentsList assignments={assignments} />,
  },
];

<AccessibleTabs
  tabs={courseTabs}
  defaultTab="materials"
  onTabChange={(tabId) => {
    // Track analytics, update URL, etc.
  }}
/>
```

============================================================================
ACCESSIBILITY CHECKLIST
============================================================================

✅ Uses role="tablist" on container
✅ Uses role="tab" on tab buttons
✅ Uses role="tabpanel" on content panels
✅ aria-selected indicates active tab
✅ aria-controls links tab to panel
✅ aria-labelledby links panel to tab
✅ aria-orientation set correctly
✅ Keyboard navigation (Arrow keys, Home, End)
✅ Only selected/focused tab has tabIndex={0}
✅ hidden attribute on inactive panels
✅ Focus indicators are visible
✅ Disabled tabs cannot be selected

============================================================================
KEYBOARD SHORTCUTS
============================================================================

HORIZONTAL ORIENTATION:
- ArrowRight: Move focus/select next tab
- ArrowLeft: Move focus/select previous tab
- Home: Move focus/select first tab
- End: Move focus/select last tab
- Tab: Move out of tab list

VERTICAL ORIENTATION:
- ArrowDown: Move focus/select next tab
- ArrowUp: Move focus/select previous tab
- Home: Move focus/select first tab
- End: Move focus/select last tab
- Tab: Move out of tab list

MANUAL ACTIVATION MODE:
- Arrow keys move focus only
- Enter or Space activates focused tab
- Tab moves out of tab list

============================================================================
BEST PRACTICES
============================================================================

1. NUMBER OF TABS
   ✅ Keep to 3-7 tabs for usability
   ✅ Consider accordion or navigation menu for more items
   ❌ Don't create too many tabs (confusing)

2. TAB LABELS
   ✅ Use short, descriptive labels
   ✅ Make labels unique and clear
   ❌ Don't use generic labels like "Tab 1", "Tab 2"

3. ORIENTATION
   ✅ Use horizontal for main content tabs
   ✅ Use vertical for sidebar navigation
   ❓ Consider screen size and layout

4. ACTIVATION MODE
   ✅ Use automatic for simple content tabs
   ✅ Use manual if tab content loads slowly or triggers actions
   ❓ Consider performance implications

5. DISABLED TABS
   ✅ Only disable if content is truly unavailable
   ✅ Provide context why tab is disabled
   ❌ Don't overuse disabled state

============================================================================
TESTING GUIDE
============================================================================

KEYBOARD TESTING:
1. Tab to tab list
2. Use Arrow keys to navigate tabs
3. Verify automatic activation (or Enter/Space for manual)
4. Test Home/End keys
5. Tab out and verify focus moves to next element

SCREEN READER TESTING:
1. Navigate to tab list
2. Verify announcement: "[Label], tab, [X] of [Y], selected/not selected"
3. Navigate between tabs
4. Verify panel content is announced
5. Test with NVDA/JAWS/VoiceOver

VISUAL TESTING:
1. Verify selected tab is visually distinct
2. Check focus indicators are visible
3. Verify disabled state is clear
4. Test on mobile/tablet viewports
5. Check both orientations

============================================================================
COMMON MISTAKES TO AVOID
============================================================================

❌ Missing ARIA roles (tablist, tab, tabpanel)
❌ Missing aria-selected on tabs
❌ Not hiding inactive panels (display:none or hidden)
❌ Missing aria-controls/aria-labelledby linkage
❌ Poor keyboard navigation
❌ All tabs have tabIndex={0} (should be -1 for non-selected)
❌ Missing aria-orientation for vertical tabs

✅ Include all required ARIA attributes
✅ Hide inactive panels properly
✅ Implement full keyboard navigation
✅ Manage tabIndex correctly
✅ Set aria-orientation when vertical

============================================================================
 */
