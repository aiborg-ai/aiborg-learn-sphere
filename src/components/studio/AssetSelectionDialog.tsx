/**
 * Asset Selection Dialog
 * Allows users to select an existing asset to edit in Studio
 */

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, FileText, Video, Presentation, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { AssetType } from '@/types/studio.types';

interface AssetSelectionDialogProps {
  isOpen: boolean;
  assetType: AssetType;
  onSelect: (assetId: string, assetData: Record<string, unknown>) => void;
  onCancel: () => void;
}

interface Asset {
  id: string;
  title: string;
  description?: string;
  created_at: string;
  updated_at: string;
  status?: string;
}

export function AssetSelectionDialog({
  isOpen,
  assetType,
  onSelect,
  onCancel,
}: AssetSelectionDialogProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch assets when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchAssets();
    }
  }, [isOpen, assetType]);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const tableName = getTableName(assetType);
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setAssets(data || []);
    } catch (_error) {
      logger.error(`Failed to fetch ${assetType}s:`, _error);
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  const getTableName = (type: AssetType): string => {
    const tableMap: Record<AssetType, string> = {
      course: 'courses',
      lesson: 'lessons',
      workshop: 'workshops',
      event: 'events',
    };
    return tableMap[type] || 'courses';
  };

  const getIcon = (type: AssetType) => {
    const iconMap: Record<AssetType, React.ReactNode> = {
      course: <FileText className="h-5 w-5" />,
      lesson: <Video className="h-5 w-5" />,
      workshop: <Presentation className="h-5 w-5" />,
      event: <Calendar className="h-5 w-5" />,
    };
    return iconMap[type] || <FileText className="h-5 w-5" />;
  };

  const filteredAssets = assets.filter(
    asset =>
      asset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (asset: Asset) => {
    onSelect(asset.id, asset);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Select {assetType} to Edit</DialogTitle>
          <DialogDescription>
            Choose an existing {assetType} to edit in the Studio wizard
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${assetType}s...`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Asset List */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredAssets.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No {assetType}s found</p>
                <p className="text-sm mt-2">Try adjusting your search or create a new one</p>
              </div>
            ) : (
              filteredAssets.map(asset => (
                <button
                  key={asset.id}
                  onClick={() => handleSelect(asset)}
                  className="w-full p-4 border rounded-lg hover:border-primary hover:bg-accent transition-colors text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1 text-muted-foreground">{getIcon(assetType)}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{asset.title}</h3>
                      {asset.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {asset.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>Updated {new Date(asset.updated_at).toLocaleDateString()}</span>
                        {asset.status && (
                          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            {asset.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
