# Accessibility Linting Documentation

## Overview

This project uses comprehensive accessibility linting to ensure WCAG 2.1 compliance and improve the user experience for people with disabilities. We use `eslint-plugin-jsx-a11y` (v6.10.2) to catch accessibility issues during development.

## Configuration

The accessibility linting is configured in `eslint.config.js` with three severity levels:

### 🔴 Errors (Must Fix)

These are critical accessibility violations that will cause ESLint to fail:

#### Core Content Rules
- **`jsx-a11y/alt-text`** - All images, areas, and input[type="image"] must have alt text
- **`jsx-a11y/anchor-has-content`** - Anchors must have accessible content
- **`jsx-a11y/anchor-is-valid`** - Anchors must be valid navigable elements
- **`jsx-a11y/heading-has-content`** - Headings must have accessible content

#### ARIA Rules
- **`jsx-a11y/aria-props`** - Only valid ARIA properties are allowed
- **`jsx-a11y/aria-proptypes`** - ARIA properties must have valid values
- **`jsx-a11y/aria-role`** - ARIA roles must be valid and non-abstract
- **`jsx-a11y/aria-unsupported-elements`** - Certain elements cannot have ARIA roles
- **`jsx-a11y/role-has-required-aria-props`** - ARIA roles must have required properties
- **`jsx-a11y/role-supports-aria-props`** - ARIA properties must be supported by the role

#### Document Structure
- **`jsx-a11y/html-has-lang`** - `<html>` element must have a lang attribute
- **`jsx-a11y/iframe-has-title`** - iframes must have a title attribute
- **`jsx-a11y/scope`** - scope attribute must only be used on `<th>` elements

#### Interactive Elements
- **`jsx-a11y/no-distracting-elements`** - No `<marquee>` or `<blink>` elements
- **`jsx-a11y/tabindex-no-positive`** - No positive tabindex values
- **`jsx-a11y/no-aria-hidden-on-focusable`** - Focusable elements cannot have aria-hidden

### ⚠️ Warnings (Should Fix)

These issues should be addressed but won't fail the build:

#### Interactive Elements
- **`jsx-a11y/click-events-have-key-events`** - Elements with onClick need keyboard handlers
- **`jsx-a11y/no-static-element-interactions`** - Interactive divs/spans need proper roles
- **`jsx-a11y/mouse-events-have-key-events`** - onMouseOver/Out need keyboard equivalents
- **`jsx-a11y/no-noninteractive-element-interactions`** - Non-interactive elements shouldn't have click handlers
- **`jsx-a11y/no-noninteractive-tabindex`** - Non-interactive elements shouldn't have tabindex
- **`jsx-a11y/interactive-supports-focus`** - Interactive elements must be focusable

#### Forms & Labels
- **`jsx-a11y/label-has-associated-control`** - Labels must be associated with form controls
  - Configured to recognize custom components: `Input`, `Select`, `Textarea`, `Label`
  - Search depth: 3 levels
- **`jsx-a11y/autocomplete-valid`** - Autocomplete attributes must be valid

#### Media
- **`jsx-a11y/media-has-caption`** - Audio/video elements must have caption tracks
  - Recognizes custom components: `Audio`, `Video`

#### Best Practices
- **`jsx-a11y/img-redundant-alt`** - Alt text shouldn't contain "image", "photo", etc.
- **`jsx-a11y/no-access-key`** - Avoid using accessKey attribute
- **`jsx-a11y/no-redundant-roles`** - Don't use redundant role attributes
- **`jsx-a11y/prefer-tag-over-role`** - Use semantic HTML instead of ARIA roles

## Current Status

### Summary
- **Total Issues**: 355
- **Errors**: 6 (critical)
- **Warnings**: 349

### Critical Issues (Errors)

#### autoFocus Usage (3 errors)
**Problem**: The `autoFocus` prop reduces usability and accessibility

**Files**:
1. `src/components/blog/EditCommentForm.tsx:41`
2. `src/components/blog/ReplyForm.tsx:39`
3. `src/components/instructor/QuestionQueue.tsx:180`

**Fix**: Remove autoFocus or implement a more accessible focus management strategy.

```tsx
// ❌ Bad
<input autoFocus />

// ✅ Good - Use focus management with user interaction
const inputRef = useRef<HTMLInputElement>(null);
useEffect(() => {
  if (userInitiatedAction) {
    inputRef.current?.focus();
  }
}, [userInitiatedAction]);
```

#### Empty Headings (2 errors)
**Problem**: Headings must have accessible content

**Files**:
1. `src/components/ui/alert.tsx:39`
2. `src/components/ui/card.tsx:36`

**Fix**: Ensure headings always have text content or use aria-label.

```tsx
// ❌ Bad
<h2 {...props} />

// ✅ Good
<h2 {...props}>
  {children || <span className="sr-only">Default heading</span>}
</h2>
```

#### Empty Anchor (1 error)
**Problem**: Anchors must have accessible content

**Files**:
1. `src/components/ui/pagination.tsx:49`

