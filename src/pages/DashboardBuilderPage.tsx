/**
 * Dashboard Builder Page
 *
 * Page component for the custom dashboard builder
 */

import { DashboardBuilder } from '@/components/dashboard-builder/DashboardBuilder';
import { useEffect } from 'react';

export default function DashboardBuilderPage() {
  // Set page title
  useEffect(() => {
    document.title = 'Dashboard Builder | AiBorg Learn Sphere';
  }, []);

  return <DashboardBuilder />;
}
