/**
 * Graph Analytics
 *
 * Display statistics and validation results for the knowledge graph
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  BarChart3,
  Network,
  GitBranch,
  AlertCircle,
  CheckCircle,
  Info,
  RefreshCw,
} from 'lucide-react';
import { KnowledgeGraphService } from '@/services/knowledge-graph';
import { logger } from '@/utils/logger';
import type { Concept, ConceptRelationship, GraphValidationResult } from '@/types/knowledge-graph';

export function GraphAnalytics() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [relationships, setRelationships] = useState<ConceptRelationship[]>([]);
  const [validation, setValidation] = useState<GraphValidationResult | null>(null);

  // Stats
  const [stats, setStats] = useState({
    totalConcepts: 0,
    conceptsByType: {} as Record<string, number>,
    conceptsByDifficulty: {} as Record<string, number>,
    totalRelationships: 0,
    relationshipsByType: {} as Record<string, number>,
    averageRelationships: 0,
    orphanedConcepts: 0,
    mostConnectedConcepts: [] as Array<{ concept: Concept; count: number }>,
  });

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const conceptsData = await KnowledgeGraphService.getConcepts({ is_active: true });
      const relationshipsData = await loadAllRelationships();

      setConcepts(conceptsData);
      setRelationships(relationshipsData);

      calculateStats(conceptsData, relationshipsData);
    } catch (_error) {
      logger.error('Error loading data:', _error);
      toast({
        title: 'Error',
        description: 'Failed to load analytics data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAllRelationships = async (): Promise<ConceptRelationship[]> => {
    const conceptsData = await KnowledgeGraphService.getConcepts({ is_active: true });
    const allRelationships: ConceptRelationship[] = [];
    const seen = new Set<string>();

    for (const concept of conceptsData) {
      const rels = await KnowledgeGraphService.getRelationships(concept.id);
      for (const rel of rels) {
        if (!seen.has(rel.id)) {
          seen.add(rel.id);
          allRelationships.push(rel);
        }
      }
    }

    return allRelationships;
  };

  const calculateStats = (conceptsData: Concept[], relationshipsData: ConceptRelationship[]) => {
    // Concepts by type
    const conceptsByType: Record<string, number> = {};
    conceptsData.forEach(c => {
      conceptsByType[c.type] = (conceptsByType[c.type] || 0) + 1;
    });

    // Concepts by difficulty
    const conceptsByDifficulty: Record<string, number> = {};
    conceptsData.forEach(c => {
      conceptsByDifficulty[c.difficulty_level] =
        (conceptsByDifficulty[c.difficulty_level] || 0) + 1;
    });

    // Relationships by type
    const relationshipsByType: Record<string, number> = {};
    relationshipsData.forEach(r => {
      relationshipsByType[r.relationship_type] =
        (relationshipsByType[r.relationship_type] || 0) + 1;
    });

    // Connection counts
    const connectionCounts = new Map<string, number>();
    relationshipsData.forEach(r => {
      connectionCounts.set(
        r.source_concept_id,
        (connectionCounts.get(r.source_concept_id) || 0) + 1
      );
      connectionCounts.set(
        r.target_concept_id,
        (connectionCounts.get(r.target_concept_id) || 0) + 1
      );
    });

    // Orphaned concepts (no relationships)
    const orphanedConcepts = conceptsData.filter(c => !connectionCounts.has(c.id)).length;

    // Most connected concepts
    const mostConnected = Array.from(connectionCounts.entries())
      .map(([conceptId, count]) => ({
        concept: conceptsData.find(c => c.id === conceptId)!,
        count,
      }))
      .filter(item => item.concept)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Average relationships per concept
    const averageRelationships =
      conceptsData.length > 0 ? relationshipsData.length / conceptsData.length : 0;

    setStats({
      totalConcepts: conceptsData.length,
      conceptsByType,
      conceptsByDifficulty,
      totalRelationships: relationshipsData.length,
      relationshipsByType,
      averageRelationships,
      orphanedConcepts,
      mostConnectedConcepts: mostConnected,
    });
  };

  const handleValidate = async () => {
    setValidating(true);
    try {
      const result = await KnowledgeGraphService.validateGraph();
      setValidation(result);

      if (result.isValid) {
        toast({
          title: 'Validation Successful',
          description: 'Knowledge graph is valid with no errors',
        });
      } else {
        toast({
          title: 'Validation Issues Found',
          description: `Found ${result.errors.length} errors and ${result.warnings.length} warnings`,
          variant: 'destructive',
        });
      }
    } catch (_error) {
      logger.error('Error validating graph:', _error);
      toast({
        title: 'Error',
        description: 'Failed to validate knowledge graph',
        variant: 'destructive',
      });
    } finally {
      setValidating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-muted-foreground">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Knowledge Graph Analytics</h3>
          <p className="text-sm text-muted-foreground">
            Overview and validation of the knowledge graph
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleValidate} disabled={validating}>
            {validating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Validating...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Validate Graph
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Validation Results */}
      {validation && (
        <Alert variant={validation.isValid ? 'default' : 'destructive'}>
          {validation.isValid ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>
            {validation.isValid ? (
              <div>
                <p className="font-semibold">Graph is valid</p>
                {validation.warnings.length > 0 && (
                  <p className="text-sm mt-1">{validation.warnings.length} warning(s) found</p>
                )}
              </div>
            ) : (
              <div>
                <p className="font-semibold">
                  Found {validation.errors.length} error(s) and {validation.warnings.length}{' '}
                  warning(s)
                </p>
                {validation.errors.map((error, i) => (
                  <p key={i} className="text-sm mt-1">
                    • {error.message}
                  </p>
                ))}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Concepts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Concepts</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalConcepts}</div>
            <p className="text-xs text-muted-foreground">Learning concepts in the graph</p>
          </CardContent>
        </Card>

        {/* Total Relationships */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Relationships</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRelationships}</div>
            <p className="text-xs text-muted-foreground">
              Avg {stats.averageRelationships.toFixed(1)} per concept
            </p>
          </CardContent>
        </Card>

        {/* Orphaned Concepts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orphaned</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.orphanedConcepts}</div>
            <p className="text-xs text-muted-foreground">Concepts with no relationships</p>
          </CardContent>
        </Card>

        {/* Course Mappings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Graph Health</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {validation ? (validation.isValid ? '✓' : '✗') : '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              {validation
                ? validation.isValid
                  ? 'No errors detected'
                  : `${validation.errors.length} errors`
                : 'Not validated'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Concepts Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Type */}
        <Card>
          <CardHeader>
            <CardTitle>Concepts by Type</CardTitle>
            <CardDescription>Distribution of concept types</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(stats.conceptsByType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{type}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{
                          width: `${(count / stats.totalConcepts) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-12 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* By Difficulty */}
        <Card>
          <CardHeader>
            <CardTitle>Concepts by Difficulty</CardTitle>
            <CardDescription>Learning level distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(stats.conceptsByDifficulty).map(([difficulty, count]) => (
                <div key={difficulty} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{difficulty}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500"
                        style={{
                          width: `${(count / stats.totalConcepts) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-12 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Relationships Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Relationships by Type</CardTitle>
          <CardDescription>Distribution of relationship types</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(stats.relationshipsByType).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{type.replace('_', ' ')}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500"
                      style={{
                        width: `${(count / stats.totalRelationships) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium w-12 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Most Connected Concepts */}
      <Card>
        <CardHeader>
          <CardTitle>Most Connected Concepts</CardTitle>
          <CardDescription>Concepts with the most relationships (hubs)</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.mostConnectedConcepts.length > 0 ? (
            <div className="space-y-2">
              {stats.mostConnectedConcepts.map(({ concept, count }, i) => (
                <div key={concept.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground w-6">{i + 1}.</span>
                    <span className="font-medium">{concept.name}</span>
                    <Badge variant="outline">{concept.type}</Badge>
                  </div>
                  <Badge>{count} connections</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No concepts with relationships yet</p>
          )}
        </CardContent>
      </Card>

      {/* Warnings */}
      {validation && validation.warnings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Warnings</CardTitle>
            <CardDescription>
              Issues that don't prevent the graph from working but should be addressed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {validation.warnings.map((warning, i) => (
                <Alert key={i}>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <span className="font-semibold">{warning.type}: </span>
                    {warning.message}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
