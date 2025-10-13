export const getRatingColor = (rating: number): string => {
  if (rating >= 4) return 'text-green-600';
  if (rating >= 3) return 'text-yellow-600';
  return 'text-red-600';
};

export const getRatingLabel = (rating: number): string => {
  if (rating >= 4.5) return 'Excellent Opportunity';
  if (rating >= 3.5) return 'Strong Opportunity';
  if (rating >= 2.5) return 'Moderate Opportunity';
  if (rating >= 1.5) return 'Limited Opportunity';
  return 'Low Opportunity';
};
