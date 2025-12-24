// ============================================================================
// AI-Readiness Assessment PDF Report
// Generates downloadable PDF report with scores, dimensions, and recommendations
// ============================================================================

import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type {
  AIReadinessAssessment,
  ReadinessRecommendation,
  DimensionScore,
  MaturityLevel,
} from '@/types/aiReadiness';

interface PDFReportProps {
  assessment: AIReadinessAssessment;
  dimensionScores: DimensionScore[];
  recommendations: ReadinessRecommendation[];
}

// Define styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#FFFFFF',
  },
  header: {
    marginBottom: 30,
    borderBottom: '2 solid #3B82F6',
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#1E293B',
    marginBottom: 12,
    borderBottom: '1 solid #E2E8F0',
    paddingBottom: 6,
  },
  scoreCard: {
    backgroundColor: '#F8FAFC',
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
    border: '2 solid #E2E8F0',
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  scoreLabel: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Helvetica',
  },
  scoreValue: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#1E293B',
  },
  maturityBadge: {
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    padding: '6 12',
    borderRadius: 4,
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  dimensionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottom: '1 solid #F1F5F9',
  },
  dimensionName: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#1E293B',
    flex: 1,
  },
  dimensionScore: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#3B82F6',
    width: 50,
    textAlign: 'right',
  },
  dimensionLevel: {
    fontSize: 9,
    color: '#64748B',
    width: 80,
    textAlign: 'right',
    marginLeft: 10,
  },
  progressBar: {
    width: 100,
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    marginLeft: 10,
    position: 'relative',
  },
  progressFill: {
    height: 6,
    backgroundColor: '#3B82F6',
    borderRadius: 3,
  },
  recommendationCard: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    marginBottom: 10,
    borderRadius: 4,
    border: '1 solid #E2E8F0',
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  recommendationTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#1E293B',
    flex: 1,
  },
  priorityBadge: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
    padding: '2 6',
    borderRadius: 3,
    textTransform: 'uppercase',
  },
  recommendationDescription: {
    fontSize: 9,
    color: '#64748B',
    marginBottom: 6,
    lineHeight: 1.4,
  },
  recommendationMeta: {
    flexDirection: 'row',
    gap: 12,
    fontSize: 8,
    color: '#94A3B8',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: '#94A3B8',
    textAlign: 'center',
    borderTop: '1 solid #E2E8F0',
    paddingTop: 10,
  },
  pageNumber: {
    fontSize: 8,
    color: '#94A3B8',
    textAlign: 'right',
  },
  insightBox: {
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 4,
    marginBottom: 15,
    border: '1 solid #BFDBFE',
  },
  insightText: {
    fontSize: 9,
    color: '#1E40AF',
    lineHeight: 1.4,
  },
});

// Helper function to get maturity level color
const getMaturityColor = (level: MaturityLevel): string => {
  const colors = {
    awareness: '#F43F5E',
    experimenting: '#F59E0B',
    adopting: '#3B82F6',
    optimizing: '#10B981',
    leading: '#8B5CF6',
  };
  return colors[level] || '#3B82F6';
};

// Helper function to get maturity level label
const getMaturityLabel = (level: MaturityLevel): string => {
  const labels = {
    awareness: 'AI Awareness',
    experimenting: 'Experimenting',
    adopting: 'Adopting',
    optimizing: 'Optimizing',
    leading: 'AI Leader',
  };
  return labels[level] || level;
};

// Helper function to get score level
const getScoreLevel = (score: number): string => {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  if (score >= 20) return 'Developing';
  return 'Needs Focus';
};

// Helper function to get priority color
const getPriorityColor = (priority: string): string => {
  const colors = {
    critical: '#DC2626',
    high: '#F59E0B',
    medium: '#3B82F6',
    low: '#6B7280',
  };
  return colors[priority] || '#3B82F6';
};

