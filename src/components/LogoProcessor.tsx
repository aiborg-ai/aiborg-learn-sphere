import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { removeBackground, loadImageFromUrl } from '@/utils/backgroundRemoval';
import { Download, Loader2 } from 'lucide-react';

export const LogoProcessor = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);

  const processLogo = async () => {
    setIsProcessing(true);
    try {
      // Load the current logo
      const img = await loadImageFromUrl('/lovable-uploads/6f3c3c38-f6ef-4824-a8e4-e44014511089.png');
      
      // Remove background
      const blob = await removeBackground(img);
      
      // Create URL for the processed image
      const url = URL.createObjectURL(blob);
      setProcessedImageUrl(url);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = 'aiborg-logo-transparent.png';
      link.click();
      
    } catch (error) {
      console.error('Error processing logo:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="p-6 max-w-md mx-auto">
      <h3 className="text-lg font-semibold mb-4">Logo Background Removal</h3>
      
      <div className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-2">Current Logo:</p>
          <img 
            src="/lovable-uploads/6f3c3c38-f6ef-4824-a8e4-e44014511089.png" 
            alt="Current Logo" 
            className="w-full max-w-48 mx-auto"
          />
        </div>
        
        {processedImageUrl && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">Processed Logo:</p>
            <img 
              src={processedImageUrl} 
              alt="Processed Logo" 
              className="w-full max-w-48 mx-auto"
              style={{ background: 'repeating-conic-gradient(#808080 0% 25%, #ffffff 0% 50%) 50% / 20px 20px' }}
            />
          </div>
        )}
        
        <Button 
          onClick={processLogo} 
          disabled={isProcessing}
          className="w-full"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Remove Background & Download
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};