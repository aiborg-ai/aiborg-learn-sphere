/**
 * Skills Dashboard Component
 *
 * Comprehensive skills tracking dashboard with:
 * - Personal skill inventory
 * - Career goal matching
 * - AI-powered recommendations
 * - Peer benchmarking
 * - Trending skills
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Brain,
  Target,
  TrendingUp,
  Award,
  BookOpen,
  Briefcase,
  ChevronRight,
  X,
  RefreshCw,
  Zap,
  CheckCircle,
  AlertCircle,
  Star,
} from '@/components/ui/icons';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  SkillExtractionService,
  type IndustrySkill,
  type UserSkill,
  type SkillRecommendation,
  type JobRole,
  type JobRoleMatch,
} from '@/services/skills/SkillExtractionService';
import { logger } from '@/utils/logger';

const proficiencyColors: Record<string, string> = {
  awareness: 'bg-gray-200 text-gray-700',
  foundational: 'bg-blue-200 text-blue-700',
  intermediate: 'bg-green-200 text-green-700',
  advanced: 'bg-purple-200 text-purple-700',
  expert: 'bg-yellow-200 text-yellow-700',
};

const _proficiencyLevels = ['awareness', 'foundational', 'intermediate', 'advanced', 'expert'];

export function SkillsDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  const [recommendations, setRecommendations] = useState<SkillRecommendation[]>([]);
  const [trendingSkills, setTrendingSkills] = useState<IndustrySkill[]>([]);
  const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
  const [selectedJobRole, setSelectedJobRole] = useState<string>('');
  const [jobMatch, setJobMatch] = useState<JobRoleMatch | null>(null);
  const [categorySummary, setCategorySummary] = useState<
    Record<
      string,
      {
        total: number;
        average_score: number;
        skills: UserSkill[];
      }
    >
  >({});

  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (user?.id && selectedJobRole) {
      loadJobMatch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, selectedJobRole]);

  const loadDashboardData = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const [skills, recs, trending, roles, summary] = await Promise.all([
        SkillExtractionService.getUserSkills(user.id),
        SkillExtractionService.getRecommendations(user.id),
        SkillExtractionService.getTrendingSkillsToLearn(user.id, 5),
        SkillExtractionService.getJobRoles(),
        SkillExtractionService.getSkillsByCategorySummary(user.id),
      ]);

      setUserSkills(skills);
      setRecommendations(recs);
      setTrendingSkills(trending);
      setJobRoles(roles);
      setCategorySummary(summary);

      if (roles.length > 0 && !selectedJobRole) {
        setSelectedJobRole(roles[0].id);
      }
    } catch (_error) {
      logger._error('Error loading skills dashboard:', _error);
      toast({
        title: 'Error',
        description: 'Failed to load skills data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadJobMatch = async () => {
    if (!user?.id || !selectedJobRole) return;

    try {
      const match = await SkillExtractionService.getJobRoleMatch(user.id, selectedJobRole);
      setJobMatch(match);
    } catch (_error) {
      logger._error('Error loading job match:', _error);
    }
  };

  const handleDismissRecommendation = async (recId: string) => {
    try {
      await SkillExtractionService.dismissRecommendation(recId);
      setRecommendations(prev => prev.filter(r => r.id !== recId));
      toast({
        description: 'Recommendation dismissed',
      });
    } catch (_error) {
      logger._error('Error dismissing recommendation:', _error);
    }
  };

  const handleSetCareerGoal = async (roleId: string) => {
    if (!user?.id) return;

    try {
      await SkillExtractionService.setCareerGoal(user.id, roleId);
      toast({
        title: 'Career Goal Set',
        description: 'Your skill recommendations will be updated',
      });
      // Refresh recommendations
      const recs = await SkillExtractionService.getRecommendations(user.id);
      setRecommendations(recs);
    } catch (_error) {
      logger._error('Error setting career goal:', _error);
      toast({
        title: 'Error',
        description: 'Failed to set career goal',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-48 bg-muted animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const totalSkills = userSkills.length;
  const verifiedSkills = userSkills.filter(s => s.verified).length;
  const avgScore =
    totalSkills > 0
      ? Math.round(userSkills.reduce((sum, s) => sum + s.proficiency_score, 0) / totalSkills)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            Skills Dashboard
          </h2>
          <p className="text-muted-foreground">Track your skills and plan your career growth</p>
        </div>
        <Button onClick={loadDashboardData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Skills</p>
                <p className="text-2xl font-bold">{totalSkills}</p>
              </div>
              <Brain className="h-8 w-8 text-primary opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Verified Skills</p>
                <p className="text-2xl font-bold">{verifiedSkills}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Proficiency</p>
                <p className="text-2xl font-bold">{avgScore}%</p>
              </div>
              <Award className="h-8 w-8 text-yellow-500 opacity-80" />
            </div>
            <Progress value={avgScore} className="h-1 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Recommendations</p>
                <p className="text-2xl font-bold">{recommendations.length}</p>
              </div>
              <Target className="h-8 w-8 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inventory">My Skills</TabsTrigger>
          <TabsTrigger value="career">Career Match</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="trending">Trending Skills</TabsTrigger>
        </TabsList>

        {/* Skills Inventory Tab */}
        <TabsContent value="inventory" className="space-y-4">
          {/* Category Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(categorySummary).map(([category, data]) => (
              <Card key={category}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium capitalize">
                    {category.replace('_', ' ')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">{data.total}</span>
                    <Badge variant="secondary">{data.average_score}% avg</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Skills List */}
          <Card>
            <CardHeader>
              <CardTitle>Skill Inventory</CardTitle>
              <CardDescription>Your acquired skills and proficiency levels</CardDescription>
            </CardHeader>
            <CardContent>
              {userSkills.length > 0 ? (
                <div className="space-y-3">
                  {userSkills.map(skill => (
                    <div
                      key={skill.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium">{skill.skill.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {skill.skill.category.replace('_', ' ')} • {skill.skill.subcategory}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {skill.verified && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              </TooltipTrigger>
                              <TooltipContent>Verified through assessment</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        <Badge className={proficiencyColors[skill.proficiency_level]}>
                          {skill.proficiency_level}
                        </Badge>
                        <div className="w-24">
                          <Progress value={skill.proficiency_score} className="h-2" />
                        </div>
                        <span className="text-sm font-medium w-10 text-right">
                          {skill.proficiency_score}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No skills in your inventory yet</p>
                  <p className="text-sm">
                    Complete courses or take assessments to build your skills
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Career Match Tab */}
        <TabsContent value="career" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Career Goal Matching</CardTitle>
                  <CardDescription>See how your skills match job requirements</CardDescription>
                </div>
                <Select value={selectedJobRole} onValueChange={setSelectedJobRole}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select a job role" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobRoles.map(role => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {jobMatch && selectedJobRole ? (
                <div className="space-y-6">
                  {/* Match Score */}
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Match Score</p>
                      <p className="text-3xl font-bold">{jobMatch.match_percentage}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Skills Matched</p>
                      <p className="text-lg font-medium">
                        {jobMatch.matched_skills} / {jobMatch.total_required}
                      </p>
                    </div>
                    <Button onClick={() => handleSetCareerGoal(selectedJobRole)} size="sm">
                      Set as Goal
                    </Button>
                  </div>

                  {/* Skill Gaps */}
                  {jobMatch.skill_gaps && jobMatch.skill_gaps.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                        Skills to Develop ({jobMatch.skill_gaps.length})
                      </h4>
                      <div className="space-y-2">
                        {jobMatch.skill_gaps.map((gap, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2 bg-orange-50 dark:bg-orange-900/10 rounded"
                          >
                            <span className="font-medium">{gap.skill_name}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {gap.current_level === 'none' ? 'Not started' : gap.current_level}
                              </Badge>
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              <Badge className={proficiencyColors[gap.required_level]}>
                                {gap.required_level}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Strengths */}
                  {jobMatch.strengths && jobMatch.strengths.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Star className="h-4 w-4 text-green-500" />
                        Your Strengths ({jobMatch.strengths.length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {jobMatch.strengths.map((strength, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="bg-green-100 text-green-700"
                          >
                            {strength.skill_name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a job role to see your match</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Recommendations</CardTitle>
              <CardDescription>
                Skills recommended based on your career goals and market demand
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recommendations.length > 0 ? (
                <div className="space-y-3">
                  {recommendations.map(rec => (
                    <div
                      key={rec.id}
                      className="p-4 border rounded-lg hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{rec.skill.name}</h4>
                            {rec.skill.is_trending && (
                              <Badge variant="secondary" className="text-xs gap-1">
                                <TrendingUp className="h-3 w-3" />
                                Trending
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{rec.reason}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>~{rec.estimated_hours}h to learn</span>
                            <Badge
                              variant={
                                rec.business_impact === 'critical'
                                  ? 'destructive'
                                  : rec.business_impact === 'high'
                                    ? 'default'
                                    : 'secondary'
                              }
                              className="text-xs"
                            >
                              {rec.business_impact} impact
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <BookOpen className="h-4 w-4 mr-1" />
                            Learn
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDismissRecommendation(rec.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recommendations yet</p>
                  <p className="text-sm">Set a career goal to get personalized recommendations</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trending Skills Tab */}
        <TabsContent value="trending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Trending Skills to Learn</CardTitle>
              <CardDescription>High-demand skills you haven't acquired yet</CardDescription>
            </CardHeader>
            <CardContent>
              {trendingSkills.length > 0 ? (
                <div className="space-y-3">
                  {trendingSkills.map(skill => (
                    <div
                      key={skill.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{skill.name}</h4>
                          <Badge variant="secondary" className="text-xs gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {skill.demand_score}% demand
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{skill.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs capitalize">
                            {skill.category.replace('_', ' ')}
                          </Badge>
                          {skill.subcategory && (
                            <Badge variant="outline" className="text-xs">
                              {skill.subcategory}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <Zap className="h-4 w-4 mr-1" />
                        Start Learning
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>You've got all the trending skills!</p>
                  <p className="text-sm">Keep up the great work</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default SkillsDashboard;
