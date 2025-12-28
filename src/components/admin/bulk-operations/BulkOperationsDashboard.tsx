import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  BookOpen,
  Mail,
  Trash2,
  Download,
  Upload,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Search,
  UserPlus,
  UserMinus,
  Shield,
  Tag,
} from '@/components/ui/icons';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

type OperationType = 'user' | 'course' | 'enrollment';
type BulkAction = 'delete' | 'export' | 'email' | 'enroll' | 'unenroll' | 'update_role' | 'add_tag';

interface BulkOperation {
  id: string;
  type: OperationType;
  action: BulkAction;
  itemCount: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  completedCount: number;
  failedCount: number;
  startedAt?: string;
  completedAt?: string;
  createdBy: string;
}

interface SelectableItem {
  id: string;
  name: string;
  email?: string;
  type: string;
  selected: boolean;
}

const OperationCard = ({
  title,
  description,
  icon: Icon,
  color,
  actions,
  onAction,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  actions: { label: string; action: BulkAction; icon: React.ElementType }[];
  onAction: (action: BulkAction) => void;
}) => (
  <Card>
    <CardHeader>
      <div className="flex items-center gap-3">
        <div className={cn('p-2 rounded-lg', color)}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div className="flex flex-wrap gap-2">
        {actions.map(({ label, action, icon: ActionIcon }) => (
          <Button key={action} variant="outline" size="sm" onClick={() => onAction(action)}>
            <ActionIcon className="h-4 w-4 mr-2" />
            {label}
          </Button>
        ))}
      </div>
    </CardContent>
  </Card>
);

