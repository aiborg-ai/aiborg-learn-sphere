import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, UserCheck, Calendar, DollarSign } from 'lucide-react';

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

interface EnrollmentManagementProps {
  enrollments: Enrollment[];
}

export function EnrollmentManagement({ enrollments }: EnrollmentManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEnrollments = enrollments.filter(enrollment =>
    enrollment.profiles?.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    enrollment.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    enrollment.courses?.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPaymentStatusBadge = (status: string) => {
    const variants: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
      paid: "success",
      pending: "warning",
      failed: "destructive",
      refunded: "secondary"
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  return (
    <Card className="bg-white/95 backdrop-blur">
      <CardHeader>
        <CardTitle>Course Enrollments</CardTitle>
        <CardDescription>Track student enrollments and payment status</CardDescription>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search enrollments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
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
              {filteredEnrollments.map((enrollment) => (
                <TableRow key={enrollment.id}>
                  <TableCell className="font-medium">
                    {enrollment.profiles?.display_name || 'N/A'}
                  </TableCell>
                  <TableCell>{enrollment.profiles?.email || 'N/A'}</TableCell>
                  <TableCell>{enrollment.courses?.title || 'N/A'}</TableCell>
                  <TableCell>
                    {new Date(enrollment.enrolled_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {getPaymentStatusBadge(enrollment.payment_status)}
                  </TableCell>
                  <TableCell>
                    {enrollment.payment_amount
                      ? `₹${enrollment.payment_amount.toLocaleString()}`
                      : enrollment.courses?.price || 'N/A'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 flex justify-between text-sm text-muted-foreground">
          <p>Total Enrollments: {enrollments.length}</p>
          <p>
            Total Revenue: ₹
            {enrollments
              .filter(e => e.payment_status === 'paid')
              .reduce((sum, e) => sum + (e.payment_amount || 0), 0)
              .toLocaleString()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}