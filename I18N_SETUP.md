# Internationalization (i18n) Setup Guide

**Status**: ✅ Complete
**Date**: October 10, 2025
**Framework**: react-i18next
**Languages**: English, Spanish, French (placeholder), German (placeholder)

---

## 📦 Installed Packages

```json
{
  "i18next": "^25.6.0",
  "react-i18next": "^16.0.0",
  "i18next-browser-languagedetector": "^8.2.0"
}
```

---

## 📁 File Structure

```
src/
├── i18n/
│   └── config.ts                 # i18n configuration
├── locales/
│   ├── en/                       # English translations
│   │   ├── common.json
│   │   ├── navigation.json
│   │   ├── assessment.json
│   │   ├── courses.json
│   │   └── auth.json
│   ├── es/                       # Spanish translations
│   │   ├── common.json
│   │   ├── navigation.json
│   │   ├── assessment.json
│   │   ├── courses.json
│   │   └── auth.json
│   ├── fr/                       # French translations (placeholder)
│   │   └── *.json
│   └── de/                       # German translations (placeholder)
│       └── *.json
└── components/
    ├── LanguageSwitcher.tsx      # Language switcher component
    └── examples/
        └── TranslationExample.tsx # Usage examples
```

---

## 🚀 Quick Start

### 1. Configuration

i18n is automatically initialized when the app starts:

```typescript
// src/main.tsx
import './i18n/config' // <-- Imports i18n configuration
```

### 2. Basic Usage

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('app.name')}</h1>
      <button>{t('actions.save')}</button>
    </div>
  );
}
```

### 3. With Namespaces

```tsx
import { useTranslation } from 'react-i18next';

function Navigation() {
  const { t } = useTranslation('navigation');

  return (
    <nav>
      <a href="/">{t('menu.home')}</a>
      <a href="/blog">{t('menu.blog')}</a>
    </nav>
  );
}
```

---

## 🌍 Supported Languages

| Language | Code | Flag | Status |
|----------|------|------|--------|
| English | `en` | 🇬🇧 | ✅ Complete |
| Spanish | `es` | 🇪🇸 | ✅ Complete |
| French | `fr` | 🇫🇷 | ⚠️ Placeholder |
| German | `de` | 🇩🇪 | ⚠️ Placeholder |

---

## 📝 Translation Namespaces

### 1. **common** - General UI elements
```json
{
  "app": { "name": "Aiborg", "tagline": "..." },
  "actions": { "save": "Save", "cancel": "Cancel", ... },
  "status": { "success": "Success", ... },
  "messages": { "success": "...", "error": "..." },
  "validation": { "required": "...", ... }
}
```

### 2. **navigation** - Navigation menu
```json
{
  "menu": { "home": "Home", "programs": "Programs", ... },
  "user": { "dashboard": "...", "profile": "..." },
  "features": { "search": "Search", ... }
}
```

### 3. **assessment** - AI Assessment feature
```json
{
  "hero": { "title": "...", "description": "..." },
  "stats": { "assessmentsTaken": "...", ... },
  "features": { "title": "...", ... },
  "wizard": { "progress": "...", ... },
  "results": { "title": "...", ... }
}
```

### 4. **courses** - Course pages
```json
{
  "common": { "course": "Course", ... },
  "actions": { "enroll": "Enroll Now", ... },
  "details": { "overview": "Overview", ... },
  "progress": { "title": "Your Progress", ... }
}
```

### 5. **auth** - Authentication
```json
{
  "signIn": { "title": "Sign In", ... },
  "signUp": { "title": "Create Account", ... },
  "validation": { "emailRequired": "...", ... }
}
```

---

## 💻 Usage Examples

### Simple Translation
```tsx
const { t } = useTranslation();

// Basic translation
<h1>{t('app.name')}</h1>

// With namespace
<p>{t('common:actions.save')}</p>

// From specific namespace hook
const { t: tNav } = useTranslation('navigation');
<a>{tNav('menu.home')}</a>
```

### Translation with Variables
```tsx
// Translation file: "progress.percentage": "{{percent}}% Complete"
<p>{t('progress.percentage', { percent: 75 })}</p>
// Output: "75% Complete"

// Translation file: "validation.minLength": "Minimum length is {{min}} characters"
<p>{t('validation.minLength', { min: 8 })}</p>
// Output: "Minimum length is 8 characters"
```

### Multiple Namespaces
```tsx
const { t } = useTranslation(['common', 'navigation', 'auth']);

<button>{t('common:actions.save')}</button>
<nav>{t('navigation:menu.home')}</nav>
<form>{t('auth:signIn.title')}</form>
```

### Changing Language
```tsx
const { i18n } = useTranslation();

// Change to Spanish
await i18n.changeLanguage('es');

// Get current language
const currentLang = i18n.language; // 'en', 'es', etc.

// Check if language is loaded
const isLoaded = i18n.isInitialized;
```

### With Fallback
```tsx
// If 'custom.key' doesn't exist, show fallback
<p>{t('custom.key', 'Default text')}</p>
```

---

## 🎨 Language Switcher Component

### Full Version (with dropdown)
```tsx
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

<LanguageSwitcher
  variant="ghost"        // Button variant
  size="default"         // Button size
  showLabel={true}       // Show language name
/>
```

### Compact Version (flag only)
```tsx
import { CompactLanguageSwitcher } from '@/components/LanguageSwitcher';