// Helper function to get dimension label
const getDimensionLabel = (dimension: string): string => {
  const labels = {
    strategic: 'Strategic Alignment',
    data: 'Data Maturity',
    tech: 'Technical Infrastructure',
    human: 'Human Capital',
    process: 'Process Maturity',
    change: 'Change Readiness',
  };
  return labels[dimension] || dimension;
};

export function PDFReport({ assessment, dimensionScores, recommendations }: PDFReportProps) {
  const maturityColor = getMaturityColor(assessment.maturity_level || 'awareness');
  const dimensionData = dimensionScores.filter(d => d.dimension !== 'overall');

  // Organize recommendations by timeframe
  const quickWins = recommendations.filter(r => r.timeframe === 'quick_win');
  const shortTerm = recommendations.filter(r => r.timeframe === 'short_term');
  const mediumTerm = recommendations.filter(r => r.timeframe === 'medium_term');
  const longTerm = recommendations.filter(r => r.timeframe === 'long_term');

  const completedDate = assessment.completed_at
    ? new Date(assessment.completed_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'N/A';

  return (
    <Document>
      {/* Cover Page / Overview */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>AI-Readiness Assessment Report</Text>
          <Text style={styles.subtitle}>
            {assessment.company_name && `${assessment.company_name} • `}
            Completed on {completedDate}
          </Text>
          {assessment.industry && (
            <Text style={styles.subtitle}>Industry: {assessment.industry}</Text>
          )}
          {assessment.company_size && (
            <Text style={styles.subtitle}>Company Size: {assessment.company_size}</Text>
          )}
        </View>

        {/* Overall Score */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overall Readiness Score</Text>
          <View style={styles.scoreCard}>
            <View style={styles.scoreRow}>
              <Text style={styles.scoreLabel}>Overall AI-Readiness Score</Text>
              <Text style={styles.scoreValue}>
                {Math.round(assessment.overall_readiness_score || 0)}/100
              </Text>
            </View>
            <View style={{ ...styles.maturityBadge, backgroundColor: maturityColor }}>
              <Text>
                {getMaturityLabel(assessment.maturity_level || 'awareness')} (Level{' '}
                {assessment.maturity_level === 'awareness' && '1'}
                {assessment.maturity_level === 'experimenting' && '2'}
                {assessment.maturity_level === 'adopting' && '3'}
                {assessment.maturity_level === 'optimizing' && '4'}
                {assessment.maturity_level === 'leading' && '5'} of 5)
              </Text>
            </View>
            {assessment.industry_percentile !== undefined &&
              assessment.industry_percentile !== null && (
                <View style={{ marginTop: 12 }}>
                  <Text style={styles.scoreLabel}>
                    Industry Ranking: {Math.round(assessment.industry_percentile)}th percentile
                  </Text>
                  <Text style={{ fontSize: 9, color: '#64748B', marginTop: 4 }}>
                    You score higher than {Math.round(assessment.industry_percentile)}% of
                    organizations in your industry
                  </Text>
                </View>
              )}
          </View>
        </View>

        {/* Key Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Insights</Text>
          <View style={styles.insightBox}>
            <Text style={styles.insightText}>
              📊 Your organization is at the{' '}
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>
                {getMaturityLabel(assessment.maturity_level || 'awareness')}
              </Text>{' '}
              stage of AI adoption.
            </Text>
          </View>
          <View style={styles.insightBox}>
            <Text style={styles.insightText}>
              🎯 Focus Area: We've identified{' '}
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>
                {
                  recommendations.filter(r => r.priority === 'critical' || r.priority === 'high')
                    .length
                }{' '}
                high-priority recommendations
              </Text>{' '}
              to accelerate your AI journey.
            </Text>
          </View>
          <View style={styles.insightBox}>
            <Text style={styles.insightText}>
              ⚡ Quick Wins: Start with{' '}
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>
                {quickWins.length} quick win recommendations
              </Text>{' '}
              (0-3 months) to build momentum.
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Generated by AiBorg LearnSphere • {new Date().toLocaleDateString()}</Text>
        </View>
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          fixed
        />
      </Page>

      {/* Dimension Breakdown Page */}
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dimension Breakdown</Text>
          <Text style={{ fontSize: 10, color: '#64748B', marginBottom: 15 }}>
            Your performance across the 6 AI-Readiness dimensions
          </Text>

          {dimensionData
            .sort((a, b) => b.score - a.score)
            .map(dimension => (
              <View key={dimension.dimension} style={styles.dimensionRow}>
                <Text style={styles.dimensionName}>{getDimensionLabel(dimension.dimension)}</Text>
                <View style={styles.progressBar}>
                  <View
                    style={{
                      ...styles.progressFill,
                      width: `${dimension.score}%`,
                    }}
                  />
                </View>
                <Text style={styles.dimensionScore}>{Math.round(dimension.score)}%</Text>
                <Text style={styles.dimensionLevel}>{getScoreLevel(dimension.score)}</Text>
              </View>
            ))}
        </View>

        {/* Summary Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Summary</Text>
          <View style={{ flexDirection: 'row', gap: 15, marginTop: 10 }}>
            <View style={{ flex: 1, backgroundColor: '#F0FDF4', padding: 10, borderRadius: 4 }}>
              <Text style={{ fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#166534' }}>
                {dimensionData.filter(d => d.score >= 60).length}
              </Text>
              <Text style={{ fontSize: 9, color: '#166534', marginTop: 2 }}>Strong Dimensions</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: '#FEF3C7', padding: 10, borderRadius: 4 }}>
              <Text style={{ fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#92400E' }}>
                {dimensionData.filter(d => d.score >= 40 && d.score < 60).length}
              </Text>
              <Text style={{ fontSize: 9, color: '#92400E', marginTop: 2 }}>Developing</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: '#FEE2E2', padding: 10, borderRadius: 4 }}>
              <Text style={{ fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#991B1B' }}>
                {dimensionData.filter(d => d.score < 40).length}
              </Text>
              <Text style={{ fontSize: 9, color: '#991B1B', marginTop: 2 }}>Need Focus</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Generated by AiBorg LearnSphere • {new Date().toLocaleDateString()}</Text>
        </View>
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          fixed
        />
      </Page>

      {/* Recommendations Pages */}
      {[
        { title: 'Quick Wins (0-3 months)', items: quickWins },
        { title: 'Short Term (3-6 months)', items: shortTerm },
        { title: 'Medium Term (6-12 months)', items: mediumTerm },
        { title: 'Long Term (12+ months)', items: longTerm },
      ].map(
        ({ title, items }) =>
          items.length > 0 && (
            <Page key={title} size="A4" style={styles.page}>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{title}</Text>
                <Text style={{ fontSize: 10, color: '#64748B', marginBottom: 15 }}>
                  {items.length} recommendation{items.length !== 1 ? 's' : ''} for this timeframe
                </Text>

                {items.map(rec => (
                  <View key={rec.id} style={styles.recommendationCard}>
                    <View style={styles.recommendationHeader}>
                      <Text style={styles.recommendationTitle}>{rec.title}</Text>
                      <View
                        style={{
                          ...styles.priorityBadge,
                          backgroundColor: getPriorityColor(rec.priority),
                        }}
                      >
                        <Text>{rec.priority.toUpperCase()}</Text>
                      </View>
                    </View>
                    <Text style={styles.recommendationDescription}>{rec.description}</Text>
                    <View style={styles.recommendationMeta}>
                      <Text>⚡ Effort: {rec.estimated_effort}</Text>
                      <Text>💰 Cost: {rec.estimated_cost_range}</Text>
                      {rec.required_resources.length > 0 && (
                        <Text>👥 Resources: {rec.required_resources.length}</Text>
                      )}
                    </View>
                    {rec.expected_impact && (
                      <View style={{ marginTop: 8, paddingTop: 8, borderTop: '1 solid #E2E8F0' }}>
                        <Text style={{ fontSize: 8, color: '#64748B', marginBottom: 3 }}>
                          Expected Impact:
                        </Text>
                        <Text style={{ fontSize: 9, color: '#1E293B' }}>{rec.expected_impact}</Text>
                      </View>
                    )}
                    {rec.success_metrics.length > 0 && (
                      <View style={{ marginTop: 6 }}>
                        <Text style={{ fontSize: 8, color: '#64748B', marginBottom: 3 }}>
                          Success Metrics:
                        </Text>
                        {rec.success_metrics.slice(0, 3).map((metric, idx) => (
                          <Text
                            key={idx}
                            style={{ fontSize: 8, color: '#1E293B', marginBottom: 2 }}
                          >
                            • {metric}
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <Text>Generated by AiBorg LearnSphere • {new Date().toLocaleDateString()}</Text>
              </View>
              <Text
                style={styles.pageNumber}
                render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
                fixed
              />
            </Page>
          )
      )}

      {/* Final Summary Page */}
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Next Steps</Text>
          <View style={styles.insightBox}>
            <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#1E40AF' }}>
              💡 Recommended Action Plan
            </Text>
            <Text style={{ ...styles.insightText, marginTop: 6 }}>
              1. Focus on Quick Wins first to build momentum and demonstrate value
            </Text>
            <Text style={{ ...styles.insightText, marginTop: 4 }}>
              2. Use early successes to secure buy-in for longer-term initiatives
            </Text>
            <Text style={{ ...styles.insightText, marginTop: 4 }}>
              3. Prioritize critical and high-priority recommendations
            </Text>
            <Text style={{ ...styles.insightText, marginTop: 4 }}>
              4. Establish metrics to track progress and measure impact
            </Text>
            <Text style={{ ...styles.insightText, marginTop: 4 }}>
              5. Reassess your AI-Readiness every 6-12 months to track improvement
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assessment Summary</Text>
          <View style={{ fontSize: 9, color: '#64748B', lineHeight: 1.6 }}>
            <Text style={{ marginBottom: 6 }}>
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>Overall Score:</Text>{' '}
              {Math.round(assessment.overall_readiness_score || 0)}/100
            </Text>
            <Text style={{ marginBottom: 6 }}>
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>Maturity Level:</Text>{' '}
              {getMaturityLabel(assessment.maturity_level || 'awareness')}
            </Text>
            <Text style={{ marginBottom: 6 }}>
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>Total Recommendations:</Text>{' '}
              {recommendations.length}
            </Text>
            <Text style={{ marginBottom: 6 }}>
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>Critical/High Priority:</Text>{' '}
              {
                recommendations.filter(r => r.priority === 'critical' || r.priority === 'high')
                  .length
              }
            </Text>
            <Text style={{ marginBottom: 6 }}>
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>Strongest Dimension:</Text>{' '}
              {getDimensionLabel(dimensionData[0]?.dimension || '')} (
              {Math.round(dimensionData[0]?.score || 0)}%)
            </Text>
            <Text style={{ marginBottom: 6 }}>
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>Biggest Opportunity:</Text>{' '}
              {getDimensionLabel(dimensionData[dimensionData.length - 1]?.dimension || '')} (
              {Math.round(dimensionData[dimensionData.length - 1]?.score || 0)}%)
            </Text>
          </View>
        </View>

        <View
          style={{
            marginTop: 40,
            padding: 15,
            backgroundColor: '#F8FAFC',
            borderRadius: 4,
            border: '1 solid #E2E8F0',
          }}
        >
          <Text style={{ fontSize: 10, color: '#1E293B', textAlign: 'center' }}>
            Thank you for completing the AI-Readiness Assessment!
          </Text>
          <Text style={{ fontSize: 9, color: '#64748B', textAlign: 'center', marginTop: 6 }}>
            For questions or support in implementing these recommendations, contact your AiBorg
            LearnSphere representative.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Generated by AiBorg LearnSphere • {new Date().toLocaleDateString()}</Text>
        </View>
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
}
