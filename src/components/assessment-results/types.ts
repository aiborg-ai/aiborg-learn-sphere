// Assessment result types

export interface AssessmentResult {
  id: string;
  total_score: number;
  max_possible_score: number;
  augmentation_level: string;
  completion_time_seconds: number;
  completed_at: string;
  audience_type?: string;
}

export interface CategoryInsight {
  category_name: string;
  category_score: number;
  category_max_score: number;
  strength_level: string;
  recommendations: string[];
  percentage: number;
}

export interface Benchmark {
  category_name: string;
  user_score: number;
  average_score: number;
  percentile: number;
}

export interface Achievement {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  criteria_type: string;
  criteria_value: number;
}

export interface Tool {
  name: string;
  description: string;
  website_url?: string;
  difficulty_level: string;
}

export interface RadarChartData {
  category: string;
  score: number;
  fullMark: number;
}
