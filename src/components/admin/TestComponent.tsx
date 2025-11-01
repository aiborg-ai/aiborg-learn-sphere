import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';

export function TestComponent() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Test Component</CardTitle>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Test Add New Button
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p>
          If you can see the "Test Add New Button" above, the issue is with the enhanced components.
        </p>
        <p>If you cannot see it, there's a broader rendering issue.</p>
      </CardContent>
    </Card>
  );
}
