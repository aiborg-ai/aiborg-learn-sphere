/**
 * Accessible Accordion Pattern
 *
 * ✅ WCAG 2.1 Level AA Compliant
 * ✅ Full ARIA support
 * ✅ Keyboard navigation
 * ✅ Screen reader optimized
 *
 * FEATURES:
 * - Expandable/collapsible sections
 * - Keyboard navigation (Arrow keys, Home, End)
 * - aria-expanded state
 * - Optional single-open mode
 * - Smooth animations
 * - Focus management
 *
 * Based on WAI-ARIA Authoring Practices:
 * https://www.w3.org/WAI/ARIA/apg/patterns/accordion/
 */

import { useState, useRef, KeyboardEvent, ReactNode } from 'react';
import { ChevronDown } from '@/components/ui/icons';
import { cn } from '@/lib/utils';

/* ============================================================================
 * TYPES
 * ============================================================================ */

export interface AccordionItem {
  id: string;
  title: string;
  content: ReactNode;
  disabled?: boolean;
}

export interface AccessibleAccordionProps {
  /**
   * Array of accordion items
   */
  items: AccordionItem[];

  /**
   * Allow multiple sections open at once
   * Default: true
   */
  allowMultiple?: boolean;

  /**
   * Initially opened item IDs
   */
  defaultOpenItems?: string[];

  /**
   * Controlled open items (for controlled component)
   */
  openItems?: string[];

  /**
   * Callback when items change
   */
  onItemsChange?: (openItems: string[]) => void;

  /**
   * Custom className
   */
  className?: string;
}

/* ============================================================================
 * ACCESSIBLE ACCORDION COMPONENT
 * ============================================================================ */

