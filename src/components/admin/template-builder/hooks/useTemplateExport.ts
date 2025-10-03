import { useToast } from '@/components/ui/use-toast';
import { TemplateType } from '../types';

export function useTemplateExport() {
  const { toast } = useToast();

  const exportAsJSON = (formData: Record<string, any>, templateType: TemplateType) => {
    const exportData = templateType === 'course'
      ? { courses: [formData] }
      : { events: [formData] };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${templateType}-template-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Exported Successfully',
      description: 'Template has been downloaded as JSON',
    });
  };

  const copyToClipboard = (formData: Record<string, any>, templateType: TemplateType) => {
    const exportData = templateType === 'course'
      ? { courses: [formData] }
      : { events: [formData] };

    navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));

    toast({
      title: 'Copied to Clipboard',
      description: 'Template JSON has been copied',
    });
  };

  return {
    exportAsJSON,
    copyToClipboard
  };
}
