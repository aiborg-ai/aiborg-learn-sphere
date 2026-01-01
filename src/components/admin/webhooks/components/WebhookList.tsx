/**
 * WebhookList Component
 * Displays list of webhook endpoints with status and actions
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Trash2, Eye, EyeOff, Play, Copy, CheckCircle2, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { WebhookEndpoint } from '../types';
import { maskSecret } from '../utils';

interface WebhookListProps {
  webhooks: WebhookEndpoint[];
  onTest: (webhook: WebhookEndpoint) => void;
  onToggleStatus: (webhook: WebhookEndpoint) => void;
  onDelete: (id: string) => void;
  onCopyToClipboard: (text: string, label: string) => void;
  getStatusBadge: (status: string) => React.ReactNode;
}

export function WebhookList({
  webhooks,
  onTest,
  onToggleStatus,
  onDelete,
  onCopyToClipboard,
  getStatusBadge,
}: WebhookListProps) {
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  const toggleSecretVisibility = (id: string) => {
    setShowSecrets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-4">
      {webhooks.map(webhook => (
        <Card key={webhook.id}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="text-lg">{webhook.name}</CardTitle>
                {getStatusBadge(webhook.status)}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => onTest(webhook)}>
                  <Play className="w-4 h-4 mr-1" />
                  Test
                </Button>
                <Button variant="outline" size="sm" onClick={() => onToggleStatus(webhook)}>
                  {webhook.status === 'active' ? 'Disable' : 'Enable'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onDelete(webhook.id)}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </div>
            <CardDescription className="flex items-center gap-2">
              <code className="text-xs bg-muted px-2 py-1 rounded">{webhook.url}</code>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => onCopyToClipboard(webhook.url, 'URL')}
              >
                <Copy className="w-3 h-3" />
              </Button>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Secret */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Signing Secret</Label>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-muted px-2 py-1 rounded flex-1 overflow-hidden">
                    {showSecrets[webhook.id] ? webhook.secret : maskSecret(webhook.secret)}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => toggleSecretVisibility(webhook.id)}
                  >
                    {showSecrets[webhook.id] ? (
                      <EyeOff className="w-3 h-3" />
                    ) : (
                      <Eye className="w-3 h-3" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => onCopyToClipboard(webhook.secret, 'Secret')}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* Events */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Subscribed Events</Label>
                <div className="flex flex-wrap gap-1">
                  {webhook.events.slice(0, 3).map(event => (
                    <Badge key={event} variant="outline" className="text-xs">
                      {event}
                    </Badge>
                  ))}
                  {webhook.events.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{webhook.events.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Delivery Stats</Label>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-green-600">
                    <CheckCircle2 className="w-3 h-3 inline mr-1" />
                    {webhook.successCount.toLocaleString()}
                  </span>
                  <span className="text-red-600">
                    <XCircle className="w-3 h-3 inline mr-1" />
                    {webhook.failureCount}
                  </span>
                  {webhook.lastTriggered && (
                    <span className="text-muted-foreground text-xs">
                      Last:{' '}
                      {formatDistanceToNow(new Date(webhook.lastTriggered), {
                        addSuffix: true,
                      })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
