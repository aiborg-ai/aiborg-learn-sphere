/**
 * Question Classifier
 *
 * Classifies user questions into categories for specialized handling.
 * Uses pattern matching and keyword analysis for fast, accurate classification.
 */

export type QuestionCategory =
  | 'course_specific' // Questions about specific courses
  | 'pricing' // Pricing, payment, subscription questions
  | 'technical' // Technical support, how-to questions
  | 'motivational' // Encouragement, struggling, motivation
  | 'career' // Career advice, job-related
  | 'progress' // Progress tracking, achievements
  | 'recommendation' // Asking for course/content recommendations
  | 'general'; // General questions

interface ClassificationResult {
  category: QuestionCategory;
  confidence: number;
  keywords: string[];
  suggestedTemperature: number;
}

// Pattern definitions for each category
const CATEGORY_PATTERNS: Record<
  QuestionCategory,
  {
    keywords: string[];
    patterns: RegExp[];
    threshold: number;
    temperature: number;
  }
> = {
  course_specific: {
    keywords: [
      'course',
      'lesson',
      'module',
      'chapter',
      'video',
      'content',
      'curriculum',
      'syllabus',
    ],
    patterns: [
      /what.*(course|lesson|module)/i,
      /tell me about.*(course|program)/i,
      /how long.*(course|program)/i,
      /what will I learn/i,
      /course.*about/i,
    ],
    threshold: 0.65,
    temperature: 0.5,
  },
  pricing: {
    keywords: [
      'price',
      'cost',
      'payment',
      'subscription',
      'free',
      'discount',
      'coupon',
      'refund',
      'money',
      'pay',
      'afford',
      'expensive',
      'cheap',
    ],
    patterns: [
      /how much/i,
      /what.*(price|cost)/i,
      /is it free/i,
      /payment.*options/i,
      /can I get.*discount/i,
      /refund.*policy/i,
    ],
    threshold: 0.7,
    temperature: 0.3,
  },
  technical: {
    keywords: [
      'error',
      'bug',
      'issue',
      'problem',
      'not working',
      'help',
      'stuck',
      'broken',
      'fix',
      'troubleshoot',
      'login',
      'password',
      'account',
    ],
    patterns: [
      /how (do|can) I/i,
      /not working/i,
      /can't.*access/i,
      /error.*message/i,
      /having.*trouble/i,
      /won't.*load/i,
    ],
    threshold: 0.65,
    temperature: 0.3,
  },
  motivational: {
    keywords: [
      'struggle',
      'hard',
      'difficult',
      'give up',
      'frustrated',
      'overwhelmed',
      'scared',
      'nervous',
      'confidence',
      'believe',
      'motivation',
      'inspire',
    ],
    patterns: [
      /I('m| am).*(struggling|stuck|frustrated)/i,
      /too hard/i,
      /can't do this/i,
      /feeling.*overwhelmed/i,
      /is it worth/i,
      /am I.*enough/i,
    ],
    threshold: 0.4,
    temperature: 0.8,
  },
  career: {
    keywords: [
      'job',
      'career',
      'work',
      'salary',
      'hire',
      'interview',
      'resume',
      'cv',
      'industry',
      'profession',
      'opportunity',
      'market',
    ],
    patterns: [
      /get.*job/i,
      /career.*advice/i,
      /will.*help.*career/i,
      /job.*market/i,
      /what.*job.*can/i,
      /industry.*demand/i,
    ],
    threshold: 0.6,
    temperature: 0.6,
  },
  progress: {
    keywords: [
      'progress',
      'certificate',
      'badge',
      'achievement',
      'complete',
      'finish',
      'track',
      'history',
      'score',
      'grade',
      'performance',
    ],
    patterns: [
      /my progress/i,
      /how.*doing/i,
      /track.*learning/i,
      /certificate/i,
      /when.*finish/i,
      /what.*completed/i,
    ],
    threshold: 0.6,
    temperature: 0.4,
  },
  recommendation: {
    keywords: [
      'recommend',
      'suggest',
      'best',
      'which',
      'should',
      'start',
      'beginner',
      'advanced',
      'next',
      'suitable',
      'right for me',
    ],
    patterns: [
      /what.*recommend/i,
      /which.*should/i,
      /best.*for/i,
      /where.*start/i,
      /what.*next/i,
      /suitable.*for/i,
    ],
    threshold: 0.6,
    temperature: 0.6,
  },
  general: {
    keywords: [],
    patterns: [],
    threshold: 0,
    temperature: 0.7,
  },
};

/**
 * Classify a user question into a category
 */
export function classifyQuestion(question: string): ClassificationResult {
  const normalizedQuestion = question.toLowerCase().trim();
  const scores: Record<QuestionCategory, { score: number; keywords: string[] }> = {
    course_specific: { score: 0, keywords: [] },
    pricing: { score: 0, keywords: [] },
    technical: { score: 0, keywords: [] },
    motivational: { score: 0, keywords: [] },
    career: { score: 0, keywords: [] },
    progress: { score: 0, keywords: [] },
    recommendation: { score: 0, keywords: [] },
    general: { score: 0.1, keywords: [] }, // Base score for general
  };

  // Check each category
  for (const [category, config] of Object.entries(CATEGORY_PATTERNS)) {
    if (category === 'general') continue;

    const categoryKey = category as QuestionCategory;
    let score = 0;
    const matchedKeywords: string[] = [];

    // Keyword matching (each keyword adds weight)
    for (const keyword of config.keywords) {
      if (normalizedQuestion.includes(keyword.toLowerCase())) {
        score += 0.15;
        matchedKeywords.push(keyword);
      }
    }

    // Pattern matching (patterns add more weight)
    for (const pattern of config.patterns) {
      if (pattern.test(normalizedQuestion)) {
        score += 0.25;
      }
    }

    // Cap at 1.0
    scores[categoryKey] = {
      score: Math.min(1.0, score),
      keywords: matchedKeywords,
    };
  }

  // Find the best category
  let bestCategory: QuestionCategory = 'general';
  let bestScore = 0;
  let bestKeywords: string[] = [];

  for (const [category, { score, keywords }] of Object.entries(scores)) {
    const categoryKey = category as QuestionCategory;
    const config = CATEGORY_PATTERNS[categoryKey];

    // Only select if above threshold
    if (score > bestScore && score >= config.threshold) {
      bestCategory = categoryKey;
      bestScore = score;
      bestKeywords = keywords;
    }
  }

  return {
    category: bestCategory,
    confidence: bestScore,
    keywords: bestKeywords,
    suggestedTemperature: CATEGORY_PATTERNS[bestCategory].temperature,
  };
}

/**
 * Get detailed classification info for debugging/analytics
 */
export function getDetailedClassification(question: string): {
  result: ClassificationResult;
  allScores: Record<QuestionCategory, number>;
} {
  const result = classifyQuestion(question);

  const allScores: Record<QuestionCategory, number> = {
    course_specific: 0,
    pricing: 0,
    technical: 0,
    motivational: 0,
    career: 0,
    progress: 0,
    recommendation: 0,
    general: 0.1,
  };

  const normalizedQuestion = question.toLowerCase().trim();

  for (const [category, config] of Object.entries(CATEGORY_PATTERNS)) {
    if (category === 'general') continue;

    let score = 0;
    for (const keyword of config.keywords) {
      if (normalizedQuestion.includes(keyword.toLowerCase())) {
        score += 0.15;
      }
    }
    for (const pattern of config.patterns) {
      if (pattern.test(normalizedQuestion)) {
        score += 0.25;
      }
    }
    allScores[category as QuestionCategory] = Math.min(1.0, score);
  }

  return { result, allScores };
}
