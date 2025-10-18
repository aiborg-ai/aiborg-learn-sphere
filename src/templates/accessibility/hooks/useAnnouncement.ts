/**
 * useAnnouncement Hook
 *
 * Creates accessible announcements for screen readers using ARIA live regions
 * Perfect for dynamic content updates, notifications, loading states, etc.
 *
 * FEATURES:
 * - Polite and assertive announcements
 * - Auto-clearing announcements
 * - Queue management for multiple announcements
 * - Status updates
 * - Error announcements
 *
 * @example
 * const { announce } = useAnnouncement();
 * announce('Item added to cart', 'polite');
 */

import { useState, useCallback, useEffect, useRef } from 'react';

export type AnnouncementPoliteness = 'polite' | 'assertive' | 'off';

export interface UseAnnouncementOptions {
  /**
   * Politeness level for announcements
   * - 'polite': Waits for user to finish current task (default)
   * - 'assertive': Interrupts user immediately
   * - 'off': Not announced
   */
  politeness?: AnnouncementPoliteness;

  /**
   * Auto-clear announcements after delay (ms)
   * Default: 5000 (5 seconds)
   * Set to 0 to disable auto-clear
   */
  clearDelay?: number;

  /**
   * Maximum number of queued announcements
   * Default: 3
   */
  maxQueue?: number;
}

export interface UseAnnouncementReturn {
  /**
   * Make an announcement
   */
  announce: (message: string, politeness?: AnnouncementPoliteness) => void;

  /**
   * Clear current announcement
   */
  clear: () => void;

  /**
   * Clear all queued announcements
   */
  clearAll: () => void;

  /**
   * Announcement component to render
   */
  Announcer: () => JSX.Element;

  /**
   * Current announcement message
   */
  message: string;
}

export function useAnnouncement({
  politeness: defaultPoliteness = 'polite',
  clearDelay = 5000,
  maxQueue = 3,
}: UseAnnouncementOptions = {}): UseAnnouncementReturn {
  const [message, setMessage] = useState('');
  const [currentPoliteness, setCurrentPoliteness] = useState<AnnouncementPoliteness>(defaultPoliteness);
  const [queue, setQueue] = useState<Array<{ message: string; politeness: AnnouncementPoliteness }>>([]);
  const timeoutRef = useRef<NodeJS.Timeout>();

  /* =========================================================================
   * ANNOUNCE FUNCTION
   * ========================================================================= */

  const announce = useCallback(
    (newMessage: string, politeness: AnnouncementPoliteness = defaultPoliteness) => {
      // If currently announcing, queue this message
      if (message) {
        setQueue((prev) => {
          const newQueue = [...prev, { message: newMessage, politeness }];
          // Limit queue size
          return newQueue.slice(-maxQueue);
        });
        return;
      }

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new message
      setMessage(newMessage);
      setCurrentPoliteness(politeness);

      // Auto-clear after delay
      if (clearDelay > 0) {
        timeoutRef.current = setTimeout(() => {
          setMessage('');
        }, clearDelay);
      }
    },
    [message, defaultPoliteness, clearDelay, maxQueue]
  );

  /* =========================================================================
   * CLEAR FUNCTIONS
   * ========================================================================= */

  const clear = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setMessage('');
  }, []);

  const clearAll = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setMessage('');
    setQueue([]);
  }, []);

  /* =========================================================================
   * PROCESS QUEUE
   * ========================================================================= */

  useEffect(() => {
    // When current message is cleared and queue has items, announce next
    if (!message && queue.length > 0) {
      const [next, ...rest] = queue;
      setQueue(rest);
      announce(next.message, next.politeness);
    }
  }, [message, queue, announce]);

  /* =========================================================================
   * CLEANUP
   * ========================================================================= */

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  /* =========================================================================
   * ANNOUNCER COMPONENT
   * ========================================================================= */

  const Announcer = useCallback(
    () => (
      <div
        role={currentPoliteness === 'assertive' ? 'alert' : 'status'}
        aria-live={currentPoliteness}
        aria-atomic="true"
        className="sr-only" // Screen reader only - visually hidden
      >
        {message}
      </div>
    ),
    [message, currentPoliteness]
  );

  return {
    announce,
    clear,
    clearAll,
    Announcer,
    message,
  };
}

