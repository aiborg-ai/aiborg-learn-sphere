import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import type { CallToActionProps } from './types';

export function CallToAction({ onViewPrograms }: CallToActionProps) {
  return (
    <Card className="bg-gradient-to-r from-primary/10 to-primary/5 print:hidden">
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-lg mb-1">Ready to implement AI in your business?</h3>
            <p className="text-sm text-muted-foreground">
              Explore our training programs designed for SMEs
            </p>
          </div>
          <Button onClick={onViewPrograms}>
            View Training Programs
            <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
