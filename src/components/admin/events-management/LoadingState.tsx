import { Card, CardContent } from '@/components/ui/card';

export function LoadingState() {
  return (
    <Card>
      <CardContent className="py-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </CardContent>
    </Card>
  );
}
