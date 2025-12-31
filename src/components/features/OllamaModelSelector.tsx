/**
 * Ollama Model Selector Component
 * Displays available models with online status indicators and allows quick model switching
 */

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronDown, Cpu, RefreshCw, Wifi, WifiOff, Loader2, Server } from 'lucide-react';
import { OllamaService, OllamaModelStatus } from '@/services/ai/OllamaService';
import { logger } from '@/utils/logger';

interface OllamaModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  compact?: boolean;
  className?: string;
}

// Model icons based on family
const getModelIcon = (family: string) => {
  switch (family.toLowerCase()) {
    case 'llama':
      return '🦙';
    case 'qwen2':
    case 'qwen':
      return '🌟';
    case 'deepseek2':
    case 'deepseek':
      return '🔍';
    case 'mistral':
      return '🌊';
    case 'phi':
      return 'φ';
    default:
      return '🤖';
  }
};

// Format size for display
const formatSize = (sizeGB: number): string => {
  if (sizeGB >= 100) {
    return `${Math.round(sizeGB)}GB`;
  }
  return `${sizeGB.toFixed(1)}GB`;
};

export function OllamaModelSelector({
  selectedModel,
  onModelChange,
  compact = false,
  className = '',
}: OllamaModelSelectorProps) {
  const [models, setModels] = useState<OllamaModelStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [serverOnline, setServerOnline] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Fetch models from Ollama
  const fetchModels = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setIsRefreshing(true);
    }

    try {
      const isHealthy = await OllamaService.checkHealth();
      setServerOnline(isHealthy);

      if (isHealthy) {
        const modelStatuses = await OllamaService.getModelStatuses();
        setModels(modelStatuses);
        logger.info('Fetched Ollama models:', modelStatuses.length);
      } else {
        setModels([]);
      }

      setLastRefresh(new Date());
    } catch (_error) {
      logger._error('Failed to fetch Ollama models:', _error);
      setServerOnline(false);
      setModels([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchModels();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchModels();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchModels]);

  // Get selected model details
  const selectedModelDetails = models.find(m => m.name === selectedModel);

  // Handle model selection
  const handleModelSelect = (modelName: string) => {
    onModelChange(modelName);
    logger.info('Model changed to:', modelName);
  };

  // Render status indicator
  const StatusIndicator = ({ online }: { online: boolean }) => (
    <div
      className={`w-2 h-2 rounded-full ${online ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}
    />
  );

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 px-2 gap-1 ${className}`}
                  disabled={isLoading}
                >
                  <StatusIndicator online={serverOnline} />
                  <Cpu className="h-4 w-4" />
                  {isLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    Ollama Models
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={e => {
                      e.preventDefault();
                      fetchModels(true);
                    }}
                    disabled={isRefreshing}
                  >
                    <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </Button>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                {/* Server Status */}
                <div className="px-2 py-1.5 text-xs flex items-center gap-2">
                  {serverOnline ? (
                    <>
                      <Wifi className="h-3 w-3 text-green-500" />
                      <span className="text-green-600">Server Online</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-3 w-3 text-red-500" />
                      <span className="text-red-600">Server Offline</span>
                    </>
                  )}
                  {lastRefresh && (
                    <span className="text-muted-foreground ml-auto">
                      {lastRefresh.toLocaleTimeString()}
                    </span>
                  )}
                </div>

                <DropdownMenuSeparator />

                {/* Model List */}
                {models.length === 0 ? (
                  <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                    {serverOnline ? 'No models found' : 'Cannot connect to Ollama'}
                  </div>
                ) : (
                  models.map(model => (
                    <DropdownMenuItem
                      key={model.name}
                      onClick={() => handleModelSelect(model.name)}
                      className={`flex items-center justify-between gap-2 ${
                        model.name === selectedModel ? 'bg-primary/10' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-lg">{getModelIcon(model.family)}</span>
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium truncate">{model.displayName}</span>
                          <span className="text-xs text-muted-foreground">
                            {model.parameterSize} • {formatSize(model.sizeGB)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusIndicator online={model.status === 'online'} />
                        {model.name === selectedModel && (
                          <Badge variant="secondary" className="text-xs">
                            Active
                          </Badge>
                        )}
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>
              {serverOnline
                ? `Model: ${selectedModelDetails?.displayName || selectedModel}`
                : 'Ollama Offline'}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Full-size variant
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-2 min-w-[200px] justify-between"
            disabled={isLoading}
          >
            <div className="flex items-center gap-2">
              <StatusIndicator online={serverOnline} />
              {selectedModelDetails ? (
                <>
                  <span className="text-base">{getModelIcon(selectedModelDetails.family)}</span>
                  <span className="truncate max-w-[120px]">{selectedModelDetails.displayName}</span>
                </>
              ) : (
                <span className="text-muted-foreground">Select Model</span>
              )}
            </div>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-80">
          <DropdownMenuLabel className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              <span>Ollama Models</span>
              {serverOnline ? (
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                  Online
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs bg-red-100 text-red-700">
                  Offline
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={e => {
                e.preventDefault();
                fetchModels(true);
              }}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          {/* Server Info */}
          <div className="px-2 py-2 text-xs space-y-1 bg-muted/50 rounded mx-2 mb-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Server:</span>
              <span className="font-mono text-xs">{OllamaService.getHost()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Models:</span>
              <span>{models.length} available</span>
            </div>
          </div>

          {/* Model List */}
          {models.length === 0 ? (
            <div className="px-2 py-6 text-center">
              {serverOnline ? (
                <div className="space-y-2">
                  <Cpu className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No models installed</p>
                  <p className="text-xs text-muted-foreground">
                    Run <code className="bg-muted px-1 rounded">ollama pull llama3.3:70b</code>
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <WifiOff className="h-8 w-8 mx-auto text-red-400" />
                  <p className="text-sm text-red-600">Cannot connect to Ollama</p>
                  <p className="text-xs text-muted-foreground">
                    Check if Ollama is running at
                    <br />
                    <code className="bg-muted px-1 rounded">{OllamaService.getHost()}</code>
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="max-h-[300px] overflow-y-auto">
              {models.map(model => (
                <DropdownMenuItem
                  key={model.name}
                  onClick={() => handleModelSelect(model.name)}
                  className={`flex items-center gap-3 p-3 cursor-pointer ${
                    model.name === selectedModel ? 'bg-primary/10 border-l-2 border-primary' : ''
                  }`}
                >
                  <span className="text-2xl">{getModelIcon(model.family)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{model.displayName}</span>
                      <StatusIndicator online={model.status === 'online'} />
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <span>{model.parameterSize}</span>
                      <span>•</span>
                      <span>{formatSize(model.sizeGB)}</span>
                      <span>•</span>
                      <span className="capitalize">{model.family}</span>
                    </div>
                  </div>
                  {model.name === selectedModel && (
                    <Badge className="bg-primary text-primary-foreground">Active</Badge>
                  )}
                </DropdownMenuItem>
              ))}
            </div>
          )}

          <DropdownMenuSeparator />

          {/* Last Updated */}
          {lastRefresh && (
            <div className="px-2 py-1.5 text-xs text-center text-muted-foreground">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
