export interface Event {
  id?: string;
  title: string;
  description: string;
  event_date: string;
  event_time?: string;
  location: string;
  max_capacity: number;
  registration_count?: number;
  is_visible: boolean;
  is_active: boolean;
  is_past: boolean;
  event_type: string;
  created_at?: string;
  updated_at?: string;
}

export type EventTypeColors = Record<string, string>;
