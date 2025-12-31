import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Navbar } from '@/components/navigation/Navbar';
import { Footer } from '@/components/navigation/Footer';
import { ArrowLeft, AlertTriangle } from '@/components/ui/icons';

export function ErrorState() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Navbar />
      <div className="container mx-auto px-4 py-20">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-6 w-6" />
              Assessment Not Found
            </CardTitle>
            <CardDescription>
              The assessment report you're looking for could not be found or you don't have
              permission to view it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/sme-assessment')} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Take a New Assessment
            </Button>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
