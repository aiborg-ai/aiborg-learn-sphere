export interface Course {
  id: string;
  title: string;
  description: string;
  level: string;
  duration: string;
  mode: string;
  start_date: string;
  features?: string[];
  prerequisites?: string;
  [key: string]: unknown;
}

export interface UserProgress {
  progress_percentage: number;
  last_accessed: string;
  [key: string]: unknown;
}

export interface CourseMaterial {
  id: string;
  title: string;
  description?: string;
  material_type: string;
  file_url: string;
  file_size?: number;
  duration?: number;
  [key: string]: unknown;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date?: string;
  [key: string]: unknown;
}
