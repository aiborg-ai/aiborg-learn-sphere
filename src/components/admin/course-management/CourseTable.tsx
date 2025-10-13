import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { Course } from './types';

interface CourseTableProps {
  courses: Course[];
  onEdit: (course: Course) => void;
  onDelete: (course: Course) => void;
  onToggleStatus: (course: Course, field: 'is_active' | 'display') => void;
}

export function CourseTable({ courses, onEdit, onDelete, onToggleStatus }: CourseTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Audiences</TableHead>
            <TableHead>Mode</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Level</TableHead>
            <TableHead>Order</TableHead>
            <TableHead>Enrolling</TableHead>
            <TableHead>Active</TableHead>
            <TableHead>Visible</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {courses.length === 0 ? (
            <TableRow>
              <TableCell colSpan={11} className="text-center text-muted-foreground">
                No courses found. Create your first course to get started.
              </TableCell>
            </TableRow>
          ) : (
            courses.map(course => (
              <TableRow key={course.id}>
                <TableCell className="font-medium max-w-[200px]">
                  <div className="truncate" title={course.title}>
                    {course.title}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {course.audiences?.slice(0, 2).map((aud, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {aud}
                      </Badge>
                    ))}
                    {course.audiences && course.audiences.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{course.audiences.length - 2}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      course.mode === 'Online'
                        ? 'default'
                        : course.mode === 'Hybrid'
                          ? 'secondary'
                          : 'outline'
                    }
                  >
                    {course.mode}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">{course.duration}</span>
                </TableCell>
                <TableCell className="font-medium">{course.price}</TableCell>
                <TableCell>
                  <Badge variant="outline">{course.level}</Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{course.sort_order}</span>
                </TableCell>
                <TableCell>
                  <Badge variant={course.currently_enrolling ? 'default' : 'secondary'}>
                    {course.currently_enrolling ? 'Yes' : 'No'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={course.is_active}
                    onCheckedChange={() => onToggleStatus(course, 'is_active')}
                  />
                </TableCell>
                <TableCell>
                  <Switch
                    checked={course.display}
                    onCheckedChange={() => onToggleStatus(course, 'display')}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => onEdit(course)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => onDelete(course)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
