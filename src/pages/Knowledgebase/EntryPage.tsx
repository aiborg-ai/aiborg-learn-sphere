/**
 * Knowledgebase Entry Page
 * Displays a single knowledgebase entry with full content
 */

import { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  TrendingUp,
  Tag,
  Share2,
  MapPin,
  Globe,
  Users,
  Building2,
  FileText,
  ExternalLink,
  Award,
} from '@/components/ui/icons';
import { useToast } from '@/hooks/use-toast';
import {
  useKnowledgebaseEntry,
  useRelatedKnowledgebaseEntries,
} from '@/hooks/knowledgebase/useKnowledgebaseEntries';
import { KnowledgebaseService } from '@/services/knowledgebase';
import { getTopicConfig, type KnowledgebaseTopicType } from '@/types/knowledgebase';
import { EntryCard } from './components/EntryCard';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const IconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Users: Users,
  Calendar: Calendar,
  Building2: Building2,
  FileText: FileText,
};

export default function EntryPage() {
  const { topic, slug } = useParams<{ topic: KnowledgebaseTopicType; slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: entry, isLoading, error } = useKnowledgebaseEntry(slug);
  const { data: relatedEntries = [] } = useRelatedKnowledgebaseEntries(entry || null, 4);

  const topicConfig = topic ? getTopicConfig(topic) : undefined;
  const TopicIcon = topicConfig ? IconMap[topicConfig.icon] || BookOpen : BookOpen;

  // Increment view count on mount
  useEffect(() => {
    if (entry?.id) {
      KnowledgebaseService.incrementViewCount(entry.id);
    }
  }, [entry?.id]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: entry?.title,
          text: entry?.excerpt || '',
          url: window.location.href,
        });
      } catch {
        // User cancelled share
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'Link copied!',
        description: 'Entry link copied to clipboard',
      });
    }
  };

  // Render metadata sidebar based on topic type
  const renderMetadataSidebar = () => {
    if (!entry) return null;
    const metadata = entry.metadata as Record<string, unknown>;

    switch (entry.topic_type) {
      case 'pioneers':
        return (
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Users className="h-4 w-4" />
                Pioneer Info
              </h3>
              <div className="space-y-2 text-sm">
                {metadata?.specialty && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Specialty</span>
                    <span>{String(metadata.specialty)}</span>
                  </div>
                )}
                {metadata?.country && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Country</span>
                    <span>{String(metadata.country)}</span>
                  </div>
                )}
                {metadata?.birth_year && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Born</span>
                    <span>{String(metadata.birth_year)}</span>
                  </div>
                )}
                {Array.isArray(metadata?.affiliations) && metadata.affiliations.length > 0 && (
                  <div>
                    <span className="text-muted-foreground">Affiliations</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(metadata.affiliations as string[]).map(aff => (
                        <Badge key={aff} variant="outline" className="text-xs">
                          {aff}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {Array.isArray(metadata?.awards) && metadata.awards.length > 0 && (
                  <div>
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Award className="h-3 w-3" />
                      Awards
                    </span>
                    <ul className="mt-1 text-xs space-y-1">
                      {(metadata.awards as string[]).map((award, i) => (
                        <li key={i}>• {award}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case 'events':
        return (
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Event Details
              </h3>
              <div className="space-y-2 text-sm">
                {metadata?.start_date && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Start Date</span>
                    <span>{format(new Date(String(metadata.start_date)), 'MMM d, yyyy')}</span>
                  </div>
                )}
                {metadata?.end_date && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">End Date</span>
                    <span>{format(new Date(String(metadata.end_date)), 'MMM d, yyyy')}</span>
                  </div>
                )}
                {metadata?.location && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Location
                    </span>
                    <span>{String(metadata.location)}</span>
                  </div>
                )}
                {metadata?.venue && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Venue</span>
                    <span>{String(metadata.venue)}</span>
                  </div>
                )}
                {metadata?.is_virtual && (
                  <Badge variant="secondary" className="text-xs">
                    Virtual Event
                  </Badge>
                )}
                {metadata?.website && (
                  <Button variant="outline" size="sm" className="w-full mt-2" asChild>
                    <a href={String(metadata.website)} target="_blank" rel="noopener noreferrer">
                      <Globe className="h-4 w-4 mr-2" />
                      Website
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case 'companies':
        return (
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Company Info
              </h3>
              <div className="space-y-2 text-sm">
                {metadata?.founded_year && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Founded</span>
                    <span>{String(metadata.founded_year)}</span>
                  </div>
                )}
                {metadata?.headquarters && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">HQ</span>
                    <span>{String(metadata.headquarters)}</span>
                  </div>
                )}
                {metadata?.employees && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Employees</span>
                    <span>{String(metadata.employees)}</span>
                  </div>
                )}
                {metadata?.funding && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Funding</span>
                    <span>{String(metadata.funding)}</span>
                  </div>
                )}
                {metadata?.ceo && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">CEO</span>
                    <span>{String(metadata.ceo)}</span>
                  </div>
                )}
                {Array.isArray(metadata?.products) && metadata.products.length > 0 && (
                  <div>
                    <span className="text-muted-foreground">Products</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(metadata.products as string[]).map(prod => (
                        <Badge key={prod} variant="outline" className="text-xs">
                          {prod}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {metadata?.website && (
                  <Button variant="outline" size="sm" className="w-full mt-2" asChild>
                    <a href={String(metadata.website)} target="_blank" rel="noopener noreferrer">
                      <Globe className="h-4 w-4 mr-2" />
                      Website
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case 'research':
        return (
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Paper Info
              </h3>
              <div className="space-y-2 text-sm">
                {Array.isArray(metadata?.authors) && metadata.authors.length > 0 && (
                  <div>
                    <span className="text-muted-foreground">Authors</span>
                    <p className="text-xs mt-1">{(metadata.authors as string[]).join(', ')}</p>
                  </div>
                )}
                {metadata?.publication_date && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Published</span>
                    <span>
                      {format(new Date(String(metadata.publication_date)), 'MMM d, yyyy')}
                    </span>
                  </div>
                )}
                {metadata?.journal && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Journal</span>
                    <span className="text-xs">{String(metadata.journal)}</span>
                  </div>
                )}
                {metadata?.citations && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Citations</span>
                    <span>{String(metadata.citations)}</span>
                  </div>
                )}
                {metadata?.doi && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">DOI</span>
                    <a
                      href={`https://doi.org/${metadata.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-xs"
                    >
                      {String(metadata.doi)}
                    </a>
                  </div>
                )}
                {metadata?.pdf_url && (
                  <Button variant="outline" size="sm" className="w-full mt-2" asChild>
                    <a href={String(metadata.pdf_url)} target="_blank" rel="noopener noreferrer">
                      <FileText className="h-4 w-4 mr-2" />
                      View PDF
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md text-center">
          <CardContent className="py-12">
            <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Entry not found</h2>
            <p className="text-muted-foreground mb-6">
              The entry you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => navigate(`/knowledgebase/${topic || ''}`)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to {topicConfig?.label || 'Knowledgebase'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-muted/30">
        <div className="container max-w-7xl mx-auto px-4 py-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/knowledgebase/${topic}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to {topicConfig?.label}
            </Link>
          </Button>
        </div>
      </div>

      <article className="container max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[1fr_300px] gap-12">
          {/* Main Content */}
          <div className="max-w-4xl">
            {/* Breadcrumbs */}
            <nav className="mb-6 text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
              <Link to="/knowledgebase" className="hover:text-foreground">
                Knowledgebase
              </Link>
              <span>/</span>
              <Link to={`/knowledgebase/${topic}`} className="hover:text-foreground">
                {topicConfig?.label}
              </Link>
              <span>/</span>
              <span className="text-foreground">{entry.title}</span>
            </nav>

            {/* Entry Header */}
            <header className="mb-8 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {topicConfig && (
                  <Badge className={`${topicConfig.bgColor} ${topicConfig.color}`}>
                    {topicConfig.label}
                  </Badge>
                )}
                {entry.is_featured && <Badge variant="secondary">Featured</Badge>}
                {entry.view_count > 0 && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    <span>{entry.view_count} views</span>
                  </div>
                )}
              </div>

              <h1 className="text-4xl md:text-5xl font-bold leading-tight">{entry.title}</h1>

              {entry.excerpt && (
                <p className="text-xl text-muted-foreground leading-relaxed">{entry.excerpt}</p>
              )}

              {/* Featured Image */}
              {entry.featured_image && (
                <div className="aspect-video overflow-hidden rounded-lg">
                  <img
                    src={entry.featured_image}
                    alt={entry.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="flex items-center gap-4 text-sm text-muted-foreground pt-4 border-t">
                {entry.published_at && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Published {format(new Date(entry.published_at), 'MMMM d, yyyy')}</span>
                  </div>
                )}
                <Button variant="ghost" size="sm" onClick={handleShare} className="ml-auto">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </header>

            {/* Entry Content */}
            <div className="prose prose-lg max-w-none mb-12">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{entry.content}</ReactMarkdown>
            </div>

            {/* Tags */}
            {entry.tags && entry.tags.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-semibold text-muted-foreground">TAGS</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {entry.tags.map(tag => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Separator className="my-8" />

            {/* Related Entries */}
            {relatedEntries.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-6">Related Entries</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {relatedEntries.map(related => (
                    <EntryCard key={related.id} entry={related} />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:sticky lg:top-4 lg:self-start space-y-6">
            {renderMetadataSidebar()}

            {/* Quick Info */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-sm">Entry Info</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Topic</span>
                    <Badge variant="outline" className="text-xs">
                      {topicConfig?.label}
                    </Badge>
                  </div>
                  {entry.published_at && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Published</span>
                      <span>{format(new Date(entry.published_at), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Views</span>
                    <span>{entry.view_count || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </article>
    </div>
  );
}
