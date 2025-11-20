import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Search } from '@/components/ui/icons';

interface SEOSettingsProps {
  metaTitle: string;
  metaDescription: string;
  seoKeywords: string;
  canonicalUrl: string;
  onChange: (field: string, value: string) => void;
}

export function SEOSettings({
  metaTitle,
  metaDescription,
  seoKeywords,
  canonicalUrl,
  onChange,
}: SEOSettingsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          SEO Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="meta_title">Meta Title</Label>
          <Input
            id="meta_title"
            value={metaTitle}
            onChange={e => onChange('meta_title', e.target.value)}
            placeholder="SEO title (max 60 characters)"
            maxLength={60}
          />
          <p className="text-xs text-muted-foreground mt-1">{metaTitle.length}/60 characters</p>
        </div>

        <div>
          <Label htmlFor="meta_description">Meta Description</Label>
          <Textarea
            id="meta_description"
            value={metaDescription}
            onChange={e => onChange('meta_description', e.target.value)}
            placeholder="SEO description (max 160 characters)"
            maxLength={160}
            rows={3}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {metaDescription.length}/160 characters
          </p>
        </div>

        <div>
          <Label htmlFor="seo_keywords">SEO Keywords</Label>
          <Input
            id="seo_keywords"
            value={seoKeywords}
            onChange={e => onChange('seo_keywords', e.target.value)}
            placeholder="keyword1, keyword2, keyword3"
          />
        </div>

        <div>
          <Label htmlFor="canonical_url">Canonical URL</Label>
          <Input
            id="canonical_url"
            value={canonicalUrl}
            onChange={e => onChange('canonical_url', e.target.value)}
            placeholder="https://example.com/original-post"
          />
        </div>
      </CardContent>
    </Card>
  );
}
