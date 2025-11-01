import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Trophy, Award, Flame, FileText, Bell } from 'lucide-react';

export interface DashboardStatsData {
  enrolledCourses: number;
  totalAchievements: number;
  certificatesEarned: number;
  currentStreak: number;
  pendingAssignments: number;
  unreadNotifications: number;
}

interface DashboardStatsProps {
  stats: DashboardStatsData;
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const statCards = [
    {
      title: 'Enrolled Courses',
      value: stats.enrolledCourses,
      icon: BookOpen,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Achievements',
      value: stats.totalAchievements,
      icon: Trophy,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'Certificates',
      value: stats.certificatesEarned,
      icon: Award,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Current Streak',
      value: `${stats.currentStreak} days`,
      icon: Flame,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Pending Tasks',
      value: stats.pendingAssignments,
      icon: FileText,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Notifications',
      value: stats.unreadNotifications,
      icon: Bell,
      color: 'text-red-500',
      bgColor: 'bg-red-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statCards.map((stat, index) => (
        <Card key={index} className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