**Fix**: Ensure anchor has text content or aria-label.

```tsx
// ❌ Bad
<a href="#" />

// ✅ Good
<a href="#" aria-label="Go to page">
  <Icon />
</a>
```

### Common Warning Patterns

#### 1. Click Events Without Keyboard Support
**Count**: ~50 instances

**Example Issue**:
```tsx
<div onClick={handleClick}>Click me</div>
```

**Fix**:
```tsx
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
>
  Click me
</div>
```

**Better Fix** (use semantic HTML):
```tsx
<button onClick={handleClick}>Click me</button>
```

#### 2. Labels Not Associated with Controls
**Count**: ~100 instances

**Example Issue**:
```tsx
<label>Name</label>
<input />
```

**Fix**:
```tsx
<label htmlFor="name">Name</label>
<input id="name" />

// Or wrap the input
<label>
  Name
  <input />
</label>
```

#### 3. Media Without Captions
**Count**: ~10 instances

**Example Issue**:
```tsx
<video src="video.mp4" />
```

**Fix**:
```tsx
<video src="video.mp4">
  <track kind="captions" src="captions.vtt" srcLang="en" label="English" />
</video>
```

## Running Accessibility Linting

### Local Development

```bash
# Run linting
npm run lint

# Auto-fix issues (where possible)
npm run lint:fix

# Run all checks (lint + typecheck + format)
npm run check:all
```

### Pre-commit Hook

The project uses Husky to run linting before commits. Accessibility errors will block commits, but warnings will allow commits to proceed with a message.

### CI/CD Integration

Accessibility linting runs on:
- Pull requests
- Main branch pushes
- Pre-deployment checks

## Best Practices

### 1. Semantic HTML First
Always prefer semantic HTML over divs with roles:

```tsx
// ❌ Avoid
<div role="button" onClick={...}>Click</div>

// ✅ Prefer
<button onClick={...}>Click</button>
```

### 2. Keyboard Navigation
Ensure all interactive elements work with keyboard:

```tsx
// ❌ Mouse-only
<div onClick={handleClick}>

// ✅ Keyboard + Mouse
<button
  onClick={handleClick}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
>
```

### 3. Screen Reader Support
Provide meaningful labels and descriptions:

```tsx
// ❌ No context
<button><CloseIcon /></button>

// ✅ With context
<button aria-label="Close dialog">
  <CloseIcon />
</button>
```

### 4. Focus Management
Manage focus for modals and dynamic content:

```tsx
useEffect(() => {
  if (isOpen) {
    modalRef.current?.focus();
  }
}, [isOpen]);
```

### 5. Color Contrast
While not checked by this linter, ensure:
- Text contrast ratio ≥ 4.5:1 (normal text)
- Text contrast ratio ≥ 3:1 (large text)
- Use tools like [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

## Custom Component Configuration

Our linting is configured to recognize custom shadcn/ui components:

```javascript
'jsx-a11y/label-has-associated-control': [
  'warn',
  {
    labelComponents: ['Label'],
    labelAttributes: ['label'],
    controlComponents: ['Input', 'Select', 'Textarea'],
    depth: 3,
  },
]
```

## Resources

### Official Documentation
- [eslint-plugin-jsx-a11y](https://github.com/jsx-eslint/eslint-plugin-jsx-a11y)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

### Testing Tools
- [@axe-core/react](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/react) - Runtime accessibility testing
- [WAVE Browser Extension](https://wave.webaim.org/extension/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [Screen readers](https://www.nvaccess.org/) - Test with NVDA (Windows) or VoiceOver (Mac)

### Learning Resources
- [WebAIM](https://webaim.org/)
- [The A11Y Project](https://www.a11yproject.com/)
- [Inclusive Components](https://inclusive-components.design/)

## Fixing Issues

### Priority Order

1. **Fix critical errors first** (6 errors)
   - Remove autoFocus props
   - Add content to empty headings
   - Add content to empty anchors

2. **Address high-frequency warnings** (~150 instances)
   - Add keyboard handlers to click events
   - Associate labels with form controls
   - Add captions to media elements

3. **Clean up remaining warnings** (~200 instances)
   - Unused imports and variables
   - Other code quality issues

### Getting Help

If you're unsure how to fix an accessibility issue:
1. Read the rule documentation: `https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/blob/main/docs/rules/[rule-name].md`
2. Check examples in this document
3. Test with a screen reader
4. Ask the team or check existing patterns in the codebase

## Maintenance

### Updating Rules

When updating accessibility rules:
1. Review the plugin's changelog
2. Test on a feature branch
3. Document any new rules in this file
4. Communicate changes to the team

### Exceptions

If you need to disable a rule temporarily:

```tsx
{/* eslint-disable-next-line jsx-a11y/click-events-have-key-events */}
<div onClick={handleClick}>...</div>
```

**Always include a comment explaining why the exception is needed!**

---

**Last Updated**: October 15, 2025
**Maintainer**: Development Team
**Plugin Version**: eslint-plugin-jsx-a11y@6.10.2
