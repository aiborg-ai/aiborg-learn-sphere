/**
 * i18next Configuration
 * Internationalization setup for the application
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enCommon from '@/locales/en/common.json';
import enNavigation from '@/locales/en/navigation.json';
import enAssessment from '@/locales/en/assessment.json';
import enCourses from '@/locales/en/courses.json';
import enAuth from '@/locales/en/auth.json';

import esCommon from '@/locales/es/common.json';
import esNavigation from '@/locales/es/navigation.json';
import esAssessment from '@/locales/es/assessment.json';
import esCourses from '@/locales/es/courses.json';
import esAuth from '@/locales/es/auth.json';

import frCommon from '@/locales/fr/common.json';
import frNavigation from '@/locales/fr/navigation.json';
import frAssessment from '@/locales/fr/assessment.json';
import frCourses from '@/locales/fr/courses.json';
import frAuth from '@/locales/fr/auth.json';

import deCommon from '@/locales/de/common.json';
import deNavigation from '@/locales/de/navigation.json';
import deAssessment from '@/locales/de/assessment.json';
import deCourses from '@/locales/de/courses.json';
import deAuth from '@/locales/de/auth.json';

// Translation resources
const resources = {
  en: {
    common: enCommon,
    navigation: enNavigation,
    assessment: enAssessment,
    courses: esCourses,
    auth: enAuth,
  },
  es: {
    common: esCommon,
    navigation: esNavigation,
    assessment: esAssessment,
    courses: esCourses,
    auth: esAuth,
  },
  fr: {
    common: frCommon,
    navigation: frNavigation,
    assessment: frAssessment,
    courses: frCourses,
    auth: frAuth,
  },
  de: {
    common: deCommon,
    navigation: deNavigation,
    assessment: deAssessment,
    courses: deCourses,
    auth: deAuth,
  },
};

// Supported languages
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
];

// Initialize i18next
i18n
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass i18n down to react-i18next
  .init({
    resources,
    fallbackLng: 'en', // Fallback language if translation is missing
    defaultNS: 'common', // Default namespace
    ns: ['common', 'navigation', 'assessment', 'courses', 'auth'], // Available namespaces

    // Language detection options
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'aiborg-language',
    },

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    // Development settings
    debug: import.meta.env.DEV,

    // React-specific options
    react: {
      useSuspense: true,
    },
  });

export default i18n;
