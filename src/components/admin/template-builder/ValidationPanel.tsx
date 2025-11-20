import React from 'react';
import { Info } from '@/components/ui/icons';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function ValidationPanel() {
  return (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertTitle>Template Builder Tips</AlertTitle>
      <AlertDescription>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li>Fill in all required fields marked with a red asterisk (*)</li>
          <li>For array fields, press Enter or click the + button to add items</li>
          <li>Use the Preview JSON button to see the template structure</li>
          <li>Export your template as JSON for importing later</li>
          <li>Templates are validated against the schema before saving</li>
        </ul>
      </AlertDescription>
    </Alert>
  );
}
