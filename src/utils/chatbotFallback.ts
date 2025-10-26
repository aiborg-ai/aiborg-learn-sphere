/**
 * Sophisticated Chatbot Fallback System
 * Classifies queries and provides intelligent fallback responses
 */

export type QueryType =
  | 'greeting'
  | 'pricing'
  | 'course_recommendation'
  | 'course_details'
  | 'technical_question'
  | 'scheduling'
  | 'support'
  | 'enrollment'
  | 'general'
  | 'unknown';

export interface ClassificationResult {
  type: QueryType;
  confidence: number; // 0-1
  keywords: string[];
}

export interface FallbackResponse {
  message: string;
  suggestions?: string[];
  showWhatsApp?: boolean;
  showCourses?: boolean;
}

/**
 * Classify user query based on keywords and patterns
 */
export function classifyQuery(query: string): ClassificationResult {
  const lowerQuery = query.toLowerCase().trim();
  const words = lowerQuery.split(/\s+/);

  // Greeting patterns
  const greetingKeywords = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'];
  if (greetingKeywords.some(kw => lowerQuery.startsWith(kw)) || lowerQuery.length < 15) {
    return {
      type: 'greeting',
      confidence: 0.9,
      keywords: greetingKeywords.filter(kw => lowerQuery.includes(kw)),
    };
  }

  // Pricing queries
  const pricingKeywords = [
    'cost',
    'price',
    'pricing',
    'how much',
    'payment',
    'pay',
    'fee',
    'expensive',
    'cheap',
    'afford',
  ];
  const pricingMatches = pricingKeywords.filter(kw => lowerQuery.includes(kw));
  if (pricingMatches.length > 0) {
    return {
      type: 'pricing',
      confidence: 0.85,
      keywords: pricingMatches,
    };
  }

  // Course recommendation queries
  const recommendationKeywords = [
    'recommend',
    'suggest',
    'best',
    'which',
    'should i',
    'what course',
    'help me choose',
    'right for me',
  ];
  const recommendationMatches = recommendationKeywords.filter(kw => lowerQuery.includes(kw));
  if (recommendationMatches.length > 0) {
    return {
      type: 'course_recommendation',
      confidence: 0.8,
      keywords: recommendationMatches,
    };
  }

  // Course details queries
  const detailsKeywords = [
    'duration',
    'how long',
    'when',
    'start',
    'schedule',
    'syllabus',
    'curriculum',
    'cover',
    'learn',
    'teach',
  ];
  const detailsMatches = detailsKeywords.filter(kw => lowerQuery.includes(kw));
  if (detailsMatches.length > 0 && lowerQuery.includes('course')) {
    return {
      type: 'course_details',
      confidence: 0.75,
      keywords: detailsMatches,
    };
  }

  // Technical questions (AI/ML concepts)
  const technicalKeywords = [
    'what is',
    'explain',
    'difference between',
    'how does',
    'machine learning',
    'deep learning',
    'neural network',
    'algorithm',
    'model',
    'training',
    'ai',
    'artificial intelligence',
  ];
  const technicalMatches = technicalKeywords.filter(kw => lowerQuery.includes(kw));
  if (technicalMatches.length > 0) {
    return {
      type: 'technical_question',
      confidence: 0.7,
      keywords: technicalMatches,
    };
  }

  // Scheduling queries
  const schedulingKeywords = [
    'when',
    'schedule',
    'time',
    'date',
    'available',
    'start date',
    'next',
    'upcoming',
  ];
  const schedulingMatches = schedulingKeywords.filter(kw => lowerQuery.includes(kw));
  if (schedulingMatches.length > 0) {
    return {
      type: 'scheduling',
      confidence: 0.75,
      keywords: schedulingMatches,
    };
  }

  // Support queries
  const supportKeywords = [
    'help',
    'support',
    'problem',
    'issue',
    'error',
    'not working',
    'cant',
    'unable',
  ];
  const supportMatches = supportKeywords.filter(kw => lowerQuery.includes(kw));
  if (supportMatches.length > 0) {
    return {
      type: 'support',
      confidence: 0.8,
      keywords: supportMatches,
    };
  }

  // Enrollment queries
  const enrollmentKeywords = [
    'enroll',
    'sign up',
    'register',
    'join',
    'how to start',
    'get started',
    'apply',
  ];
  const enrollmentMatches = enrollmentKeywords.filter(kw => lowerQuery.includes(kw));
  if (enrollmentMatches.length > 0) {
    return {
      type: 'enrollment',
      confidence: 0.85,
      keywords: enrollmentMatches,
    };
  }

  // General queries (catch-all)
  if (words.length > 3) {
    return {
      type: 'general',
      confidence: 0.5,
      keywords: [],
    };
  }

  return {
    type: 'unknown',
    confidence: 0.3,
    keywords: [],
  };
}

/**
 * Generate intelligent fallback response based on query classification
 */
