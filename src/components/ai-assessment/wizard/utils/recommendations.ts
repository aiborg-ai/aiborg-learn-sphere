import type { ProfilingData } from '../types';

export const generateRecommendations = (
  level: string,
  _categoryId: string,
  profilingData: ProfilingData | null
): string[] => {
  // Generate personalized recommendations based on performance and profiling data
  const recommendations: string[] = [];
  const audienceType = profilingData?.audience_type;

  if (level === 'weak' || level === 'developing') {
    if (audienceType === 'primary') {
      recommendations.push('Try fun, kid-friendly AI tools in this category');
      recommendations.push('Ask a parent or teacher to help you explore these tools');
      recommendations.push('Start with simple projects to build your skills');
    } else if (audienceType === 'secondary') {
      recommendations.push('Look for student-friendly AI tools and tutorials');
      recommendations.push('Join online communities to learn from peers');
      recommendations.push('Consider free courses to build foundational knowledge');
    } else if (audienceType === 'business') {
      recommendations.push('Identify quick wins where AI can save time in your business');
      recommendations.push('Start with user-friendly, no-code AI solutions');
      recommendations.push('Consider hiring a consultant for implementation guidance');
    } else {
      recommendations.push('Consider exploring beginner-friendly AI tools in this category');
      recommendations.push('Start with one tool and master it before adding more');
      recommendations.push('Look for free tutorials and guides to get started');
    }
  } else if (level === 'proficient') {
    if (audienceType === 'business') {
      recommendations.push('Scale your AI usage across more business processes');
      recommendations.push("Train your team on the tools you've mastered");
      recommendations.push('Explore integration opportunities to maximize ROI');
    } else if (audienceType === 'professional' && profilingData?.industry) {
      recommendations.push(`Look for industry-specific AI tools in ${profilingData.industry}`);
      recommendations.push('Explore integrations between different tools');
      recommendations.push('Consider advanced features to boost productivity');
    } else {
      recommendations.push('You have a good foundation - try more advanced features');
      recommendations.push('Explore integrations between different tools');
      recommendations.push('Consider paid versions for enhanced capabilities');
    }
  } else {
    recommendations.push('You are highly augmented in this area!');
    if (audienceType === 'professional' || audienceType === 'business') {
      recommendations.push('Share your expertise through blog posts or workshops');
      recommendations.push('Mentor others in your organization');
    } else {
      recommendations.push('Share your expertise with others');
    }
    recommendations.push('Explore cutting-edge tools and beta features');
  }

  return recommendations;
};
