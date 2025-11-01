import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ValidationRequest, ImportRequest } from '@/services/templateService';
import { templateService } from '@/services/templateService';
import { useToast } from '@/components/ui/use-toast';

/**
 * Hook for validating templates
 */
export function useValidateTemplates() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (request: ValidationRequest) => templateService.validateTemplates(request),
    onSuccess: data => {
      if (data.success) {
        toast({
          title: 'Validation Successful',
          description: `${data.summary?.valid || 0} items validated successfully`,
        });
      } else {
        toast({
          title: 'Validation Failed',
          description: `${data.summary?.invalid || 0} items have errors`,
          variant: 'destructive',
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Validation Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook for importing templates
 */
export function useImportTemplates() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: ImportRequest) => templateService.importTemplates(request),
    onSuccess: data => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['import-history'] });
      queryClient.invalidateQueries({ queryKey: ['import-statistics'] });

      if (data.type === 'course') {
        queryClient.invalidateQueries({ queryKey: ['courses'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['events'] });
      }

      if (data.success) {
        toast({
          title: 'Import Successful',
          description: `Successfully imported ${data.summary?.imported || 0} items`,
        });
      } else {
        toast({
          title: 'Import Completed with Errors',
          description: `Imported ${data.summary?.imported || 0} items, ${data.summary?.failed || 0} failed`,
          variant: 'destructive',
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Import Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook for fetching import history
 */
export function useImportHistory(params?: {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
}) {
  return useQuery({
    queryKey: ['import-history', params],
    queryFn: () => templateService.getImportHistory(params),
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook for fetching import details
 */
export function useImportDetails(importId?: string) {
  return useQuery({
    queryKey: ['import-details', importId],
    queryFn: () => (importId ? templateService.getImportDetails(importId) : null),
    enabled: !!importId,
    staleTime: 60000, // 1 minute
  });
}

/**
 * Hook for fetching import statistics
 */
export function useImportStatistics() {
  return useQuery({
    queryKey: ['import-statistics'],
    queryFn: () => templateService.getImportStatistics(),
    staleTime: 60000, // 1 minute
  });
}

/**
 * Hook for parsing JSON file
 */
export function useParseJSONFile() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (file: File) => templateService.parseJSONFile(file),
    onError: (error: Error) => {
      toast({
        title: 'Parse Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
