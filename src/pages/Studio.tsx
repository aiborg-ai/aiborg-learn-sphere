/**
 * Studio Page
 * Main page for Admin Studio - content creation hub
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { StudioHome } from '@/components/studio/StudioHome';
import { StudioWizard } from '@/components/studio/StudioWizard';
import { SuccessDialog } from '@/components/studio/SuccessDialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useStudioPublish } from '@/hooks/studio/useStudioPublish';
import { logger } from '@/utils/logger';
import type { AssetType, WizardMode } from '@/types/studio.types';

type StudioView = 'home' | 'wizard' | 'select-asset';

interface WizardState {
  assetType: AssetType;
  mode: WizardMode;
  assetId?: string;
  initialData?: Record<string, unknown>;
}

export default function Studio() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [view, setView] = useState<StudioView>('home');
  const [wizardState, setWizardState] = useState<WizardState | null>(null);
  const [successDialogState, setSuccessDialogState] = useState<{
    isOpen: boolean;
    assetType: AssetType;
    assetId: string;
    mode: WizardMode;
  } | null>(null);

  // Initialize publish hook
  const { publish } = useStudioPublish({
    assetType: wizardState?.assetType || 'course',
    mode: wizardState?.mode || 'create',
    assetId: wizardState?.assetId,
    onSuccess: assetId => {
      if (wizardState) {
        setSuccessDialogState({
          isOpen: true,
          assetType: wizardState.assetType,
          assetId,
          mode: wizardState.mode,
        });
      }
    },
  });

  // Handle creating new asset
  const handleCreateNew = (assetType: AssetType) => {
    setWizardState({
      assetType,
      mode: 'create',
    });
    setView('wizard');
  };

  // Handle editing existing asset
  const handleEditExisting = (assetType: AssetType) => {
    // TODO: Show asset selection dialog
    toast({
      title: 'Coming Soon',
      description: `Edit existing ${assetType} functionality will be available soon.`,
    });

    // For now, navigate to admin panel
    // navigate(`/admin?tab=${assetType}s`);
  };

  // Handle wizard exit
  const handleWizardExit = () => {
    setView('home');
    setWizardState(null);
  };

  // Handle publish/update
  const handlePublish = async (data: Record<string, unknown>) => {
    if (!wizardState) return;

    try {
      await publish(data);
      // Success dialog will be shown via onSuccess callback
    } catch (error) {
      logger.error('Publish failed:', error);
      // Error toast already shown by useStudioPublish
    }
  };

  // Success dialog handlers
  const handleCreateAnother = () => {
    if (successDialogState) {
      setSuccessDialogState(null);
      setWizardState({
        assetType: successDialogState.assetType,
        mode: 'create',
      });
      setView('wizard');
    }
  };

  const handleViewAsset = () => {
    if (successDialogState) {
      // Navigate to the asset view page
      const { assetType, assetId } = successDialogState;
      if (assetType === 'course') {
        navigate(`/course/${assetId}`);
      } else if (assetType === 'blog') {
        navigate(`/blog/${assetId}`);
      } else {
        // For events and announcements, go to admin panel
        navigate('/admin');
      }
    }
  };

  const handleGoToDashboard = () => {
    navigate('/admin');
  };

  // Go back to admin panel
  const handleBackToAdmin = () => {
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <div className="border-b bg-card">
        <div className="container max-w-7xl mx-auto p-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={handleBackToAdmin} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Admin
          </Button>

          {user && <div className="text-sm text-muted-foreground">{user.email}</div>}
        </div>
      </div>

      {/* Main Content */}
      <div className="py-8">
        {view === 'home' && (
          <StudioHome onCreateNew={handleCreateNew} onEditExisting={handleEditExisting} />
        )}

        {view === 'wizard' && wizardState && (
          <StudioWizard
            assetType={wizardState.assetType}
            mode={wizardState.mode}
            assetId={wizardState.assetId}
            initialData={wizardState.initialData}
            onExit={handleWizardExit}
            onPublish={handlePublish}
          />
        )}
      </div>

      {/* Success Dialog */}
      {successDialogState && (
        <SuccessDialog
          isOpen={successDialogState.isOpen}
          assetType={successDialogState.assetType}
          assetId={successDialogState.assetId}
          mode={successDialogState.mode}
          onCreateAnother={handleCreateAnother}
          onViewAsset={handleViewAsset}
          onGoToDashboard={handleGoToDashboard}
        />
      )}
    </div>
  );
}