export function generateFallbackResponse(
  query: string,
  audience: string,
  courses?: any[]
): FallbackResponse {
  const classification = classifyQuery(query);

  switch (classification.type) {
    case 'greeting':
      return {
        message: getPersonalizedGreeting(audience),
        suggestions: [
          'What AI courses do you offer?',
          'How much do courses cost?',
          'Which course is right for me?',
        ],
      };

    case 'pricing':
      return {
        message: getPricingResponse(audience),
        showWhatsApp: true,
        suggestions: ['What payment options are available?', 'Are there any discounts?'],
      };

    case 'course_recommendation':
      if (courses && courses.length > 0) {
        const topCourse = courses[0];
        return {
          message: `Based on your interests, I recommend **${topCourse.title}** (${topCourse.price}, ${topCourse.duration}). This course is perfect for ${audience} learners and covers essential AI concepts. For personalized guidance, contact us on WhatsApp.`,
          showWhatsApp: true,
          showCourses: true,
          suggestions: ['Tell me more about this course', 'What are the prerequisites?'],
        };
      }
      return {
        message: `I'd love to help you find the perfect AI course! For personalized recommendations based on your goals and experience, please contact our team on WhatsApp: +44 7404568207`,
        showWhatsApp: true,
      };

    case 'course_details':
      return {
        message: `Our courses include comprehensive curriculum, hands-on projects, and expert instruction. Each course is tailored for ${audience} learners. For detailed syllabus and course structure, please contact us on WhatsApp: +44 7404568207`,
        showWhatsApp: true,
        suggestions: ['What will I learn?', 'Do you offer certificates?'],
      };

    case 'technical_question':
      return {
        message: `That's a great technical question! While I'm experiencing some difficulties right now, our AI instructors would be happy to explain that concept in detail. Contact us on WhatsApp: +44 7404568207 to speak with an expert.`,
        showWhatsApp: true,
        suggestions: ['Show me beginner-friendly courses', 'What courses cover this topic?'],
      };

    case 'scheduling':
      return {
        message: `We offer flexible scheduling with rolling admissions! Most courses start every 2 weeks. For specific start dates and availability, please contact us on WhatsApp: +44 7404568207`,
        showWhatsApp: true,
        suggestions: ['How long do courses last?', 'Can I learn at my own pace?'],
      };

    case 'support':
      return {
        message: `I'm here to help! For immediate technical support or course assistance, please reach out to our support team on WhatsApp: +44 7404568207. They're available 9 AM - 6 PM GMT.`,
        showWhatsApp: true,
      };

    case 'enrollment':
      return {
        message: `Enrolling is easy! Browse our courses, select the one that fits your goals, and click "Enroll Now". For step-by-step guidance or questions about the enrollment process, contact us on WhatsApp: +44 7404568207`,
        showWhatsApp: true,
        showCourses: true,
        suggestions: ['What are the prerequisites?', 'How do I pay?'],
      };

    case 'general':
      return {
        message: `I'm here to help you discover the perfect AI learning path! While I'm experiencing technical difficulties right now, you can browse our courses below or contact us on WhatsApp for personalized assistance: +44 7404568207`,
        showWhatsApp: true,
        showCourses: true,
      };

    default:
      return {
        message: `I'm experiencing technical difficulties right now, but I'm still here to help! For immediate assistance with any questions about our AI courses, please contact us on WhatsApp: +44 7404568207`,
        showWhatsApp: true,
      };
  }
}

/**
 * Get personalized greeting based on audience
 */
function getPersonalizedGreeting(audience: string): string {
  switch (audience) {
    case 'primary':
      return "Hi there! 👋 I'm aiborg chat, and I'm super excited to help you learn about AI in fun ways! What would you like to explore today?";

    case 'secondary':
      return "Hey! 🚀 I'm aiborg chat, your AI learning companion. I can help you discover courses that'll boost your grades and prepare you for an awesome future. What are you interested in learning?";

    case 'professional':
      return "Hello! I'm aiborg chat, your professional AI learning assistant. I help professionals like you enhance their careers with practical AI skills. What are your learning goals?";

    case 'business':
      return "Welcome! I'm aiborg chat, your strategic AI advisor. I help business leaders understand AI implementation and ROI. How can I assist you today?";

    default:
      return "Hello! I'm aiborg chat, your AI learning assistant. How can I help you discover the perfect AI course today?";
  }
}

/**
 * Get pricing response based on audience
 */
function getPricingResponse(audience: string): string {
  switch (audience) {
    case 'primary':
      return `Our fun AI courses for kids start at just **£25** for 4 weeks! Perfect for young learners aged 6-12. For payment options and family packages, contact us on WhatsApp: +44 7404568207`;

    case 'secondary':
      return `Teen AI courses are **£39** for 6 weeks! These courses are perfect for boosting college applications and learning cutting-edge skills. For payment plans and student discounts, contact us on WhatsApp: +44 7404568207`;

    case 'professional':
      return `Professional AI courses range from **£89 to £199**, with durations of 6-10 weeks. These courses provide ROI through career advancement and practical skills. For payment options and corporate packages, contact us on WhatsApp: +44 7404568207`;

    case 'business':
      return `Executive AI programs range from **£299 to £499** for 12-16 weeks. These strategic programs deliver measurable business impact and ROI. For enterprise pricing and team training, contact us on WhatsApp: +44 7404568207`;

    default:
      return `Our AI courses range from **£25 to £499** depending on the level and duration. For detailed pricing and payment plans, contact us on WhatsApp: +44 7404568207`;
  }
}

/**
 * Determine if query should use cache
 */
export function shouldUseCache(classification: ClassificationResult): boolean {
  // Use cache for common queries with high confidence
  return (
    classification.confidence > 0.75 &&
    ['greeting', 'pricing', 'course_details', 'scheduling'].includes(classification.type)
  );
}

/**
 * Determine if query needs GPT-4 or can use GPT-3.5
 */
export function shouldUseGPT4(classification: ClassificationResult): boolean {
  // Use GPT-4 for complex queries
  return (
    classification.type === 'technical_question' ||
    classification.type === 'course_recommendation' ||
    classification.confidence < 0.6
  );
}
