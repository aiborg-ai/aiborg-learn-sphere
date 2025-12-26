/**
 * Certificate Management Component
 *
 * Allows admins to:
 * - Generate certificates for users
 * - View issued certificates
 * - Download/regenerate certificates
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Award, Download, Eye, Plus, Loader2, FileText, QrCode, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { generateCertificatePDF } from '@/utils/pdfCertificateGenerator';

interface CertificateManagementProps {
  organizationId: string;
}

interface Certificate {
  id: string;
  user_id: string;
  certificate_type: string;
  reference_id: string;
  title: string;
  description?: string;
  verification_code: string;
  pdf_url?: string;
  qr_code_url?: string;
  issued_date: string;
  expires_at?: string;
  profiles?: {
    full_name?: string;
    email?: string;
  };
}

export function CertificateManagement({ organizationId }: CertificateManagementProps) {
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [certificateType, setCertificateType] = useState('course_completion');
  const [certificateTitle, setCertificateTitle] = useState('');
  const [courseReference, setCourseReference] = useState('');
  const queryClient = useQueryClient();

  // Fetch certificates for the organization
  const { data: certificates, isLoading } = useQuery({
    queryKey: ['certificates', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('certificates')
        .select(
          `
          *,
          profiles!certificates_user_id_fkey (
            full_name,
            email
          )
        `
        )
        .order('issued_date', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as Certificate[];
    },
  });

  // Fetch users for dropdown
  const { data: users } = useQuery({
    queryKey: ['organization-users', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .limit(100);

      if (error) throw error;
      return data;
    },
  });

  // Generate certificate mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUser || !certificateTitle || !courseReference) {
        throw new Error('Please fill in all required fields');
      }

      // Create certificate record
      const { data: certificate, error: certError } = await supabase
        .from('certificates')
        .insert({
          user_id: selectedUser,
          certificate_type: certificateType,
          reference_id: courseReference,
          title: certificateTitle,
        })
        .select()
        .single();

      if (certError) throw certError;

      // Get user info for PDF
      const user = users?.find(u => u.id === selectedUser);

      // Generate PDF
      const pdfBlob = await generateCertificatePDF({
        userName: user?.full_name || 'User',
        courseTitle: certificateTitle,
        issueDate: new Date(certificate.issued_date).toLocaleDateString(),
        verificationCode: certificate.verification_code,
      });

      // Upload PDF to storage
      const pdfPath = `certificates/${certificate.id}/certificate.pdf`;
      const { error: uploadError } = await supabase.storage
        .from('certificates')
        .upload(pdfPath, pdfBlob, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: pdfUrl } = supabase.storage.from('certificates').getPublicUrl(pdfPath);

      // Update certificate with PDF URL
      await supabase
        .from('certificates')
        .update({ pdf_url: pdfUrl.publicUrl })
        .eq('id', certificate.id);

      return certificate;
    },
    onSuccess: () => {
      toast.success('Certificate generated successfully!');
      queryClient.invalidateQueries({ queryKey: ['certificates', organizationId] });
      setGenerateDialogOpen(false);
      resetForm();
    },
    onError: error => {
      toast.error(`Failed to generate certificate: ${error.message}`);
    },
  });

  const resetForm = () => {
    setSelectedUser('');
    setCertificateType('course_completion');
    setCertificateTitle('');
    setCourseReference('');
  };

  const downloadCertificate = async (certificate: Certificate) => {
    if (!certificate.pdf_url) {
      toast.error('PDF not available for this certificate');
      return;
    }

    try {
      const response = await fetch(certificate.pdf_url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate_${certificate.verification_code}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to download certificate');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Certificate Management</h2>
          <p className="text-muted-foreground">
            Generate and manage certificates for your organization
          </p>
        </div>
        <Button onClick={() => setGenerateDialogOpen(true)} size="lg">
          <Plus className="h-4 w-4 mr-2" />
          Generate Certificate
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Issued
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{certificates?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Certificates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {certificates?.filter(c => !c.expires_at || new Date(c.expires_at) > new Date())
                .length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {certificates?.filter(c => {
                const issued = new Date(c.issued_date);
                const now = new Date();
                return (
                  issued.getMonth() === now.getMonth() && issued.getFullYear() === now.getFullYear()
                );
              }).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Certificates List */}
      <Card>
        <CardHeader>
          <CardTitle>Issued Certificates</CardTitle>
          <CardDescription>View and manage all certificates issued to users</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : certificates && certificates.length > 0 ? (
            <div className="space-y-3">
              {certificates.map(cert => (
                <div
                  key={cert.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Award className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="font-semibold">{cert.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {cert.profiles?.full_name || 'Unknown User'} (
                          {cert.profiles?.email || 'No email'})
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Issued: {new Date(cert.issued_date).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <QrCode className="h-3 w-3" />
                        {cert.verification_code}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {cert.certificate_type.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        window.open(`/verify/${cert.verification_code}`, '_blank');
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Verify
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadCertificate(cert)}
                      disabled={!cert.pdf_url}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      PDF
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No certificates issued yet</p>
              <Button
                onClick={() => setGenerateDialogOpen(true)}
                variant="outline"
                className="mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Generate Your First Certificate
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generate Certificate Dialog */}
      <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Generate Certificate</DialogTitle>
            <DialogDescription>
              Create a new certificate for a user who completed a course
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="user">User *</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger id="user">
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {users?.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Certificate Type *</Label>
              <Select value={certificateType} onValueChange={setCertificateType}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="course_completion">Course Completion</SelectItem>
                  <SelectItem value="skill_achievement">Skill Achievement</SelectItem>
                  <SelectItem value="program_completion">Program Completion</SelectItem>
                  <SelectItem value="participation">Participation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Certificate Title *</Label>
              <Input
                id="title"
                placeholder="e.g., AI Fundamentals Course"
                value={certificateTitle}
                onChange={e => setCertificateTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference">Course/Program Reference *</Label>
              <Input
                id="reference"
                placeholder="Course ID or reference number"
                value={courseReference}
                onChange={e => setCourseReference(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenerateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Award className="h-4 w-4 mr-2" />
                  Generate
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