<CompactLanguageSwitcher />
// Cycles through languages on click
```

### Props
```typescript
interface LanguageSwitcherProps {
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;  // Show language name or just flag
}
```

---

## ➕ Adding New Languages

### 1. Create Translation Files

```bash
mkdir -p src/locales/ja
touch src/locales/ja/{common,navigation,assessment,courses,auth}.json
```

### 2. Add Translations

Copy structure from `src/locales/en/` and translate:

```json
// src/locales/ja/common.json
{
  "app": {
    "name": "Aiborg",
    "tagline": "AIを活用した学習プラットフォーム"
  },
  "actions": {
    "save": "保存",
    "cancel": "キャンセル",
    ...
  }
}
```

### 3. Update Configuration

```typescript
// src/i18n/config.ts

// Import translations
import jaCommon from '@/locales/ja/common.json';
import jaNavigation from '@/locales/ja/navigation.json';
// ... other imports

// Add to resources
const resources = {
  en: { ... },
  es: { ... },
  ja: {  // <-- Add new language
    common: jaCommon,
    navigation: jaNavigation,
    // ...
  },
};

// Add to supported languages
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },  // <-- Add new language
];
```

---

## 🔧 Configuration Options

### Language Detection Order

```typescript
// src/i18n/config.ts
detection: {
  order: ['localStorage', 'navigator', 'htmlTag'],
  caches: ['localStorage'],
  lookupLocalStorage: 'aiborg-language',
}
```

The app will:
1. Check `localStorage` for saved preference
2. Check browser language (`navigator.language`)
3. Check HTML `lang` attribute
4. Fall back to English (`fallbackLng: 'en'`)

### Namespaces

```typescript
// Default namespace
defaultNS: 'common',

// Available namespaces
ns: ['common', 'navigation', 'assessment', 'courses', 'auth'],
```

---

## 🎯 Best Practices

### 1. **Use Semantic Keys**
```tsx
// ✅ Good
t('actions.save')
t('status.success')

// ❌ Avoid
t('btn1')
t('msg')
```

### 2. **Keep Translations Flat (when possible)**
```json
// ✅ Good
{
  "save": "Save",
  "cancel": "Cancel"
}

// ⚠️ Too nested
{
  "buttons": {
    "primary": {
      "actions": {
        "save": "Save"
      }
    }
  }
}
```

### 3. **Use Namespaces for Organization**
```tsx
// ✅ Good - organized by feature
useTranslation('navigation')
useTranslation('auth')

// ❌ Avoid - everything in common
useTranslation() // then t('navigation.menu.home')
```

### 4. **Consistent Variable Names**
```json
// ✅ Good - consistent naming
"items": "{{count}} items",
"users": "{{count}} users"

// ❌ Avoid - inconsistent
"items": "{{number}} items",
"users": "{{total}} users"
```

### 5. **Provide Context in Comments**
```json
{
  "_comment": "Button labels for form actions",
  "save": "Save",
  "cancel": "Cancel",
  "_comment2": "Status messages shown to users",
  "success": "Operation completed successfully"
}
```

---

## 🐛 Troubleshooting

### Translation Not Showing

1. **Check if namespace is loaded:**
```tsx
const { t, ready } = useTranslation('navigation');

if (!ready) return <div>Loading...</div>;
```

2. **Check the key exists:**
```tsx
// Use fallback
t('missing.key', 'Fallback text')
```

3. **Check current language:**
```tsx
const { i18n } = useTranslation();
console.log('Current language:', i18n.language);
console.log('Available languages:', Object.keys(i18n.store.data));
```

### Language Not Changing

1. **Check localStorage:**
```javascript
localStorage.getItem('aiborg-language') // Should show current lang
```

2. **Force language change:**
```tsx
await i18n.changeLanguage('es');
window.location.reload(); // Force reload if needed
```

### Missing Translations

1. **Enable debug mode:**
```typescript
// src/i18n/config.ts
i18n.init({
  debug: true,  // Shows missing translations in console
});
```

2. **Check console for warnings:**
```
i18next: key "some.missing.key" not found in namespace "common"
```

---

## 📊 Translation Coverage

| Namespace | English | Spanish | French | German |
|-----------|---------|---------|--------|--------|
| common | 100% | 100% | 0% | 0% |
| navigation | 100% | 100% | 0% | 0% |
| assessment | 100% | 100% | 0% | 0% |
| courses | 100% | 100% | 0% | 0% |
| auth | 100% | 100% | 0% | 0% |

---

## 🚀 Next Steps

### Phase 2: Complete French & German Translations
1. Translate all JSON files for `fr` and `de`
2. Test language switching
3. Verify translations in context

### Phase 3: Add More Languages
- Japanese (`ja`)
- Chinese (`zh`)
- Portuguese (`pt`)
- Arabic (`ar`)

### Phase 4: Advanced Features
- [ ] Pluralization rules
- [ ] Date/time formatting per locale
- [ ] Number formatting per locale
- [ ] RTL (Right-to-Left) support for Arabic
- [ ] Translation management platform integration

---

## 📚 Resources

- **i18next Documentation**: https://www.i18next.com/
- **react-i18next**: https://react.i18next.com/
- **Language Codes**: https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes
- **Unicode CLDR**: http://cldr.unicode.org/

---

**Setup Complete!** 🎉
Your app now supports multiple languages with easy-to-use translation hooks and a beautiful language switcher component.

**Example Component**: See `src/components/examples/TranslationExample.tsx` for usage examples.