export function AccessibleAccordion({
  items,
  allowMultiple = true,
  defaultOpenItems = [],
  openItems: controlledOpenItems,
  onItemsChange,
  className,
}: AccessibleAccordionProps) {
  const [internalOpenItems, setInternalOpenItems] = useState<string[]>(defaultOpenItems);
  const isControlled = controlledOpenItems !== undefined;
  const openItems = isControlled ? controlledOpenItems : internalOpenItems;

  const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  /* =========================================================================
   * TOGGLE HANDLER
   * ========================================================================= */

  const toggleItem = (itemId: string) => {
    const isOpen = openItems.includes(itemId);

    let newOpenItems: string[];

    if (allowMultiple) {
      newOpenItems = isOpen
        ? openItems.filter(id => id !== itemId)
        : [...openItems, itemId];
    } else {
      newOpenItems = isOpen ? [] : [itemId];
    }

    if (!isControlled) {
      setInternalOpenItems(newOpenItems);
    }

    onItemsChange?.(newOpenItems);
  };

  /* =========================================================================
   * KEYBOARD NAVIGATION
   * ========================================================================= */

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    const { key } = event;

    // Navigation keys
    if (key === 'ArrowDown') {
      event.preventDefault();
      const nextIndex = currentIndex + 1 < items.length ? currentIndex + 1 : 0;
      buttonRefs.current.get(items[nextIndex].id)?.focus();
    } else if (key === 'ArrowUp') {
      event.preventDefault();
      const prevIndex = currentIndex - 1 >= 0 ? currentIndex - 1 : items.length - 1;
      buttonRefs.current.get(items[prevIndex].id)?.focus();
    } else if (key === 'Home') {
      event.preventDefault();
      buttonRefs.current.get(items[0].id)?.focus();
    } else if (key === 'End') {
      event.preventDefault();
      buttonRefs.current.get(items[items.length - 1].id)?.focus();
    }
  };

  /* =========================================================================
   * RENDER
   * ========================================================================= */

  return (
    <div className={cn("space-y-2", className)}>
      {items.map((item, index) => {
        const isOpen = openItems.includes(item.id);
        const headingId = `accordion-heading-${item.id}`;
        const panelId = `accordion-panel-${item.id}`;

        return (
          <div
            key={item.id}
            className="border rounded-lg overflow-hidden"
          >
            {/* Accordion Header/Button */}
            <h3 id={headingId}>
              <button
                ref={(el) => {
                  if (el) buttonRefs.current.set(item.id, el);
                }}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                disabled={item.disabled}
                onClick={() => toggleItem(item.id)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 text-left font-medium",
                  "transition-colors hover:bg-accent",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  isOpen && "bg-accent"
                )}
              >
                <span>{item.title}</span>
                <ChevronDown
                  aria-hidden="true"
                  className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    isOpen && "transform rotate-180"
                  )}
                />
              </button>
            </h3>

            {/* Accordion Panel/Content */}
            <section
              id={panelId}
              aria-labelledby={headingId}
              hidden={!isOpen}
              className={cn(
                "overflow-hidden transition-all duration-200",
                isOpen ? "animate-in slide-in-from-top-2" : "animate-out slide-out-to-top-2"
              )}
            >
              <div className="px-4 py-3 border-t">
                {item.content}
              </div>
            </section>
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================================
 * USAGE EXAMPLES
 * ============================================================================

@example Basic Accordion
```tsx
const items = [
  {
    id: '1',
    title: 'What is React?',
    content: 'React is a JavaScript library for building user interfaces.',
  },
  {
    id: '2',
    title: 'What is TypeScript?',
    content: 'TypeScript is a typed superset of JavaScript.',
  },
  {
    id: '3',
    title: 'What is Tailwind CSS?',
    content: 'Tailwind CSS is a utility-first CSS framework.',
  },
];

<AccessibleAccordion items={items} />
```

@example Single-Open Accordion (Only one section open at a time)
```tsx
<AccessibleAccordion
  items={items}
  allowMultiple={false}
  defaultOpenItems={['1']}
/>
```

@example Controlled Accordion
```tsx
function ControlledExample() {
  const [openItems, setOpenItems] = useState<string[]>(['1']);

  return (
    <>
      <button onClick={() => setOpenItems([])}>Close All</button>
      <button onClick={() => setOpenItems(['1', '2', '3'])}>Open All</button>

      <AccessibleAccordion
        items={items}
        openItems={openItems}
        onItemsChange={setOpenItems}
      />
    </>
  );
}
```

@example With Rich Content
```tsx
const items = [
  {
    id: 'features',
    title: 'Features',
    content: (
      <ul className="list-disc list-inside space-y-2">
        <li>Full keyboard navigation</li>
        <li>Screen reader support</li>
        <li>ARIA compliant</li>
      </ul>
    ),
  },
  {
    id: 'pricing',
    title: 'Pricing',
    content: (
      <div className="space-y-2">
        <p>Free tier: $0/month</p>
        <p>Pro tier: $10/month</p>
        <button className="mt-2">Get Started</button>
      </div>
    ),
  },
];

<AccessibleAccordion items={items} />
```

@example FAQ Accordion
```tsx
const faqs = [
  {
    id: 'q1',
    title: 'How do I reset my password?',
    content: 'Click on "Forgot Password" on the login page and follow the instructions sent to your email.',
  },
  {
    id: 'q2',
    title: 'Can I cancel my subscription?',
    content: 'Yes, you can cancel anytime from your account settings. Your access will continue until the end of the billing period.',
  },
  {
    id: 'q3',
    title: 'Do you offer refunds?',
    content: 'We offer a 30-day money-back guarantee for all paid plans.',
    disabled: true, // Example of disabled item
  },
];

<AccessibleAccordion
  items={faqs}
  allowMultiple={true}
  defaultOpenItems={['q1']}
/>
```

============================================================================
ACCESSIBILITY CHECKLIST
============================================================================

✅ Uses semantic <button> for accordion headers
✅ Proper heading hierarchy (<h3> wraps button)
✅ aria-expanded indicates open/closed state
✅ aria-controls links button to panel
✅ <section> with aria-labelledby on panel
✅ aria-labelledby links panel to heading
✅ hidden attribute for closed panels
✅ Keyboard navigation (Arrow keys, Home, End)
✅ Enter/Space toggles sections (native button behavior)
✅ Focus indicators are visible
✅ Disabled state prevents interaction

============================================================================
KEYBOARD SHORTCUTS
============================================================================

NAVIGATION:
- ArrowDown: Move focus to next accordion header
- ArrowUp: Move focus to previous accordion header
- Home: Move focus to first accordion header
- End: Move focus to last accordion header

ACTIVATION:
- Enter or Space: Toggle current section
- Tab: Move focus out of accordion to next focusable element

============================================================================
BEST PRACTICES
============================================================================

1. HEADING HIERARCHY
   ✅ Use appropriate heading level (h2, h3, etc.)
   ✅ Maintain logical document outline
   ❌ Don't skip heading levels

2. CONTENT LENGTH
   ✅ Keep accordion titles concise
   ✅ Provide meaningful titles that describe content
   ❌ Don't use generic titles like "More Info"

3. INITIAL STATE
   ✅ Consider opening first item by default
   ✅ Or open items relevant to current context
   ❌ Don't open all items (defeats purpose)

4. ALLOW MULTIPLE
   ✅ Use allowMultiple={true} for FAQs
   ✅ Use allowMultiple={false} for step-by-step processes
   ❓ Consider use case when deciding

5. DISABLED ITEMS
   ✅ Only disable if content is truly unavailable
   ✅ Provide explanation why item is disabled
   ❌ Don't overuse disabled state

============================================================================
TESTING GUIDE
============================================================================

KEYBOARD TESTING:
1. Tab to first accordion button
2. Use Arrow keys to navigate between buttons
3. Press Enter/Space to toggle sections
4. Verify Home/End keys work
5. Tab through open panel content

SCREEN READER TESTING:
1. Navigate to accordion
2. Verify each button announces: "[Title], button, expanded/collapsed"
3. Verify panel content is announced when opened
4. Verify heading level is announced
5. Test with NVDA/JAWS/VoiceOver

VISUAL TESTING:
1. Verify focus indicators are visible
2. Check expand/collapse animation is smooth
3. Verify disabled state is visually distinct
4. Test on mobile/tablet viewports

============================================================================
COMMON MISTAKES TO AVOID
============================================================================

❌ Using <div> with onClick instead of <button>
❌ Missing aria-expanded attribute
❌ Missing aria-controls attribute
❌ Not using <section> with aria-labelledby on panels
❌ Not hiding closed panels (hidden or display:none)
❌ Missing keyboard navigation
❌ Poor heading hierarchy
❌ Generic or unclear titles

✅ Use semantic button element
✅ Include all required ARIA attributes
✅ Implement full keyboard navigation
✅ Use proper headings
✅ Provide clear, descriptive titles

============================================================================
 */
