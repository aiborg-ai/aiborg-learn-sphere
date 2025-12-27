/**
 * SME Admin Dashboard
 *
 * Consolidated dashboard for SME-specific features:
 * - Bulk User Enrollment
 * - Team Analytics
 * - Certificate Management
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, BarChart3, Award, Upload, Download, TrendingUp, FileText } from 'lucide-react';
import { BulkEnrollmentDialog } from '@/components/admin/BulkEnrollmentDialog';
import { EnhancedTeamAnalytics } from '@/pages/admin/EnhancedTeamAnalytics';
import { CertificateManagement } from '@/components/admin/CertificateManagement';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';

export function SMEAdminDashboard() {
  const { user } = useAuth();
  const [bulkEnrollmentOpen, setBulkEnrollmentOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Get organization ID from user metadata (adjust based on your schema)
  const organizationId = user?.user_metadata?.organization_id || 'default';

  const handleEnrollmentSuccess = () => {
    // Refresh data or show success message
  };

  const quickStats = [
    {
      title: 'Total Enrollments',
      value: '156',
      change: '+12%',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Active Learners',
      value: '143',
      change: '+8%',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Certificates Issued',
      value: '87',
      change: '+23%',
      icon: Award,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Completion Rate',
      value: '68%',
      change: '+5%',
      icon: BarChart3,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              SME Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage enrollments, track team progress, and issue certificates
            </p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            Organization: {organizationId}
          </Badge>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto">
            <TabsTrigger value="overview">
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="enrollment">
              <Users className="h-4 w-4 mr-2" />
              Enrollment
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <TrendingUp className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="certificates">
              <Award className="h-4 w-4 mr-2" />
              Certificates
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {quickStats.map((stat, index) => (
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
                    <div className="text-3xl font-bold">{stat.value}</div>
                    <p className="text-xs text-green-600 mt-1">{stat.change} from last month</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-blue-50 group-hover:bg-blue-100 transition-colors">
                      <Upload className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Bulk Enrollment</CardTitle>
                      <CardDescription>Enroll multiple users at once</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => setBulkEnrollmentOpen(true)} className="w-full" size="lg">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload CSV
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-green-50 group-hover:bg-green-100 transition-colors">
                      <BarChart3 className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Team Analytics</CardTitle>
                      <CardDescription>View team performance metrics</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => setActiveTab('analytics')}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Analytics
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-purple-50 group-hover:bg-purple-100 transition-colors">
                      <Award className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Certificates</CardTitle>
                      <CardDescription>Issue and manage certificates</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => setActiveTab('certificates')}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    <Award className="h-4 w-4 mr-2" />
                    Manage
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Getting Started Guide */}
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Getting Started with SME Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-bold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Bulk Enrollment</p>
                    <p className="text-sm text-muted-foreground">
                      Download the CSV template, fill in user details, and upload to enroll multiple
                      users instantly
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-600 text-white text-sm font-bold flex-shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Monitor Progress</p>
                    <p className="text-sm text-muted-foreground">
                      Use team analytics to track learning progress, identify skills gaps, and
                      measure ROI
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-600 text-white text-sm font-bold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Issue Certificates</p>
                    <p className="text-sm text-muted-foreground">
                      Generate professional certificates with QR verification for completed courses
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Enrollment Tab */}
          <TabsContent value="enrollment" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Bulk User Enrollment</CardTitle>
                <CardDescription>
                  Enroll multiple users at once by uploading a CSV file
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Button onClick={() => setBulkEnrollmentOpen(true)} size="lg">
                    <Upload className="h-5 w-5 mr-2" />
                    Start Bulk Enrollment
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Download template logic (same as in BulkEnrollmentDialog)
                      const template =
                        'email,course_id,payment_amount,payment_status,payment_method\nuser@example.com,1,1000,completed,card';
                      const blob = new Blob([template], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'bulk_enrollment_template.csv';
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Template
                  </Button>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">CSV Format Requirements:</h4>
                  <ul className="space-y-1 text-sm">
                    <li>
                      • <strong>email:</strong> User email address (required)
                    </li>
                    <li>
                      • <strong>course_id:</strong> Course ID number (required)
                    </li>
                    <li>
                      • <strong>payment_amount:</strong> Amount in your currency (required)
                    </li>
                    <li>
                      • <strong>payment_status:</strong> completed, pending, or failed (required)
                    </li>
                    <li>
                      • <strong>payment_method:</strong> manual, card, upi, bank, or cash (required)
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <EnhancedTeamAnalytics organizationId={organizationId} />
          </TabsContent>

          {/* Certificates Tab */}
          <TabsContent value="certificates">
            <CertificateManagement organizationId={organizationId} />
          </TabsContent>
        </Tabs>

        {/* Bulk Enrollment Dialog */}
        <BulkEnrollmentDialog
          open={bulkEnrollmentOpen}
          onOpenChange={setBulkEnrollmentOpen}
          onSuccess={handleEnrollmentSuccess}
        />
      </div>
    </div>
  );
}

export default SMEAdminDashboard;
