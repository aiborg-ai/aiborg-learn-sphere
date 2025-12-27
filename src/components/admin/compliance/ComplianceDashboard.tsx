import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Shield,
  ShieldCheck,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  XCircle,
  Upload,
  Sparkles,
  Download,
  Calendar,
  Lock,
  Eye,
} from '@/components/ui/icons';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

type ControlStatus = 'not_started' | 'in_progress' | 'passed' | 'failed' | 'not_applicable';

interface Control {
  id: string;
  controlId: string;
  title: string;
  description: string;
  category: string;
  status: ControlStatus;
  evidenceNotes?: string;
  evidenceLinks?: string[];
  reviewedBy?: string;
  reviewedAt?: string;
}

interface Certification {
  id: string;
  type: string;
  name: string;
  description: string;
  status: 'not_started' | 'in_progress' | 'certified' | 'expired';
  totalControls: number;
  completedControls: number;
  completionPercentage: number;
  certifiedAt?: string;
  expiresAt?: string;
  controls: Control[];
  icon: React.ElementType;
  color: string;
}

const StatusIcon = ({ status }: { status: ControlStatus }) => {
  const icons: Record<ControlStatus, { icon: React.ElementType; color: string }> = {
    not_started: { icon: Circle, color: 'text-slate-400' },
    in_progress: { icon: Clock, color: 'text-blue-500' },
    passed: { icon: CheckCircle2, color: 'text-green-500' },
    failed: { icon: XCircle, color: 'text-red-500' },
    not_applicable: { icon: AlertTriangle, color: 'text-slate-400' },
  };
  const { icon: Icon, color } = icons[status];
  return <Icon className={cn('h-5 w-5', color)} />;
};

const StatusBadge = ({ status }: { status: ControlStatus }) => {
  const config: Record<ControlStatus, { color: string; label: string }> = {
    not_started: { color: 'bg-slate-100 text-slate-700', label: 'Not Started' },
    in_progress: { color: 'bg-blue-100 text-blue-700', label: 'In Progress' },
    passed: { color: 'bg-green-100 text-green-700', label: 'Passed' },
    failed: { color: 'bg-red-100 text-red-700', label: 'Failed' },
    not_applicable: { color: 'bg-slate-100 text-slate-500', label: 'N/A' },
  };
  const { color, label } = config[status];
  return <Badge className={color}>{label}</Badge>;
};

