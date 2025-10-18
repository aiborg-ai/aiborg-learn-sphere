# ARIA Pattern Templates

**Production-Ready Accessible Component Patterns**

This directory contains WCAG 2.1 Level AA compliant ARIA pattern templates based on the [WAI-ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/).

---

## 📚 Available Patterns

### 1. **Accordion Pattern** ✅
`Accordion.pattern.tsx`

Expandable/collapsible sections with full keyboard navigation.

**Features:**
- ✅ Arrow key navigation (Up/Down)
- ✅ Home/End support
- ✅ aria-expanded state management
- ✅ Single-open or multi-open modes
- ✅ Smooth animations

**Use Cases:**
- FAQs
- Content sections
- Settings panels
- Help documentation

```tsx
<AccessibleAccordion
  items={faqItems}
  allowMultiple={true}
  defaultOpenItems={['q1']}
/>
```

---

### 2. **Tabs Pattern** ✅
`Tabs.pattern.tsx`

Tabbed interface with automatic or manual activation.

**Features:**
- ✅ Arrow key navigation (Left/Right or Up/Down)
- ✅ Automatic or manual activation modes
- ✅ Horizontal or vertical orientation
- ✅ Home/End support
- ✅ Proper ARIA tab roles

**Use Cases:**
- Content organization
- Settings pages
- Product details
- Dashboard panels

```tsx
<AccessibleTabs
  tabs={courseTabs}
  orientation="horizontal"
  activation="automatic"
/>
```

---

### 3. **Tooltip Pattern** ✅
`Tooltip.pattern.tsx`

Context-sensitive help tooltips that appear on hover/focus.

**Features:**
- ✅ Shows on hover AND focus
- ✅ Escape key dismisses
- ✅ Configurable delay
- ✅ Multiple positioning options
- ✅ aria-describedby linkage

**Use Cases:**
- Icon button labels
- Help text
- Additional context
- Field hints

```tsx
<AccessibleTooltip content="Save your changes">
  <button aria-label="Save">
    <SaveIcon />
  </button>
</AccessibleTooltip>
```

---

## 🎯 Pattern Comparison

| Pattern | Best For | Keyboard Nav | Activation |
|---------|----------|--------------|------------|
| Accordion | FAQs, expandable content | Arrow keys | Enter/Space |
| Tabs | Organized sections | Arrow keys | Automatic/Manual |
| Tooltip | Supplementary info | N/A (focus) | Hover/Focus |

---

## 🚀 Quick Start

### 1. Copy Pattern to Your Project

```bash
# Copy accordion pattern
cp src/templates/accessibility/patterns/Accordion.pattern.tsx \
   src/components/ui/accordion.tsx

# Remove .pattern from filename
mv src/components/ui/accordion.pattern.tsx \
   src/components/ui/accordion.tsx
```

### 2. Import and Use

```tsx
import { AccessibleAccordion } from '@/components/ui/accordion';

const items = [
  { id: '1', title: 'Question 1', content: <p>Answer 1</p> },
  { id: '2', title: 'Question 2', content: <p>Answer 2</p> },
];

<AccessibleAccordion items={items} />
```

---

## 📖 ARIA Roles Reference

### Accordion
- **Container**: No specific role
- **Header**: `<h3>` (or appropriate heading level)
- **Trigger**: `<button>` with `aria-expanded`
- **Panel**: `role="region"` with `aria-labelledby`

### Tabs
- **Container**: `role="tablist"`
- **Tab**: `role="tab"` with `aria-selected`
- **Panel**: `role="tabpanel"`
- **Relationships**: `aria-controls`, `aria-labelledby`

### Tooltip
- **Tooltip**: `role="tooltip"`
- **Relationship**: `aria-describedby` on trigger

---

## ⌨️ Keyboard Support

### Accordion
- **Arrow Down**: Next accordion header
- **Arrow Up**: Previous accordion header
- **Home**: First accordion header
- **End**: Last accordion header
- **Enter/Space**: Toggle section

### Tabs (Horizontal)
- **Arrow Right**: Next tab
- **Arrow Left**: Previous tab
- **Home**: First tab
- **End**: Last tab
- **Tab**: Exit tab list

### Tabs (Vertical)
- **Arrow Down**: Next tab
- **Arrow Up**: Previous tab
- **Home**: First tab
- **End**: Last tab
- **Tab**: Exit tab list

