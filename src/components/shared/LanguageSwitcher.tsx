/**
 * Language Switcher Component
 * Allows users to change the application language
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Globe, Check } from '@/components/ui/icons';
import { SUPPORTED_LANGUAGES } from '@/i18n/config';
import { logger } from '@/utils/logger';

interface LanguageSwitcherProps {
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
}

export function LanguageSwitcher({
  variant = 'ghost',
  size = 'default',
  showLabel = true,
}: LanguageSwitcherProps) {
  const { i18n } = useTranslation();
  const [isChanging, setIsChanging] = useState(false);

  const currentLanguage =
    SUPPORTED_LANGUAGES.find(lang => lang.code === i18n.language) || SUPPORTED_LANGUAGES[0];

  const changeLanguage = async (languageCode: string) => {
    if (languageCode === i18n.language) return;

    try {
      setIsChanging(true);
      await i18n.changeLanguage(languageCode);
      logger.info(`Language changed to: ${languageCode}`);

      // Optionally reload the page to ensure all content is updated
      // window.location.reload();
    } catch (_error) {
      logger.error('Error changing language:', _error);
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={isChanging}
          aria-label="Change language"
          className="gap-2"
        >
          <Globe className="h-4 w-4" aria-hidden="true" />
          {showLabel && (
            <span className="flex items-center gap-1">
              <span className="hidden sm:inline">{currentLanguage.flag}</span>
              <span className="hidden md:inline">{currentLanguage.name}</span>
              <span className="md:hidden">{currentLanguage.code.toUpperCase()}</span>
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Select Language</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {SUPPORTED_LANGUAGES.map(language => {
          const isActive = language.code === i18n.language;

          return (
            <DropdownMenuItem
              key={language.code}
              onClick={() => changeLanguage(language.code)}
              className="cursor-pointer flex items-center justify-between"
              disabled={isChanging}
            >
              <span className="flex items-center gap-2">
                <span className="text-xl" aria-hidden="true">
                  {language.flag}
                </span>
                <span>{language.name}</span>
              </span>

              {isActive && <Check className="h-4 w-4 text-primary" aria-label="Current language" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Compact Language Switcher
 * Shows only flags without dropdown - cycles through languages on click
 */
export function CompactLanguageSwitcher() {
  const { i18n } = useTranslation();

  const cycleLanguage = () => {
    const currentIndex = SUPPORTED_LANGUAGES.findIndex(lang => lang.code === i18n.language);
    const nextIndex = (currentIndex + 1) % SUPPORTED_LANGUAGES.length;
    const nextLanguage = SUPPORTED_LANGUAGES[nextIndex];

    i18n.changeLanguage(nextLanguage.code);
  };

  const currentLanguage =
    SUPPORTED_LANGUAGES.find(lang => lang.code === i18n.language) || SUPPORTED_LANGUAGES[0];

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycleLanguage}
      aria-label={`Current language: ${currentLanguage.name}. Click to change language.`}
      title={`Change language (Current: ${currentLanguage.name})`}
    >
      <span className="text-xl" aria-hidden="true">
        {currentLanguage.flag}
      </span>
    </Button>
  );
}
