import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Share2, MessageCircle, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ShareButtonProps {
  title: string;
  description: string;
  url?: string;
}

export function ShareButton({ title, description, url = window.location.href }: ShareButtonProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const shareText = `${title}\n\n${description}\n\nLearn more: ${url}`;
  const emailSubject = encodeURIComponent(title);
  const emailBody = encodeURIComponent(
    `Hi!\n\nI wanted to share this with you: ${title}\n\n${description}\n\nYou can learn more here: ${url}\n\nBest regards`
  );

  const handleEmailShare = () => {
    window.open(`mailto:?subject=${emailSubject}&body=${emailBody}`, '_blank');
    setIsOpen(false);
  };

  const handleWhatsAppShare = () => {
    const whatsappText = encodeURIComponent(shareText);
    window.open(`https://wa.me/?text=${whatsappText}`, '_blank');
    setIsOpen(false);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: 'Link Copied!',
        description: 'The link has been copied to your clipboard.',
      });
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Could not copy link to clipboard.',
        variant: 'destructive',
      });
    }
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleEmailShare}>
          <Mail className="h-4 w-4 mr-2" />
          Share via Email
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleWhatsAppShare}>
          <MessageCircle className="h-4 w-4 mr-2" />
          Share on WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyLink}>
          <Copy className="h-4 w-4 mr-2" />
          Copy Link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
