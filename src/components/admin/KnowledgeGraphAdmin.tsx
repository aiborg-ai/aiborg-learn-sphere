/**
 * Knowledge Graph Admin
 *
 * Main admin interface for managing the knowledge graph system:
 * - Concepts (graph nodes)
 * - Relationships (graph edges)
 * - Course mappings
 * - Analytics and validation
 */

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Network, GitBranch, BookOpen, BarChart3, Info, Sparkles } from 'lucide-react';
import { ConceptsManager } from './knowledge-graph/ConceptsManager';
import { RelationshipsManager } from './knowledge-graph/RelationshipsManager';
import { CourseMappingManager } from './knowledge-graph/CourseMappingManager';
import { GraphAnalytics } from './knowledge-graph/GraphAnalytics';
import { AISuggestionsReview } from './knowledge-graph/AISuggestionsReview';

export function KnowledgeGraphAdmin() {
  const [activeTab, setActiveTab] = useState('concepts');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Network className="h-8 w-8" />
          Knowledge Graph
        </h2>
        <p className="text-muted-foreground mt-2">
          Manage learning concepts, relationships, prerequisites, and skill mastery tracking
        </p>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          The knowledge graph tracks relationships between learning concepts, validates
          prerequisites, and powers personalized learning recommendations. Changes here affect
          course enrollment requirements and user skill tracking.
        </AlertDescription>
      </Alert>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="concepts" className="flex items-center gap-2">
            <Network className="h-4 w-4" />
            Concepts
          </TabsTrigger>
          <TabsTrigger value="relationships" className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Relationships
          </TabsTrigger>
          <TabsTrigger value="course-mapping" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Course Mapping
          </TabsTrigger>
          <TabsTrigger value="ai-suggestions" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            AI Suggestions
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Concepts Tab */}
        <TabsContent value="concepts" className="space-y-4">
          <ConceptsManager />
        </TabsContent>

        {/* Relationships Tab */}
        <TabsContent value="relationships" className="space-y-4">
          <RelationshipsManager />
        </TabsContent>

        {/* Course Mapping Tab */}
        <TabsContent value="course-mapping" className="space-y-4">
          <CourseMappingManager />
        </TabsContent>

        {/* AI Suggestions Tab */}
        <TabsContent value="ai-suggestions" className="space-y-4">
          <AISuggestionsReview />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <GraphAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
}
