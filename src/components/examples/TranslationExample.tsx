/**
 * Translation Example Component
 * Demonstrates how to use i18next translations in React components
 */

import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function TranslationExample() {
  // Get translation function and i18n instance
  const { t, i18n } = useTranslation();

  // You can also specify namespace(s) to use
  const { t: tNav } = useTranslation('navigation');
  const { t: tAuth } = useTranslation('auth');

  return (
    <Card>
      <CardHeader>
        <CardTitle>i18n Translation Examples</CardTitle>
        <CardDescription>Current language: {i18n.language}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Example 1: Simple translation */}
        <div>
          <h2 className="font-semibold mb-2">Simple Translation:</h2>
          <p>{t('actions.save', { ns: 'common' })}</p>
          <p>{t('actions.cancel', { ns: 'common' })}</p>
        </div>

        {/* Example 2: Translation with interpolation */}
        <div>
          <h2 className="font-semibold mb-2">Translation with Variables:</h2>
          <p>{t('validation.minLength', { min: 8 })}</p>
          <p>{t('courses.progress.percentage', { percent: 75 })}</p>
        </div>

        {/* Example 3: Using different namespaces */}
        <div>
          <h2 className="font-semibold mb-2">Different Namespaces:</h2>
          <p>Navigation: {tNav('menu.home')}</p>
          <p>Auth: {tAuth('signIn.title')}</p>
        </div>

        {/* Example 4: Nested translations */}
        <div>
          <h2 className="font-semibold mb-2">Nested Keys:</h2>
          <p>{t('common:app.name')}</p>
          <p>{t('common:app.tagline')}</p>
        </div>

        {/* Example 5: Fallback translation */}
        <div>
          <h2 className="font-semibold mb-2">With Fallback:</h2>
          <p>{t('nonexistent.key', 'Fallback text if key not found')}</p>
        </div>

        {/* Example 6: In button components */}
        <div>
          <h2 className="font-semibold mb-2">In Components:</h2>
          <div className="flex gap-2">
            <Button>{t('common:actions.save')}</Button>
            <Button variant="outline">{t('common:actions.cancel')}</Button>
          </div>
        </div>

        {/* Example 7: Array of translations */}
        <div>
          <h2 className="font-semibold mb-2">Status Messages:</h2>
          <ul className="list-disc list-inside">
            <li>{t('status.success')}</li>
            <li>{t('status.pending')}</li>
            <li>{t('status.completed')}</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Usage in functional components:
 *
 * import { useTranslation } from 'react-i18next';
 *
 * function MyComponent() {
 *   const { t } = useTranslation();
 *
 *   return (
 *     <div>
 *       <h1>{t('common:app.name')}</h1>
 *       <p>{t('navigation:menu.home')}</p>
 *       <Button>{t('actions.save')}</Button>
 *     </div>
 *   );
 * }
 *
 * Usage with multiple namespaces:
 *
 * const { t } = useTranslation(['common', 'navigation']);
 *
 * Usage with interpolation:
 *
 * t('validation.minLength', { min: 8 })
 * t('courses.progress.materials', { completed: 5, total: 10 })
 *
 * Changing language programmatically:
 *
 * const { i18n } = useTranslation();
 * i18n.changeLanguage('es'); // Change to Spanish
 *
 * Getting current language:
 *
 * const { i18n } = useTranslation();
 * logger.log(i18n.language); // e.g., 'en'
 */
