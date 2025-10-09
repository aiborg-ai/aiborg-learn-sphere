import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  UserCheck,
  Calendar,
  DollarSign,
  UserPlus,
  Download,
  Filter,
  TrendingUp,
  Users,
  Upload,
} from 'lucide-react';
import { ManualEnrollmentForm } from './ManualEnrollmentForm';
import { BulkEnrollmentDialog } from './BulkEnrollmentDialog';

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: number;
  enrolled_at: string;
  payment_status: string;
  payment_amount: number | null;
  created_at: string;
  updated_at: string;
  profiles: {
    display_name: string | null;
    email: string | null;
  } | null;
  courses: {
    title: string;
    start_date: string;
    price: string;
  } | null;
}

interface EnrollmentManagementEnhancedProps {
  enrollments: Enrollment[];
  onRefresh: () => void;
}

export function EnrollmentManagementEnhanced({
  enrollments,
  onRefresh,
}: EnrollmentManagementEnhancedProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showManualEnrollment, setShowManualEnrollment] = useState(false);
  const [showBulkEnrollment, setShowBulkEnrollment] = useState(false);

  const filteredEnrollments = enrollments.filter(enrollment => {
    const matchesSearch =
      enrollment.profiles?.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enrollment.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enrollment.courses?.title.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || enrollment.payment_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getPaymentStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      completed: 'default',
      paid: 'default',
      pending: 'secondary',
      failed: 'destructive',
      refunded: 'outline',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  const getEnrollmentStats = () => {
    const total = enrollments.length;
    const completed = enrollments.filter(
      e => e.payment_status === 'completed' || e.payment_status === 'paid'
    ).length;
    const pending = enrollments.filter(e => e.payment_status === 'pending').length;
    const totalRevenue = enrollments
      .filter(e => e.payment_status === 'completed' || e.payment_status === 'paid')
      .reduce((sum, e) => sum + (e.payment_amount || 0), 0);
    const uniqueStudents = new Set(enrollments.map(e => e.user_id)).size;

    return { total, completed, pending, totalRevenue, uniqueStudents };
  };

  const stats = getEnrollmentStats();

  const exportToCSV = () => {
    const headers = [
      'Student Name',
      'Email',
      'Course',
      'Enrolled Date',
      'Payment Status',
      'Amount',
    ];
    const rows = filteredEnrollments.map(e => [
      e.profiles?.display_name || 'N/A',
      e.profiles?.email || 'N/A',
      e.courses?.title || 'N/A',
      new Date(e.enrolled_at).toLocaleDateString(),
      e.payment_status,
      e.payment_amount ? `₹${e.payment_amount}` : e.courses?.price || 'N/A',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `enrollments_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <>
      <Card className="bg-white/95 backdrop-blur">
        <CardHeader>
          <CardTitle>Enrollment Management</CardTitle>
          <CardDescription>Comprehensive enrollment oversight and management</CardDescription>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Students</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.uniqueStudents}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Actions */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search enrollments..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={() => setShowManualEnrollment(true)} className="w-full sm:w-auto">
              <UserPlus className="h-4 w-4 mr-2" />
              Manual Enrollment
            </Button>

            <Button
              onClick={() => setShowBulkEnrollment(true)}
              variant="secondary"
              className="w-full sm:w-auto"
            >
              <Upload className="h-4 w-4 mr-2" />
              Bulk Upload
            </Button>

            <Button variant="outline" onClick={exportToCSV} className="w-full sm:w-auto">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4" />
                      Student
                    </div>
                  </TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Enrolled Date
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Payment
                    </div>
                  </TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEnrollments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No enrollments found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEnrollments.map(enrollment => (
                    <TableRow key={enrollment.id}>
                      <TableCell className="font-medium">
                        {enrollment.profiles?.display_name || 'N/A'}
                      </TableCell>
                      <TableCell>{enrollment.profiles?.email || 'N/A'}</TableCell>
                      <TableCell>{enrollment.courses?.title || 'N/A'}</TableCell>
                      <TableCell>{new Date(enrollment.enrolled_at).toLocaleDateString()}</TableCell>
                      <TableCell>{getPaymentStatusBadge(enrollment.payment_status)}</TableCell>
                      <TableCell>
                        {enrollment.payment_amount
                          ? `₹${enrollment.payment_amount.toLocaleString()}`
                          : enrollment.courses?.price || 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row justify-between gap-4 text-sm text-muted-foreground">
            <div className="space-y-1">
              <p>Total Enrollments: {enrollments.length}</p>
              <p>Showing: {filteredEnrollments.length}</p>
            </div>
            <div className="space-y-1 sm:text-right">
              <p className="text-lg font-semibold text-green-600">
                Total Revenue: ₹{stats.totalRevenue.toLocaleString()}
              </p>
              <p>Unique Students: {stats.uniqueStudents}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manual Enrollment Dialog */}
      <ManualEnrollmentForm
        open={showManualEnrollment}
        onOpenChange={setShowManualEnrollment}
        onSuccess={onRefresh}
      />

      {/* Bulk Enrollment Dialog */}
      <BulkEnrollmentDialog
        open={showBulkEnrollment}
        onOpenChange={setShowBulkEnrollment}
        onSuccess={onRefresh}
      />
    </>
  );
}
