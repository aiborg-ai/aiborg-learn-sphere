import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

interface BatchMessageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  recipients: string[];
  entityType: string;
  onSuccess?: () => void;
}

const messageSchema = z.object({
  subject: z.string().min(3, 'Subject must be at least 3 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  senderName: z.string().optional(),
  replyTo: z.string().email('Invalid reply-to email').optional(),
});

type MessageFormData = z.infer<typeof messageSchema>;

/**
 * BatchMessageDialog - Send batch emails to selected registrants
 *
 * Features:
 * - Rich text message composition
 * - Custom subject and sender name
 * - Preview before sending
 * - Progress tracking
 * - Error handling
 */
export function BatchMessageDialog({
  isOpen,
  onClose,
  recipients,
  entityType,
  onSuccess,
}: BatchMessageDialogProps) {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors: formErrors },
    reset,
    watch,
  } = useForm<MessageFormData>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      subject: '',
      message: '',
      senderName: 'AIBorg Learn Sphere',
      replyTo: 'support@aiborg.ai',
    },
  });

  const handleClose = () => {
    if (!sending) {
      reset();
      setSent(false);
      setErrors([]);
      setProgress(0);
      onClose();
    }
  };

  const onSubmit = async (data: MessageFormData) => {
    try {
      setSending(true);
      setErrors([]);
      setProgress(0);

      // Call Supabase Edge Function to send batch emails
      const { data: result, error } = await supabase.functions.invoke('send-batch-email', {
        body: {
          recipients,
          subject: data.subject,
          message: data.message,
          senderName: data.senderName || 'AIBorg Learn Sphere',
          replyTo: data.replyTo || 'support@aiborg.ai',
          entityType,
        },
      });

      if (error) {
        throw error;
      }

      logger.info('Batch email sent successfully:', result);

      setSent(true);
      setProgress(100);

      if (result?.errors && result.errors.length > 0) {
        setErrors(result.errors);
      }

      if (onSuccess) {
        onSuccess();
      }

      // Close after 3 seconds if successful
      if (!result?.errors || result.errors.length === 0) {
        setTimeout(() => {
          handleClose();
        }, 3000);
      }
    } catch (error) {
      logger.error('Error sending batch emails:', error);
      toast({
        title: 'Failed to Send Messages',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
      setErrors([error instanceof Error ? error.message : 'Unknown error']);
    } finally {
      setSending(false);
    }
  };

  const messagePreview = watch('message');
  const subjectPreview = watch('subject');

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Send Batch Message
          </DialogTitle>
          <DialogDescription>
            Send a message to {recipients.length} selected{' '}
            {recipients.length === 1 ? 'recipient' : 'recipients'}
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <div className="space-y-4 py-6">
            <div className="flex items-center justify-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Messages Sent!</h3>
              <p className="text-sm text-gray-600">
                Successfully sent {recipients.length - errors.length} message
                {recipients.length - errors.length !== 1 ? 's' : ''}
              </p>
              {errors.length > 0 && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-semibold mb-2">Failed to send to {errors.length}:</p>
                    <ul className="list-disc list-inside text-xs">
                      {errors.slice(0, 5).map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                      {errors.length > 5 && <li>... and {errors.length - 5} more</li>}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Sender Name */}
            <div className="space-y-2">
              <Label htmlFor="senderName">Sender Name</Label>
              <Input
                id="senderName"
                {...register('senderName')}
                placeholder="AIBorg Learn Sphere"
                disabled={sending}
              />
              {formErrors.senderName && (
                <p className="text-sm text-red-600">{formErrors.senderName.message}</p>
              )}
            </div>

            {/* Reply-To */}
            <div className="space-y-2">
              <Label htmlFor="replyTo">Reply-To Email</Label>
              <Input
                id="replyTo"
                type="email"
                {...register('replyTo')}
                placeholder="support@aiborg.ai"
                disabled={sending}
              />
              {formErrors.replyTo && (
                <p className="text-sm text-red-600">{formErrors.replyTo.message}</p>
              )}
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                {...register('subject')}
                placeholder="Important update about your registration"
                disabled={sending}
              />
              {formErrors.subject && (
                <p className="text-sm text-red-600">{formErrors.subject.message}</p>
              )}
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                {...register('message')}
                placeholder="Dear participant,

We wanted to inform you about...

Best regards,
The AIBorg Team"
                rows={8}
                disabled={sending}
              />
              {formErrors.message && (
                <p className="text-sm text-red-600">{formErrors.message.message}</p>
              )}
              <p className="text-xs text-gray-500">
                Tip: Use placeholders like {'{name}'} if your email service supports personalization
              </p>
            </div>

            {/* Preview */}
            {(subjectPreview || messagePreview) && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-semibold mb-2">Preview:</p>
                  {subjectPreview && (
                    <p className="text-sm mb-1">
                      <strong>Subject:</strong> {subjectPreview}
                    </p>
                  )}
                  {messagePreview && (
                    <div className="text-sm bg-gray-50 p-2 rounded mt-2 max-h-32 overflow-y-auto whitespace-pre-wrap">
                      {messagePreview}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Recipients Info */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                This message will be sent to <strong>{recipients.length}</strong>{' '}
                {recipients.length === 1 ? 'recipient' : 'recipients'}. You can view the list in the
                main table.
              </AlertDescription>
            </Alert>

            {/* Progress */}
            {sending && progress > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Sending messages...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose} disabled={sending}>
                Cancel
              </Button>
              <Button type="submit" disabled={sending}>
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Send to {recipients.length}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
