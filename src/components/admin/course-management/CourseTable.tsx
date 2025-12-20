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
import { Edit, Trash2, Copy, GripVertical, Loader2 } from '@/components/ui/icons';
import { Course } from './types';
import { SortableList, DragHandle } from '@/components/admin/shared/SortableList';

// Extended Course type with required id for sorting
interface CourseWithId extends Course {
  id: number;
}

interface CourseTableProps {
  courses: Course[];
  onEdit: (course: Course) => void;
  onDelete: (course: Course) => void;
  onDuplicate: (course: Course) => void;
  onToggleStatus: (course: Course, field: 'is_active' | 'display') => void;
  onReorder?: (courses: Course[]) => Promise<void>;
  isReordering?: boolean;
}

export function CourseTable({
  courses,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleStatus,
  onReorder,
  isReordering = false,
}: CourseTableProps) {
  // Filter courses with valid IDs for sorting
  const sortableCourses = courses.filter((c): c is CourseWithId => c.id !== undefined);
  const canReorder = onReorder && sortableCourses.length === courses.length;

  // Handle reorder with proper typing
  const handleReorder = async (reorderedCourses: CourseWithId[]) => {
    if (onReorder) {
      await onReorder(reorderedCourses);
    }
  };

  return (
    <div className="space-y-4">
      {/* Reorder hint */}
      {canReorder && courses.length > 1 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <GripVertical className="h-4 w-4" />
          <span>Drag rows to reorder courses</span>
          {isReordering && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {canReorder && <TableHead className="w-10"></TableHead>}
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
                <TableCell
                  colSpan={canReorder ? 12 : 11}
                  className="text-center text-muted-foreground"
                >
                  No courses found. Create your first course to get started.
                </TableCell>
              </TableRow>
            ) : canReorder ? (
              <SortableList
                items={sortableCourses}
                onReorder={handleReorder}
                isReordering={isReordering}
                keyExtractor={course => String(course.id)}
                renderItem={(course, index, dragHandleProps) => (
                  <TableRow>
                    <TableCell className="w-10">
                      <DragHandle dragHandleProps={dragHandleProps}>
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                      </DragHandle>
                    </TableCell>
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
                      <span className="text-sm">{index + 1}</span>
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
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onEdit(course)}
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onDuplicate(course)}
                          title="Duplicate"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => onDelete(course)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              />
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
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEdit(course)}
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDuplicate(course)}
                        title="Duplicate"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onDelete(course)}
                        title="Delete"
                      >
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
    </div>
  );
}