/* ============================================================================
 * USAGE EXAMPLES
 * ============================================================================

@example Basic Announcement
```tsx
function ShoppingCart() {
  const { announce, Announcer } = useAnnouncement();

  const addToCart = (item: Item) => {
    // Add item logic...
    announce(`${item.name} added to cart`, 'polite');
  };

  return (
    <>
      <Announcer />
      <button onClick={() => addToCart(item)}>Add to Cart</button>
    </>
  );
}
```

@example Error Announcements
```tsx
function Form() {
  const { announce, Announcer } = useAnnouncement();

  const handleSubmit = async () => {
    try {
      await submitForm();
      announce('Form submitted successfully', 'polite');
    } catch (error) {
      // Assertive for errors - interrupts user
      announce('Error submitting form. Please try again.', 'assertive');
    }
  };

  return (
    <>
      <Announcer />
      <form onSubmit={handleSubmit}>
        {/* form fields */}
      </form>
    </>
  );
}
```

@example Loading States
```tsx
function DataTable() {
  const { announce, Announcer } = useAnnouncement();
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    announce('Loading data', 'polite');

    const data = await fetchData();

    setIsLoading(false);
    announce(`Loaded ${data.length} items`, 'polite');
  };

  return (
    <>
      <Announcer />
      <button onClick={loadData} disabled={isLoading}>
        Load Data
      </button>
    </>
  );
}
```

@example Search Results
```tsx
function SearchResults() {
  const { announce, Announcer } = useAnnouncement();
  const [results, setResults] = useState([]);

  const search = async (query: string) => {
    announce('Searching...', 'polite');

    const data = await searchAPI(query);
    setResults(data);

    announce(
      `Found ${data.length} result${data.length === 1 ? '' : 's'} for "${query}"`,
      'polite'
    );
  };

  return (
    <>
      <Announcer />
      <input
        type="search"
        onChange={(e) => search(e.target.value)}
        placeholder="Search..."
      />
    </>
  );
}
```

@example Multiple Announcements with Queue
```tsx
function BulkActions() {
  const { announce, Announcer } = useAnnouncement({ maxQueue: 5 });

  const deleteMultiple = async (items: Item[]) => {
    for (const item of items) {
      await deleteItem(item);
      announce(`Deleted ${item.name}`, 'polite');
    }
    announce('All items deleted successfully', 'assertive');
  };

  return (
    <>
      <Announcer />
      {/* UI */}
    </>
  );
}
```

@example Global Announcer (App-wide)
```tsx
// Create a global announcer context
const AnnouncementContext = createContext<UseAnnouncementReturn | null>(null);

function App() {
  const announcement = useAnnouncement();

  return (
    <AnnouncementContext.Provider value={announcement}>
      <announcement.Announcer />
      <YourApp />
    </AnnouncementContext.Provider>
  );
}

// Use anywhere in your app
function AnyComponent() {
  const { announce } = useContext(AnnouncementContext)!;

  const handleAction = () => {
    // Do something
    announce('Action completed');
  };
}
```

============================================================================
WHEN TO USE ANNOUNCEMENTS
============================================================================

✅ GOOD USE CASES:
- Form submission results (success/error)
- Items added/removed from lists
- Search results count
- Loading states
- Validation errors
- Save/update confirmations
- Deletion confirmations
- Filter/sort applied
- Data refresh completed

❌ AVOID FOR:
- Every single state change (too noisy)
- Purely visual updates
- Hover states
- Focus changes (browser handles this)
- Redundant information

============================================================================
POLITENESS LEVELS
============================================================================

POLITE ('polite'):
- Waits for user to finish current task
- Use for: notifications, confirmations, non-urgent updates
- Example: "Item added to cart"

ASSERTIVE ('assertive'):
- Interrupts user immediately
- Use for: errors, warnings, critical alerts
- Example: "Error: Form submission failed"

OFF ('off'):
- Not announced
- Use for: debugging, conditional announcements
- Example: Optional announcements based on user preference

============================================================================
BEST PRACTICES
============================================================================

1. BE CONCISE
   ✅ "3 items found"
   ❌ "The search has completed and found 3 items matching your query"

2. BE SPECIFIC
   ✅ "Email sent successfully"
   ❌ "Success"

3. USE ASSERTIVE SPARINGLY
   ✅ Use for errors and critical alerts only
   ❌ Don't interrupt users for routine updates

4. INCLUDE CONTEXT
   ✅ "Password updated successfully"
   ❌ "Updated"

5. TEST WITH SCREEN READERS
   ✅ Test with NVDA, JAWS, or VoiceOver
   ✅ Verify announcements are clear and timely
   ✅ Check they don't interrupt important content

============================================================================
 */
