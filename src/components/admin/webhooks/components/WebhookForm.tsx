/**
 * WebhookForm Component
 * Form for creating/editing webhook endpoints
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { AVAILABLE_EVENTS } from '../types';

interface WebhookFormData {
  name: string;
  url: string;
  events: string[];
  retryEnabled: boolean;
  maxRetries: number;
  timeoutSeconds: number;
}

interface WebhookFormProps {
  onSubmit: (data: WebhookFormData) => Promise<boolean>;
}

export function WebhookForm({ onSubmit }: WebhookFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<WebhookFormData>({
    name: '',
    url: '',
    events: [],
    retryEnabled: true,
    maxRetries: 3,
    timeoutSeconds: 30,
  });

  const groupedEvents = AVAILABLE_EVENTS.reduce(
    (acc, event) => {
      if (!acc[event.category]) {
        acc[event.category] = [];
      }
      acc[event.category].push(event);
      return acc;
    },
    {} as Record<string, typeof AVAILABLE_EVENTS>
  );

  const handleSubmit = async () => {
    const success = await onSubmit(formData);
    if (success) {
      setFormData({
        name: '',
        url: '',
        events: [],
        retryEnabled: true,
        maxRetries: 3,
        timeoutSeconds: 30,
      });
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Webhook
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Webhook</DialogTitle>
          <DialogDescription>
            Configure a webhook endpoint to receive event notifications
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="webhook-name">Name</Label>
            <Input
              id="webhook-name"
              placeholder="My Webhook"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="webhook-url">Endpoint URL</Label>
            <Input
              id="webhook-url"
              placeholder="https://api.example.com/webhooks"
              value={formData.url}
              onChange={e => setFormData(prev => ({ ...prev, url: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Events to Subscribe</Label>
            <div className="border rounded-lg p-4 max-h-64 overflow-y-auto space-y-4">
              {Object.entries(groupedEvents).map(([category, events]) => (
                <div key={category}>
                  <h4 className="font-medium text-sm mb-2">{category}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {events.map(event => (
                      <div key={event.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={event.value}
                          checked={formData.events.includes(event.value)}
                          onCheckedChange={checked => {
                            setFormData(prev => ({
                              ...prev,
                              events: checked
                                ? [...prev.events, event.value]
                                : prev.events.filter(e => e !== event.value),
                            }));
                          }}
                        />
                        <Label htmlFor={event.value} className="text-sm font-normal">
                          {event.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="max-retries">Max Retries</Label>
              <Select
                value={String(formData.maxRetries)}
                onValueChange={value =>
                  setFormData(prev => ({ ...prev, maxRetries: parseInt(value) }))
                }
              >
                <SelectTrigger id="max-retries">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">No retries</SelectItem>
                  <SelectItem value="3">3 retries</SelectItem>
                  <SelectItem value="5">5 retries</SelectItem>
                  <SelectItem value="10">10 retries</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeout">Timeout (seconds)</Label>
              <Select
                value={String(formData.timeoutSeconds)}
                onValueChange={value =>
                  setFormData(prev => ({ ...prev, timeoutSeconds: parseInt(value) }))
                }
              >
                <SelectTrigger id="timeout">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 seconds</SelectItem>
                  <SelectItem value="30">30 seconds</SelectItem>
                  <SelectItem value="60">60 seconds</SelectItem>
                  <SelectItem value="120">120 seconds</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Create Webhook</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
