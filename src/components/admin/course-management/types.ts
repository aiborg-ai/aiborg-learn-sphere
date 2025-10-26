export interface Course {
  id?: number;
  title: string;
  description: string;
  image_url?: string; // Course thumbnail/banner image
  audience: string; // Kept for backward compatibility
  audiences: string[]; // Multi-audience support
  mode: string; // online, in-person, hybrid
  duration: string; // "8 weeks", "40 hours", etc.
  price: string; // Can include currency symbols
  level: string; // beginner, intermediate, advanced
  start_date: string;
  features: string[]; // Array of course features/highlights
  category: string;
  keywords: string[]; // For SEO and search
  prerequisites: string; // Course requirements
  is_active: boolean;
  currently_enrolling: boolean;
  sort_order: number;
  display: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CourseManagementProps {
  courses: Course[];
  setCourses: React.Dispatch<React.SetStateAction<Course[]>>;
  onRefresh: () => void;
}