export function BulkOperationsDashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('operations');
  const [operationType, setOperationType] = useState<OperationType | null>(null);
  const [selectedAction, setSelectedAction] = useState<BulkAction | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [search, setSearch] = useState('');

  // Sample data for selection
  const [users] = useState<SelectableItem[]>([
    { id: 'u1', name: 'John Smith', email: 'john@example.com', type: 'user', selected: false },
    { id: 'u2', name: 'Sarah Johnson', email: 'sarah@example.com', type: 'user', selected: false },
    {
      id: 'u3',
      name: 'Michael Brown',
      email: 'michael@example.com',
      type: 'user',
      selected: false,
    },
    { id: 'u4', name: 'Emily Davis', email: 'emily@example.com', type: 'user', selected: false },
    { id: 'u5', name: 'David Wilson', email: 'david@example.com', type: 'user', selected: false },
  ]);

  const [courses] = useState<SelectableItem[]>([
    { id: 'c1', name: 'AI Fundamentals', type: 'course', selected: false },
    { id: 'c2', name: 'Machine Learning 101', type: 'course', selected: false },
    { id: 'c3', name: 'Data Science Basics', type: 'course', selected: false },
    { id: 'c4', name: 'Deep Learning', type: 'course', selected: false },
  ]);

  const [selectedItems, setSelectedItems] = useState<SelectableItem[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Recent operations history
  const [operations] = useState<BulkOperation[]>([
    {
      id: 'op1',
      type: 'user',
      action: 'email',
      itemCount: 150,
      status: 'completed',
      progress: 100,
      completedCount: 148,
      failedCount: 2,
      startedAt: new Date(Date.now() - 3600000).toISOString(),
      completedAt: new Date(Date.now() - 3000000).toISOString(),
      createdBy: 'Admin',
    },
    {
      id: 'op2',
      type: 'enrollment',
      action: 'enroll',
      itemCount: 45,
      status: 'completed',
      progress: 100,
      completedCount: 45,
      failedCount: 0,
      startedAt: new Date(Date.now() - 86400000).toISOString(),
      completedAt: new Date(Date.now() - 86000000).toISOString(),
      createdBy: 'Admin',
    },
    {
      id: 'op3',
      type: 'user',
      action: 'export',
      itemCount: 500,
      status: 'completed',
      progress: 100,
      completedCount: 500,
      failedCount: 0,
      startedAt: new Date(Date.now() - 172800000).toISOString(),
      completedAt: new Date(Date.now() - 172700000).toISOString(),
      createdBy: 'Admin',
    },
  ]);

  // Action configuration
  const actionConfig: Record<
    BulkAction,
    { label: string; icon: React.ElementType; destructive?: boolean }
  > = {
    delete: { label: 'Delete', icon: Trash2, destructive: true },
    export: { label: 'Export', icon: Download },
    email: { label: 'Send Email', icon: Mail },
    enroll: { label: 'Enroll', icon: UserPlus },
    unenroll: { label: 'Unenroll', icon: UserMinus },
    update_role: { label: 'Update Role', icon: Shield },
    add_tag: { label: 'Add Tag', icon: Tag },
  };

  const handleOpenOperation = (type: OperationType, action: BulkAction) => {
    setOperationType(type);
    setSelectedAction(action);
    setSelectedItems([]);
    setSelectAll(false);
    setDialogOpen(true);
  };

  const getItems = () => {
    if (operationType === 'user') return users;
    if (operationType === 'course') return courses;
    return [];
  };

  const handleSelectItem = (itemId: string) => {
    const items = getItems();
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    if (selectedItems.find(i => i.id === itemId)) {
      setSelectedItems(prev => prev.filter(i => i.id !== itemId));
    } else {
      setSelectedItems(prev => [...prev, { ...item, selected: true }]);
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedItems([]);
    } else {
      setSelectedItems(getItems().map(i => ({ ...i, selected: true })));
    }
    setSelectAll(!selectAll);
  };

  const handleExecuteOperation = async () => {
    if (selectedItems.length === 0) {
      toast({
        title: 'No Items Selected',
        description: 'Please select at least one item.',
        variant: 'destructive',
      });
      return;
    }

    setConfirmDialogOpen(false);
    setDialogOpen(false);
    setRunning(true);
    setProgress(0);

    // Simulate bulk operation
    const total = selectedItems.length;
    for (let i = 0; i < total; i++) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setProgress(Math.round(((i + 1) / total) * 100));
    }

    setRunning(false);
    toast({
      title: 'Operation Complete',
      description: `Successfully processed ${total} items.`,
    });
  };

  const filteredItems = getItems().filter(
    item =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-orange-100">
            <Users className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Bulk Operations</h2>
            <p className="text-sm text-muted-foreground">
              Perform actions on multiple items at once
            </p>
          </div>
        </div>
      </div>

      {/* Progress indicator when running */}
      {running && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <div className="flex-1">
                <p className="font-medium text-blue-800">Operation in progress...</p>
                <Progress value={progress} className="h-2 mt-2" />
              </div>
              <span className="text-blue-700 font-medium">{progress}%</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="operations">Quick Actions</TabsTrigger>
          <TabsTrigger value="history">Operation History</TabsTrigger>
        </TabsList>

        <TabsContent value="operations" className="space-y-6 mt-6">
          {/* Operation Cards */}
          <div className="grid md:grid-cols-3 gap-4">
            <OperationCard
              title="User Operations"
              description="Manage users in bulk"
              icon={Users}
              color="bg-blue-100 text-blue-600"
              actions={[
                { label: 'Send Email', action: 'email', icon: Mail },
                { label: 'Update Role', action: 'update_role', icon: Shield },
                { label: 'Export', action: 'export', icon: Download },
                { label: 'Delete', action: 'delete', icon: Trash2 },
              ]}
              onAction={action => handleOpenOperation('user', action)}
            />

            <OperationCard
              title="Course Operations"
              description="Manage courses in bulk"
              icon={BookOpen}
              color="bg-green-100 text-green-600"
              actions={[
                { label: 'Add Tag', action: 'add_tag', icon: Tag },
                { label: 'Export', action: 'export', icon: Download },
                { label: 'Delete', action: 'delete', icon: Trash2 },
              ]}
              onAction={action => handleOpenOperation('course', action)}
            />

            <OperationCard
              title="Enrollment Operations"
              description="Manage enrollments in bulk"
              icon={UserPlus}
              color="bg-purple-100 text-purple-600"
              actions={[
                { label: 'Bulk Enroll', action: 'enroll', icon: UserPlus },
                { label: 'Bulk Unenroll', action: 'unenroll', icon: UserMinus },
                { label: 'Export', action: 'export', icon: Download },
              ]}
              onAction={action => handleOpenOperation('enrollment', action)}
            />
          </div>

          {/* Import/Export Section */}
          <Card>
            <CardHeader>
              <CardTitle>Data Import/Export</CardTitle>
              <CardDescription>Import or export data in bulk using CSV files</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <Upload className="h-5 w-5 text-blue-600" />
                    <h4 className="font-medium">Import Data</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Upload a CSV file to import users, courses, or enrollments
                  </p>
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Choose File
                  </Button>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <Download className="h-5 w-5 text-green-600" />
                    <h4 className="font-medium">Export Data</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Export your data to CSV for backup or analysis
                  </p>
                  <Select>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select data type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="users">All Users</SelectItem>
                      <SelectItem value="courses">All Courses</SelectItem>
                      <SelectItem value="enrollments">All Enrollments</SelectItem>
                      <SelectItem value="payments">Payment History</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Operations</CardTitle>
              <CardDescription>History of bulk operations performed</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Operation</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Results</TableHead>
                    <TableHead>Started</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {operations.map(op => (
                    <TableRow key={op.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {actionConfig[op.action] && (
                            <>
                              {(() => {
                                const Icon = actionConfig[op.action].icon;
                                return <Icon className="h-4 w-4 text-muted-foreground" />;
                              })()}
                              <span className="capitalize">{actionConfig[op.action].label}</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {op.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{op.itemCount}</TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            op.status === 'completed' && 'bg-green-100 text-green-700',
                            op.status === 'running' && 'bg-blue-100 text-blue-700',
                            op.status === 'failed' && 'bg-red-100 text-red-700',
                            op.status === 'pending' && 'bg-slate-100 text-slate-700'
                          )}
                        >
                          {op.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span>{op.completedCount}</span>
                          {op.failedCount > 0 && (
                            <>
                              <XCircle className="h-4 w-4 text-red-600 ml-2" />
                              <span>{op.failedCount}</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {op.startedAt && new Date(op.startedAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Selection Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedAction && actionConfig[selectedAction]?.label} - Select Items
            </DialogTitle>
            <DialogDescription>Select the {operationType}s you want to process</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex items-center gap-2 py-2 border-b">
              <Checkbox
                id="select-all"
                checked={selectAll}
                onCheckedChange={() => handleSelectAll()}
              />
              <Label htmlFor="select-all">Select All ({filteredItems.length})</Label>
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {filteredItems.map(item => (
                <div
                  key={item.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                    selectedItems.find(i => i.id === item.id)
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-slate-50'
                  )}
                  onClick={() => handleSelectItem(item.id)}
                >
                  <Checkbox
                    checked={!!selectedItems.find(i => i.id === item.id)}
                    onCheckedChange={() => handleSelectItem(item.id)}
                  />
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    {item.email && <p className="text-sm text-muted-foreground">{item.email}</p>}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-sm text-muted-foreground">{selectedItems.length} items selected</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => setConfirmDialogOpen(true)}
                  disabled={selectedItems.length === 0}
                  variant={selectedAction === 'delete' ? 'destructive' : 'default'}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Continue
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Operation</DialogTitle>
            <DialogDescription>
              Are you sure you want to proceed with this operation?
            </DialogDescription>
          </DialogHeader>

          {selectedAction === 'delete' && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This action cannot be undone. {selectedItems.length} items will be permanently
                deleted.
              </AlertDescription>
            </Alert>
          )}

          <div className="py-4">
            <p className="text-sm">
              <strong>Operation:</strong> {selectedAction && actionConfig[selectedAction]?.label}
            </p>
            <p className="text-sm">
              <strong>Items:</strong> {selectedItems.length} {operationType}(s)
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleExecuteOperation}
              variant={selectedAction === 'delete' ? 'destructive' : 'default'}
            >
              Confirm & Execute
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
