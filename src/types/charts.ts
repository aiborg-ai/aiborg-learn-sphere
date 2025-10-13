/**
 * Chart component type definitions (Recharts)
 */

export interface TooltipPayloadEntry {
  name: string;
  value: number | string;
  dataKey: string;
  color?: string;
  payload?: Record<string, unknown>;
  unit?: string;
}

export interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}

export interface ToastProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
  [key: string]: unknown;
}

// Type for NetworkInformation API (experimental)
export interface NetworkConnection {
  effectiveType?: '4g' | '3g' | '2g' | 'slow-2g';
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}