### Tooltip
- **Focus**: Show tooltip
- **Escape**: Hide tooltip
- **Blur**: Hide tooltip

---

## ✅ Accessibility Checklist

When implementing these patterns:

### General
- [ ] All ARIA roles are correctly applied
- [ ] Keyboard navigation works completely
- [ ] Focus indicators are visible
- [ ] Screen reader announces all states
- [ ] Works without mouse
- [ ] No keyboard traps

### Accordion
- [ ] Headers use proper heading level
- [ ] Buttons have aria-expanded
- [ ] Panels have role="region"
- [ ] aria-controls/aria-labelledby linked

### Tabs
- [ ] Tab list has role="tablist"
- [ ] Tabs have role="tab" and aria-selected
- [ ] Panels have role="tabpanel"
- [ ] Only selected tab has tabIndex={0}
- [ ] Inactive panels are hidden

### Tooltip
- [ ] Has role="tooltip"
- [ ] Linked via aria-describedby
- [ ] Shows on focus AND hover
- [ ] Dismissible with Escape
- [ ] Has pointer-events-none

---

## 🧪 Testing Guide

### For Each Pattern

#### 1. Keyboard Testing
- Navigate using only keyboard
- Verify all shortcuts work
- Check focus indicators
- Test Tab key behavior

#### 2. Screen Reader Testing
Test with:
- NVDA (Windows)
- JAWS (Windows)
- VoiceOver (Mac/iOS)

Verify:
- All elements are announced
- States are communicated
- Relationships are clear

#### 3. Automated Testing

```typescript
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';

test('pattern is accessible', async () => {
  const { container } = render(<YourPattern />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

---

## 📚 Resources

### Official Specifications
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

### Pattern-Specific Resources
- [Accordion Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/)
- [Tabs Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)
- [Tooltip Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/)

### Testing Tools
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [NVDA Screen Reader](https://www.nvaccess.org/)
- [React Testing Library](https://testing-library.com/react)

---

## 🎨 Customization

All patterns are fully customizable:

- **Styling**: Use className prop or modify component styles
- **Behavior**: Configure via props (activation mode, orientation, etc.)
- **Content**: Pass any React nodes as content
- **Animations**: Customize or remove transitions

Example:
```tsx
<AccessibleTabs
  tabs={tabs}
  className="custom-tabs"
  tabListClassName="custom-tab-list"
  tabPanelClassName="custom-panel"
  orientation="vertical"
  activation="manual"
/>
```

---

## 🔄 Migration from Existing Code

### Accordion
If you have existing accordion code:
```tsx
// Before (non-accessible)
<div onClick={() => toggle(id)}>
  {title}
</div>

// After (accessible)
<AccessibleAccordion
  items={[{ id, title, content }]}
/>
```

### Tabs
```tsx
// Before
<div className={active && 'active'} onClick={setTab}>
  {label}
</div>

// After
<AccessibleTabs
  tabs={[{ id, label, content }]}
  selectedTab={activeTab}
  onTabChange={setActiveTab}
/>
```

---

## 💡 Best Practices

### DO ✅
- Use semantic HTML as base
- Provide keyboard navigation
- Include all required ARIA attributes
- Test with screen readers
- Follow WAI-ARIA guidelines

### DON'T ❌
- Use divs with onClick for interactive elements
- Skip keyboard support
- Forget ARIA relationships
- Make assumptions about user capabilities
- Ignore focus management

---

## 📦 What's Included

Each pattern template includes:

1. **Complete Component Code**
   - TypeScript interfaces
   - Full implementation
   - Keyboard handling
   - ARIA attributes

2. **Documentation**
   - Usage examples
   - Props documentation
   - Accessibility checklist
   - Best practices

3. **Testing Guide**
   - Keyboard testing steps
   - Screen reader testing
   - Automated testing examples

4. **Code Comments**
   - Inline explanations
   - Common mistakes
   - Implementation notes

---

## 🆘 Support

### Questions?
- Review the inline documentation in each pattern file
- Check the main README: `../README.md`
- Consult WAI-ARIA Authoring Practices

### Found an Issue?
- Check the accessibility checklist
- Test with screen readers
- Verify keyboard navigation
- Review ARIA attributes

---

**Last Updated**: October 15, 2025
**Version**: 1.0.0
**Status**: Production Ready ✅
