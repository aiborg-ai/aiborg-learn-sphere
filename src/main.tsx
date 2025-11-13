// Import React first to ensure it's available for all dependencies
import React from 'react';
import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

// Initialize i18n
import './i18n/config';

// Register service worker for PWA
import { registerSW } from 'virtual:pwa-register';
import { logger } from './utils/logger';

// Register service worker with auto-update
const updateSW = registerSW({
  onNeedRefresh() {
    // Show update notification
    if (confirm('New content available. Reload to update?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    logger.info('App ready to work offline');
  },
  immediate: true,
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
