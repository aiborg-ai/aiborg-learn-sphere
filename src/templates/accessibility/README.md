# Accessibility Templates Library

**Complete WCAG 2.1 Level AA Compliant Templates for aiborg-learn-sphere**

This library provides production-ready, fully accessible React components and hooks that follow WCAG 2.1 Level AA guidelines. Use these templates to build accessible features quickly and correctly.

---

## 📚 Table of Contents

- [Quick Start](#quick-start)
- [Components](#components)
- [Hooks](#hooks)
- [Installation](#installation)
- [Usage Examples](#usage-examples)
- [Testing](#testing)
- [Best Practices](#best-practices)
- [Resources](#resources)

---

## 🚀 Quick Start

### 1. Copy Template to Your Project

```bash
# Copy a component template
cp src/templates/accessibility/components/AccessibleButton.template.tsx \
   src/components/ui/accessible-button.tsx

# Copy a hook
cp src/templates/accessibility/hooks/useKeyboardNavigation.ts \
   src/hooks/useKeyboardNavigation.ts
```

### 2. Remove `.template` Extension

Rename the file and remove `.template` from the filename.

### 3. Import and Use

```tsx
import { AccessibleButton } from '@/components/ui/accessible-button';

<AccessibleButton onClick={handleClick}>Click Me</AccessibleButton>
```

### 4. Customize

Each template is fully documented with examples. Customize as needed while maintaining accessibility features.

---

## 🎨 Components

### **AccessibleButton**
`components/AccessibleButton.template.tsx`

Fully accessible button with proper ARIA attributes.

**Features:**
- ✅ Icon-only button support (requires aria-label)
- ✅ Loading states with aria-busy
- ✅ Keyboard support (Enter/Space)
- ✅ Visible focus indicators
- ✅ Multiple variants (default, destructive, outline, ghost, link)

**Quick Example:**
```tsx
// Icon-only button
<AccessibleButton
  onClick={handleClose}
  aria-label="Close dialog"
  size="icon"
>
  <X aria-hidden="true" className="h-4 w-4" />
</AccessibleButton>

// Loading button
<AccessibleButton isLoading={isSubmitting}>
  Submit Form
</AccessibleButton>
```

---

### **AccessibleForm Components**
`components/AccessibleForm.template.tsx`

Complete form field components with full validation support.

**Includes:**
- `AccessibleTextInput` - Text input with label, error, help text
- `AccessibleTextarea` - Textarea with character count
- `AccessibleSelect` - Select dropdown
- `AccessibleCheckbox` - Checkbox with label

**Features:**
- ✅ Proper label association (htmlFor + id)
- ✅ Required field indicators
- ✅ Error messages with aria-live
- ✅ Help text with aria-describedby
- ✅ aria-invalid for failed validation

**Quick Example:**
```tsx
<AccessibleTextInput
  label="Email"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={errors.email}
  helpText="We'll never share your email"
  required
/>
```

---

### **AccessibleDialog**
`components/AccessibleDialog.template.tsx`

Fully accessible modal/dialog with focus management.

**Features:**
- ✅ Focus trap (Tab cycles within dialog)
- ✅ Escape key closes dialog
- ✅ Focus restoration on close
- ✅ Backdrop click handling
- ✅ ARIA attributes (role="dialog", aria-modal)
- ✅ Auto-focus on open

**Quick Example:**
```tsx
<AccessibleDialog
  open={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Action"
  description="Are you sure?"
>
  <p>This action cannot be undone.</p>
  <DialogFooter>
    <button onClick={() => setIsOpen(false)}>Cancel</button>
    <button onClick={handleConfirm}>Confirm</button>
  </DialogFooter>
</AccessibleDialog>
```

---

### **AccessibleTable**
`components/AccessibleTable.template.tsx`

Data table with proper semantic structure and sorting.

**Features:**
- ✅ Proper table caption
- ✅ Column headers with scope="col"
- ✅ Row headers with scope="row"
- ✅ Sortable columns with aria-sort
- ✅ Loading and empty states
- ✅ Custom cell renderers

**Quick Example:**
```tsx
const columns = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'email', header: 'Email', sortable: true },
  { key: 'role', header: 'Role' },
];

<AccessibleTable
  caption="User list"
  columns={columns}
  data={users}
  sortColumn={sortColumn}
  sortDirection={sortDirection}
  onSort={handleSort}
  hasRowHeaders
/>
```

---

### **AccessibleCard**
`components/AccessibleCard.template.tsx`

Card components for interactive and non-interactive content.

**Includes:**
- `Card` - Non-interactive card
- `ClickableCard` - Interactive card (button)
- `LinkCard` - Navigational card (anchor)

**Features:**
- ✅ Proper semantic elements (div, button, a)
- ✅ Keyboard navigation
- ✅ Focus indicators
- ✅ aria-label support

**Quick Example:**
```tsx
// Clickable card
<ClickableCard
  onClick={() => handleSelect(item)}
  aria-label={`Select ${item.name}`}
>
  <CardHeader>
    <CardTitle>{item.name}</CardTitle>
    <CardDescription>{item.description}</CardDescription>
  </CardHeader>
</ClickableCard>

// Link card
<LinkCard href={`/courses/${course.id}`}>
  <CardHeader>
    <CardTitle>{course.title}</CardTitle>
  </CardHeader>
</LinkCard>
```

---

## 🔧 Hooks

### **useKeyboardNavigation**
`hooks/useKeyboardNavigation.ts`

Provides keyboard navigation for lists, menus, and grids.

**Features:**
- ✅ Arrow key navigation
- ✅ Home/End support
- ✅ Enter/Space activation
- ✅ Escape handling
- ✅ Vertical, horizontal, or both orientations
- ✅ Optional looping

**Quick Example:**
```tsx
function Menu({ items, onSelect }) {
  const {
    focusedIndex,
    handleKeyDown,
    getItemProps,
  } = useKeyboardNavigation({
    items,
    onSelect,
    orientation: 'vertical',
  });

  return (
    <div role="menu" onKeyDown={handleKeyDown}>
      {items.map((item, index) => (
        <div key={index} {...getItemProps(index)}>
          {item.label}
        </div>
      ))}
    </div>
  );
}
```

---

### **useFocusTrap**
`hooks/useFocusTrap.ts`

Traps focus within a container (essential for modals).

**Features:**
- ✅ Traps Tab/Shift+Tab within container
- ✅ Auto-focuses first element
- ✅ Restores focus on unmount
- ✅ Configurable initial focus

**Quick Example:**
```tsx
function Modal({ isOpen, onClose }) {
  const modalRef = useFocusTrap<HTMLDivElement>({
    active: isOpen,
  });

  if (!isOpen) return null;

  return (
    <div ref={modalRef} role="dialog" aria-modal="true">
      <h2>Modal Title</h2>
      <button onClick={onClose}>Close</button>
    </div>
  );
}
```

---

### **useAnnouncement**
`hooks/useAnnouncement.ts`

Creates screen reader announcements for dynamic updates.

**Features:**
- ✅ Polite and assertive announcements
- ✅ Auto-clearing
- ✅ Queue management
- ✅ aria-live regions

**Quick Example:**
```tsx
function ShoppingCart() {
  const { announce, Announcer } = useAnnouncement();

  const addToCart = (item) => {
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

---

## 📦 Installation

### Option 1: Copy Templates (Recommended)

Copy templates directly into your project:

```bash
# Copy all components
cp -r src/templates/accessibility/components/* src/components/ui/

# Copy all hooks
cp -r src/templates/accessibility/hooks/* src/hooks/

# Remove .template extensions
find src/components/ui -name "*.template.tsx" -exec bash -c 'mv "$0" "${0/.template/}"' {} \;
find src/hooks -name "*.template.ts" -exec bash -c 'mv "$0" "${0/.template/}"' {} \;
```

### Option 2: Use as Reference

Keep templates in the `/templates` directory and reference them when building new components.

---

## 💡 Usage Examples

### Complete Form Example

```tsx
import { useState } from 'react';
import { AccessibleTextInput, AccessibleSelect, AccessibleCheckbox } from '@/components/ui/accessible-form';
import { AccessibleButton } from '@/components/ui/accessible-button';

function SignupForm() {
  const [formData, setFormData] = useState({
    email: '',
    country: '',
    terms: false,
  });
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // Validation logic...
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <AccessibleTextInput
        label="Email"
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        error={errors.email}
        required
      />

      <AccessibleSelect
        label="Country"
        value={formData.country}
        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
        options={[
          { value: 'us', label: 'United States' },
          { value: 'uk', label: 'United Kingdom' },
        ]}
        required
      />

      <AccessibleCheckbox
        label="I agree to the terms"
        checked={formData.terms}
        onChange={(e) => setFormData({ ...formData, terms: e.target.checked })}
        error={errors.terms}
        required
      />

      <AccessibleButton type="submit">
        Sign Up
      </AccessibleButton>
    </form>
  );
}
```

### Data Table with Sorting Example

```tsx
function UsersTable({ users }: Props) {
  const [sortColumn, setSortColumn] = useState('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (column: string) => {
    if (column === sortColumn) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      const modifier = sortDirection === 'asc' ? 1 : -1;
      return aVal > bVal ? modifier : -modifier;
    });
  }, [users, sortColumn, sortDirection]);

  const columns = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'email', header: 'Email', sortable: true },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, row) => (
        <button aria-label={`Edit ${row.name}`}>Edit</button>
      ),
    },
  ];

  return (
    <AccessibleTable
      caption="User management table"
      columns={columns}
      data={sortedUsers}
      sortColumn={sortColumn}
      sortDirection={sortDirection}
      onSort={handleSort}
      hasRowHeaders
    />
  );
}
```

---

## 🧪 Testing

### Keyboard Testing

Test all components with keyboard only (no mouse):

1. **Tab Navigation**
   - Tab through all interactive elements
   - Verify logical order
   - Check focus indicators are visible

2. **Keyboard Shortcuts**
   - Enter/Space activates buttons
   - Escape closes dialogs
   - Arrow keys navigate lists
   - Home/End go to first/last items

### Screen Reader Testing

Test with real screen readers:

- **Windows**: NVDA (free) or JAWS
- **Mac**: VoiceOver (built-in)
- **Linux**: Orca

**What to verify:**
- All elements are announced
- Labels are descriptive
- States are communicated (expanded, selected, etc.)
- Errors are announced immediately
- Dynamic updates are announced

### Automated Testing

```typescript
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { AccessibleButton } from '@/components/ui/accessible-button';

expect.extend(toHaveNoViolations);

test('button is accessible', async () => {
  const { container } = render(
    <AccessibleButton onClick={jest.fn()}>Click Me</AccessibleButton>
  );

  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

---

## ✅ Best Practices

### 1. Semantic HTML First

Always prefer semantic HTML over ARIA:

```tsx
// ❌ Bad
<div role="button" onClick={handleClick}>Click</div>

// ✅ Good
<button onClick={handleClick}>Click</button>
```

### 2. Provide Text Alternatives

All non-text content needs text alternatives:

```tsx
// ❌ Bad
<button><TrashIcon /></button>

// ✅ Good
<button aria-label="Delete item">
  <TrashIcon aria-hidden="true" />
</button>
```

### 3. Keyboard Accessibility

All interactive elements must be keyboard accessible:

```tsx
// ❌ Bad
<div onClick={handleClick}>Click</div>

// ✅ Good
<button onClick={handleClick}>Click</button>
```

### 4. Focus Management

Manage focus properly in dynamic content:

```tsx
// ✅ Good - Dialog traps focus
const dialogRef = useFocusTrap({ active: isOpen });

// ✅ Good - Focus returns to trigger
<AccessibleDialog
  open={isOpen}
  onClose={handleClose}
  // Focus automatically returns to button
>
```

### 5. Error Handling

Make errors accessible:

```tsx
// ✅ Good - Error announced immediately
<AccessibleTextInput
  label="Email"
  error="Invalid email format"
  // Automatically adds role="alert" and aria-live="polite"
/>
```

---

## 📚 Resources

### WCAG Guidelines
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [MDN Accessibility Guide](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

### Testing Tools
- [axe DevTools](https://www.deque.com/axe/devtools/) - Browser extension
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Built into Chrome
- [WAVE](https://wave.webaim.org/extension/) - Browser extension
- [NVDA](https://www.nvaccess.org/) - Free screen reader (Windows)

### Learning Resources
- [WebAIM](https://webaim.org/)
- [The A11Y Project](https://www.a11yproject.com/)
- [Inclusive Components](https://inclusive-components.design/)

---

## 🤝 Contributing

When creating new templates:

1. Follow existing template structure
2. Include comprehensive documentation
3. Add usage examples
4. Include accessibility checklist
5. Test with keyboard and screen readers
6. Run automated accessibility tests

---

## 📝 License

These templates are part of the aiborg-learn-sphere project.

---

## ⚡ Quick Reference

| Component | Use For | Key Features |
|-----------|---------|--------------|
| AccessibleButton | All buttons | aria-label, loading states, variants |
| AccessibleForm | Form inputs | Label association, validation, errors |
| AccessibleDialog | Modals | Focus trap, escape handling, restore focus |
| AccessibleTable | Data tables | Sorting, headers, empty states |
| AccessibleCard | Content cards | Interactive vs static, navigation |

| Hook | Use For | Key Features |
|------|---------|--------------|
| useKeyboardNavigation | Lists, menus | Arrow keys, Home/End, looping |
| useFocusTrap | Modals, dialogs | Trap Tab, auto-focus, restore focus |
| useAnnouncement | Dynamic updates | Screen reader announcements, queue |

---

**Last Updated**: October 15, 2025
**Version**: 1.0.0
**Maintainer**: Development Team