const ProgressRing = ({
  percentage,
  size = 'md',
  color = 'auto',
}: {
  percentage: number;
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'auto';
}) => {
  const sizes = { sm: 60, md: 80, lg: 100 };
  const strokeWidths = { sm: 4, md: 6, lg: 8 };
  const dimension = sizes[size];
  const strokeWidth = strokeWidths[size];
  const radius = (dimension - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const getColor = () => {
    if (color !== 'auto') return color;
    if (percentage >= 80) return 'green';
    if (percentage >= 50) return 'yellow';
    return 'red';
  };

  const colorClass = {
    blue: 'stroke-blue-500',
    green: 'stroke-green-500',
    yellow: 'stroke-yellow-500',
    red: 'stroke-red-500',
  }[getColor()];

  return (
    <div className="relative" style={{ width: dimension, height: dimension }}>
      <svg className="transform -rotate-90" width={dimension} height={dimension}>
        <circle
          className="stroke-slate-200"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={dimension / 2}
          cy={dimension / 2}
        />
        <circle
          className={cn('transition-all duration-500', colorClass)}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={dimension / 2}
          cy={dimension / 2}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold">{percentage}%</span>
      </div>
    </div>
  );
};

const CertificationCard = ({
  certification,
  onSelect,
}: {
  certification: Certification;
  onSelect: () => void;
}) => {
  const Icon = certification.icon;

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/50',
        certification.status === 'certified' && 'border-green-200 bg-green-50/30'
      )}
      onClick={onSelect}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className={cn('p-3 rounded-lg', certification.color)}>
            <Icon className="h-6 w-6" />
          </div>
          <Badge
            variant={certification.status === 'certified' ? 'default' : 'outline'}
            className={cn(
              certification.status === 'certified' && 'bg-green-500',
              certification.status === 'expired' && 'bg-red-100 text-red-700 border-red-200'
            )}
          >
            {certification.status === 'certified' && 'Certified'}
            {certification.status === 'in_progress' && 'In Progress'}
            {certification.status === 'not_started' && 'Not Started'}
            {certification.status === 'expired' && 'Expired'}
          </Badge>
        </div>
        <CardTitle className="text-lg mt-3">{certification.name}</CardTitle>
        <CardDescription>{certification.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              {certification.completedControls} of {certification.totalControls} controls
            </p>
            <Progress value={certification.completionPercentage} className="w-32 h-2 mt-1" />
          </div>
          <ProgressRing percentage={certification.completionPercentage} size="sm" />
        </div>
        {certification.expiresAt && (
          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {certification.status === 'certified' ? 'Expires' : 'Target'}:{' '}
              {new Date(certification.expiresAt).toLocaleDateString()}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export function ComplianceDashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState<Certification | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [controlDialogOpen, setControlDialogOpen] = useState(false);
  const [selectedControl, setSelectedControl] = useState<Control | null>(null);
  const [evidenceNotes, setEvidenceNotes] = useState('');

  // Sample certifications data
  const [certifications, setCertifications] = useState<Certification[]>([
    {
      id: 'soc2',
      type: 'soc2',
      name: 'SOC 2 Type II',
      description: 'Service Organization Control 2 - Security, Availability, Processing Integrity',
      status: 'in_progress',
      totalControls: 64,
      completedControls: 42,
      completionPercentage: 66,
      expiresAt: '2025-06-30',
      icon: Shield,
      color: 'bg-blue-100 text-blue-600',
      controls: [
        {
          id: '1',
          controlId: 'CC1.1',
          title: 'Security Policies',
          description: 'Organization maintains security policies',
          category: 'Security',
          status: 'passed',
        },
        {
          id: '2',
          controlId: 'CC1.2',
          title: 'Board Oversight',
          description: 'Board provides oversight of security',
          category: 'Security',
          status: 'passed',
        },
        {
          id: '3',
          controlId: 'CC2.1',
          title: 'Communication',
          description: 'Security objectives are communicated',
          category: 'Security',
          status: 'in_progress',
        },
        {
          id: '4',
          controlId: 'CC3.1',
          title: 'Risk Assessment',
          description: 'Risk assessment processes exist',
          category: 'Risk',
          status: 'passed',
        },
        {
          id: '5',
          controlId: 'CC4.1',
          title: 'Monitoring',
          description: 'Ongoing security monitoring',
          category: 'Monitoring',
          status: 'not_started',
        },
        {
          id: '6',
          controlId: 'CC5.1',
          title: 'Logical Access',
          description: 'Logical access controls implemented',
          category: 'Access',
          status: 'passed',
        },
        {
          id: '7',
          controlId: 'CC6.1',
          title: 'Physical Access',
          description: 'Physical access controls exist',
          category: 'Access',
          status: 'in_progress',
        },
        {
          id: '8',
          controlId: 'CC7.1',
          title: 'System Operations',
          description: 'System operations are monitored',
          category: 'Operations',
          status: 'passed',
        },
      ],
    },
    {
      id: 'iso27001',
      type: 'iso27001',
      name: 'ISO 27001',
      description: 'Information Security Management System',
      status: 'not_started',
      totalControls: 114,
      completedControls: 0,
      completionPercentage: 0,
      expiresAt: '2025-12-31',
      icon: ShieldCheck,
      color: 'bg-purple-100 text-purple-600',
      controls: [
        {
          id: '1',
          controlId: 'A.5.1',
          title: 'Information Security Policies',
          description: 'Management direction for information security',
          category: 'Policies',
          status: 'not_started',
        },
        {
          id: '2',
          controlId: 'A.6.1',
          title: 'Internal Organization',
          description: 'Roles and responsibilities defined',
          category: 'Organization',
          status: 'not_started',
        },
        {
          id: '3',
          controlId: 'A.7.1',
          title: 'Human Resource Security',
          description: 'Pre-employment screening',
          category: 'HR',
          status: 'not_started',
        },
      ],
    },
    {
      id: 'iso42001',
      type: 'iso42001',
      name: 'ISO 42001',
      description: 'AI Management System - Responsible AI Development',
      status: 'in_progress',
      totalControls: 42,
      completedControls: 15,
      completionPercentage: 36,
      expiresAt: '2025-09-30',
      icon: Sparkles,
      color: 'bg-amber-100 text-amber-600',
      controls: [
        {
          id: '1',
          controlId: '4.1',
          title: 'Context of Organization',
          description: 'Understanding the organization context for AI',
          category: 'Context',
          status: 'passed',
        },
        {
          id: '2',
          controlId: '5.1',
          title: 'Leadership',
          description: 'Leadership commitment to AI governance',
          category: 'Leadership',
          status: 'passed',
        },
        {
          id: '3',
          controlId: '6.1',
          title: 'AI Risk Assessment',
          description: 'Risk assessment for AI systems',
          category: 'Risk',
          status: 'in_progress',
        },
        {
          id: '4',
          controlId: '7.1',
          title: 'AI Training Data',
          description: 'Training data quality and governance',
          category: 'Data',
          status: 'in_progress',
        },
        {
          id: '5',
          controlId: '8.1',
          title: 'AI Development',
          description: 'Responsible AI development practices',
          category: 'Development',
          status: 'not_started',
        },
      ],
    },
    {
      id: 'gdpr',
      type: 'gdpr',
      name: 'GDPR Compliance',
      description: 'General Data Protection Regulation - EU Privacy',
      status: 'certified',
      totalControls: 28,
      completedControls: 28,
      completionPercentage: 100,
      certifiedAt: '2024-03-15',
      expiresAt: '2025-03-15',
      icon: Lock,
      color: 'bg-green-100 text-green-600',
      controls: [
        {
          id: '1',
          controlId: 'Art.5',
          title: 'Data Processing Principles',
          description: 'Lawful, fair, transparent processing',
          category: 'Principles',
          status: 'passed',
        },
        {
          id: '2',
          controlId: 'Art.6',
          title: 'Lawful Basis',
          description: 'Lawful basis for processing established',
          category: 'Legal',
          status: 'passed',
        },
        {
          id: '3',
          controlId: 'Art.7',
          title: 'Consent',
          description: 'Consent mechanisms implemented',
          category: 'Consent',
          status: 'passed',
        },
        {
          id: '4',
          controlId: 'Art.12',
          title: 'Transparency',
          description: 'Privacy notices provided',
          category: 'Transparency',
          status: 'passed',
        },
        {
          id: '5',
          controlId: 'Art.15',
          title: 'Right of Access',
          description: 'Data subject access requests',
          category: 'Rights',
          status: 'passed',
        },
        {
          id: '6',
          controlId: 'Art.17',
          title: 'Right to Erasure',
          description: 'Right to be forgotten',
          category: 'Rights',
          status: 'passed',
        },
        {
          id: '7',
          controlId: 'Art.32',
          title: 'Security',
          description: 'Appropriate security measures',
          category: 'Security',
          status: 'passed',
        },
        {
          id: '8',
          controlId: 'Art.33',
          title: 'Breach Notification',
          description: 'Data breach procedures',
          category: 'Breach',
          status: 'passed',
        },
      ],
    },
  ]);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleControlStatusChange = (controlId: string, newStatus: ControlStatus) => {
    if (!selectedCert) return;

    setCertifications(prev =>
      prev.map(cert => {
        if (cert.id !== selectedCert.id) return cert;

        const updatedControls = cert.controls.map(ctrl =>
          ctrl.id === controlId ? { ...ctrl, status: newStatus } : ctrl
        );

        const completedControls = updatedControls.filter(
          c => c.status === 'passed' || c.status === 'not_applicable'
        ).length;

        return {
          ...cert,
          controls: updatedControls,
          completedControls,
          completionPercentage: Math.round((completedControls / cert.totalControls) * 100),
        };
      })
    );

    // Update selected cert
    setSelectedCert(prev => {
      if (!prev) return null;
      const updatedControls = prev.controls.map(ctrl =>
        ctrl.id === controlId ? { ...ctrl, status: newStatus } : ctrl
      );
      const completedControls = updatedControls.filter(
        c => c.status === 'passed' || c.status === 'not_applicable'
      ).length;
      return {
        ...prev,
        controls: updatedControls,
        completedControls,
        completionPercentage: Math.round((completedControls / prev.totalControls) * 100),
      };
    });

    toast({
      title: 'Control Updated',
      description: 'Control status has been updated successfully.',
    });
  };

  const handleSaveEvidence = () => {
    if (!selectedControl || !selectedCert) return;

    setCertifications(prev =>
      prev.map(cert => {
        if (cert.id !== selectedCert.id) return cert;
        return {
          ...cert,
          controls: cert.controls.map(ctrl =>
            ctrl.id === selectedControl.id
              ? { ...ctrl, evidenceNotes, status: 'passed' as ControlStatus }
              : ctrl
          ),
        };
      })
    );

    setControlDialogOpen(false);
    setEvidenceNotes('');
    toast({
      title: 'Evidence Saved',
      description: 'Control evidence has been recorded.',
    });
  };

  const groupedControls = selectedCert?.controls.reduce(
    (acc, control) => {
      if (!acc[control.category]) acc[control.category] = [];
      acc[control.category].push(control);
      return acc;
    },
    {} as Record<string, Control[]>
  );

  const overallStats = {
    total: certifications.length,
    certified: certifications.filter(c => c.status === 'certified').length,
    inProgress: certifications.filter(c => c.status === 'in_progress').length,
    avgCompletion: Math.round(
      certifications.reduce((sum, c) => sum + c.completionPercentage, 0) / certifications.length
    ),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Shield className="h-8 w-8 animate-pulse text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Compliance & Certifications</h2>
          <p className="text-sm text-muted-foreground">
            Track and manage regulatory compliance and certifications
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button>
            <Sparkles className="h-4 w-4 mr-2" />
            Gap Analysis
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Certifications</p>
                <p className="text-2xl font-bold">{overallStats.total}</p>
              </div>
              <Shield className="h-8 w-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Certified</p>
                <p className="text-2xl font-bold text-green-600">{overallStats.certified}</p>
              </div>
              <ShieldCheck className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{overallStats.inProgress}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Completion</p>
                <p className="text-2xl font-bold">{overallStats.avgCompletion}%</p>
              </div>
              <ProgressRing percentage={overallStats.avgCompletion} size="sm" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Certifications Grid */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Certifications</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {certifications.map(cert => (
            <CertificationCard
              key={cert.id}
              certification={cert}
              onSelect={() => {
                setSelectedCert(cert);
                setDetailsOpen(true);
              }}
            />
          ))}
        </div>
      </div>

      {/* Certification Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              {selectedCert && (
                <div className={cn('p-2 rounded-lg', selectedCert.color)}>
                  <selectedCert.icon className="h-5 w-5" />
                </div>
              )}
              <div>
                <DialogTitle>{selectedCert?.name}</DialogTitle>
                <DialogDescription>{selectedCert?.description}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedCert && (
            <div className="space-y-6">
              {/* Progress Overview */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Overall Progress</p>
                  <p className="text-lg font-semibold">
                    {selectedCert.completedControls} of {selectedCert.totalControls} controls
                    completed
                  </p>
                </div>
                <ProgressRing percentage={selectedCert.completionPercentage} size="md" />
              </div>

              {/* Controls by Category */}
              <Tabs defaultValue={Object.keys(groupedControls || {})[0]}>
                <TabsList className="mb-4">
                  {Object.keys(groupedControls || {}).map(category => (
                    <TabsTrigger key={category} value={category}>
                      {category}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {Object.entries(groupedControls || {}).map(([category, controls]) => (
                  <TabsContent key={category} value={category}>
                    <div className="space-y-2">
                      {controls.map(control => (
                        <Card
                          key={control.id}
                          className={cn(
                            'cursor-pointer hover:border-primary/50 transition-colors',
                            control.status === 'passed' && 'border-green-200 bg-green-50/30'
                          )}
                        >
                          <CardContent className="py-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <StatusIcon status={control.status} />
                                <div>
                                  <p className="font-medium">
                                    {control.controlId}: {control.title}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {control.description}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <StatusBadge status={control.status} />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedControl(control);
                                    setEvidenceNotes(control.evidenceNotes || '');
                                    setControlDialogOpen(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Control Evidence Dialog */}
      <Dialog open={controlDialogOpen} onOpenChange={setControlDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedControl?.controlId}: {selectedControl?.title}
            </DialogTitle>
            <DialogDescription>{selectedControl?.description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Current Status</p>
              <div className="flex gap-2">
                {(
                  [
                    'not_started',
                    'in_progress',
                    'passed',
                    'failed',
                    'not_applicable',
                  ] as ControlStatus[]
                ).map(status => (
                  <Button
                    key={status}
                    variant={selectedControl?.status === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      if (selectedControl && selectedCert) {
                        handleControlStatusChange(selectedControl.id, status);
                        setSelectedControl({ ...selectedControl, status });
                      }
                    }}
                  >
                    <StatusIcon status={status} />
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Evidence Notes</p>
              <Textarea
                placeholder="Document evidence, links, and notes for this control..."
                value={evidenceNotes}
                onChange={e => setEvidenceNotes(e.target.value)}
                rows={4}
              />
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Evidence Files</p>
              <Button variant="outline" className="w-full">
                <Upload className="h-4 w-4 mr-2" />
                Upload Evidence
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setControlDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEvidence}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Save Evidence
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
