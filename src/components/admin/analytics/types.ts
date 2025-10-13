export interface PlatformMetrics {
  totalUsers: number;
  totalStudents: number;
  totalInstructors: number;
  totalAdmins: number;
  totalRevenue: number;
  activeUsersMonth: number;
  activeUsersToday: number;
  totalEnrollments: number;
  totalCourses: number;
}

export interface UserGrowthData {
  date: string;
  newUsers: number;
  activeUsers: number;
}

export interface CourseAnalytics {
  courseTitle: string;
  enrollments: number;
  completions: number;
  completionRate: number;
  averageRating: number;
  revenue: number;
}

export interface RevenueMetrics {
  total: number;
  transactions: number;
  successfulTransactions: number;
  averageTransactionValue: number;
  revenueByDay: Array<{
    date: string;
    amount: number;
  }>;
  revenueByCourse: Array<{
    courseTitle: string;
    amount: number;
  }>;
}

export interface EngagementMetrics {
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  averageSessionDuration: number;
  contentCompletionRate: number;
  assessmentTakeRate: number;
  averageCoursesPerUser: number;
}

export interface AssessmentAnalytics {
  totalAssessments: number;
  completedAssessments: number;
  completionRate: number;
  averageScore: number;
  averageTimeMinutes: number;
  performanceTrend: Array<{
    date: string;
    averageScore: number;
  }>;
  assessmentsByType: Array<{
    type: string;
    count: number;
  }>;
}
