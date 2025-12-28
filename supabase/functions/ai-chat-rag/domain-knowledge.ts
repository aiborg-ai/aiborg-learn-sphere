/**
 * Domain Knowledge - Static Educational Context
 *
 * This provides the LLM with comprehensive domain knowledge about:
 * - AI/ML education concepts and curriculum
 * - Available courses and learning paths
 * - Common prerequisites and relationships
 * - Teaching strategies and best practices
 */

export interface DomainKnowledge {
  curriculum: CurriculumKnowledge;
  courses: CourseMetadata[];
  learningPaths: LearningPath[];
  conceptMap: ConceptRelationship[];
  pedagogicalStrategies: PedagogicalStrategy[];
}

export interface CurriculumKnowledge {
  levels: {
    beginner: string[];
    intermediate: string[];
    advanced: string[];
    expert: string[];
  };
  coreTopics: string[];
  prerequisites: Record<string, string[]>;
  estimatedDurations: Record<string, string>;
}

export interface CourseMetadata {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  duration: string;
  prerequisites: string[];
  learningOutcomes: string[];
  topics: string[];
  contentTypes: string[];
}

export interface LearningPath {
  name: string;
  description: string;
  targetAudience: string;
  timeline: string;
  stages: {
    stage: number;
    title: string;
    courses: string[];
    duration: string;
    goals: string[];
  }[];
}

export interface ConceptRelationship {
  concept: string;
  prerequisites: string[];
  relatedConcepts: string[];
  applications: string[];
  commonMisconceptions: string[];
}

export interface PedagogicalStrategy {
  topic: string;
  strategies: string[];
  assessmentMethods: string[];
  commonChallenges: string[];
  teachingTips: string[];
}

/**
 * Get comprehensive domain knowledge for LLM context
 */
export function getDomainKnowledge(): DomainKnowledge {
  return {
    curriculum: getCurriculumKnowledge(),
    courses: getCourseMetadata(),
    learningPaths: getLearningPaths(),
    conceptMap: getConceptMap(),
    pedagogicalStrategies: getPedagogicalStrategies(),
  };
}

/**
 * Generate domain knowledge section for LLM prompt
 */
export function generateDomainKnowledgePrompt(category?: string, userLevel?: string): string {
  const domain = getDomainKnowledge();

  let prompt = `## DOMAIN KNOWLEDGE - AI/ML EDUCATION PLATFORM

### Platform Overview
You are assisting learners on an AI/ML education platform with:
- Structured curriculum from beginner to expert level
- Hands-on projects and practical applications
- Adaptive learning with personalized recommendations
- Multiple content formats (video, text, interactive labs)

`;

  // Add relevant curriculum structure
  prompt += `### Curriculum Structure
**Core Learning Levels:**
- **Beginner**: ${domain.curriculum.levels.beginner.join(', ')}
- **Intermediate**: ${domain.curriculum.levels.intermediate.join(', ')}
- **Advanced**: ${domain.curriculum.levels.advanced.join(', ')}
- **Expert**: ${domain.curriculum.levels.expert.join(', ')}

**Core Topics Covered:**
${domain.curriculum.coreTopics.map(t => `- ${t}`).join('\n')}

`;

  // Add learning paths relevant to user
  if (userLevel) {
    const relevantPaths = domain.learningPaths.filter(path =>
      path.targetAudience.toLowerCase().includes(userLevel.toLowerCase())
    );
    if (relevantPaths.length > 0) {
      prompt += `### Recommended Learning Paths for ${userLevel}:\n`;
      relevantPaths.forEach(path => {
        prompt += `\n**${path.name}** (${path.timeline})
${path.description}
Stages: ${path.stages.map(s => s.title).join(' → ')}
`;
      });
    }
  }

  // Add concept relationships for better explanations
  prompt += `\n### Key Concept Relationships
Understanding these relationships helps guide learners:
`;
  domain.conceptMap.slice(0, 5).forEach(concept => {
    prompt += `
**${concept.concept}**
- Prerequisites: ${concept.prerequisites.join(', ') || 'None'}
- Related to: ${concept.relatedConcepts.join(', ')}
- Applications: ${concept.applications.join(', ')}
`;
  });

  // Add pedagogical strategies
  prompt += `\n### Teaching Best Practices
`;
  domain.pedagogicalStrategies.slice(0, 3).forEach(strategy => {
    prompt += `
**${strategy.topic}**
- Strategies: ${strategy.strategies.join('; ')}
- Common challenges: ${strategy.commonChallenges.join('; ')}
`;
  });

  prompt += `\n**IMPORTANT**: Use this domain knowledge to:
1. Recommend appropriate learning paths based on user's level
2. Explain prerequisites and concept relationships
3. Suggest specific courses from our catalog
4. Identify knowledge gaps and fill them systematically
5. Apply proven teaching strategies for AI/ML topics
`;

  return prompt;
}

/**
 * Get detailed course metadata for a specific course
 */
export function getCourseDetails(courseTitle: string): CourseMetadata | null {
  const courses = getCourseMetadata();
  return courses.find(c => c.title.toLowerCase().includes(courseTitle.toLowerCase())) || null;
}

/**
 * Get recommended learning path based on user profile
 */
export function getRecommendedPath(
  currentLevel: string,
  goals: string[],
  interests: string[]
): LearningPath | null {
  const paths = getLearningPaths();

  // Simple matching logic - can be enhanced
  return (
    paths.find(
      path =>
        path.targetAudience.toLowerCase().includes(currentLevel.toLowerCase()) &&
        goals.some(goal => path.description.toLowerCase().includes(goal.toLowerCase()))
    ) || paths[0]
  );
}

// ============================================================================
// STATIC DOMAIN KNOWLEDGE DATA
// ============================================================================

function getCurriculumKnowledge(): CurriculumKnowledge {
  return {
    levels: {
      beginner: [
        'What is AI/ML',
        'Basic Python',
        'Data fundamentals',
        'Simple algorithms',
        'Introduction to neural networks',
      ],
      intermediate: [
        'Supervised learning',
        'Unsupervised learning',
        'Deep learning basics',
        'Model evaluation',
        'Feature engineering',
        'Common ML libraries (scikit-learn, pandas)',
      ],
      advanced: [
        'Advanced neural networks',
        'Transformers and attention',
        'NLP and computer vision',
        'Model optimization',
        'MLOps and deployment',
        'PyTorch/TensorFlow advanced',
      ],
      expert: [
        'Research methodology',
        'Custom architectures',
        'Distributed training',
        'Production-scale ML',
        'AI ethics and safety',
        'Cutting-edge techniques',
      ],
    },
    coreTopics: [
      'Machine Learning Fundamentals',
      'Deep Learning',
      'Natural Language Processing (NLP)',
      'Computer Vision',
      'Reinforcement Learning',
      'AI Ethics and Safety',
      'MLOps and Deployment',
      'Data Engineering for ML',
      'Model Optimization',
      'Prompt Engineering',
    ],
    prerequisites: {
      'Deep Learning': ['Machine Learning Fundamentals', 'Python Programming', 'Linear Algebra'],
      NLP: ['Deep Learning', 'Neural Networks Basics'],
      'Computer Vision': ['Deep Learning', 'Convolutional Neural Networks'],
      MLOps: ['Machine Learning Fundamentals', 'Python', 'Basic DevOps'],
      Transformers: ['Deep Learning', 'Attention Mechanisms', 'NLP Basics'],
      'Prompt Engineering': ['Understanding LLMs', 'Basic NLP'],
    },
    estimatedDurations: {
      'Beginner Level': '2-3 months',
      'Intermediate Level': '4-6 months',
      'Advanced Level': '6-12 months',
      'Expert Level': '12+ months',
    },
  };
}

function getCourseMetadata(): CourseMetadata[] {
  return [
    {
      id: 'ml-fundamentals',
      title: 'Machine Learning Fundamentals',
      category: 'AI/ML Core',
      difficulty: 'beginner',
      duration: '8 weeks',
      prerequisites: ['Basic Python', 'High school mathematics'],
      learningOutcomes: [
        'Understand core ML concepts and algorithms',
        'Build and evaluate ML models',
        'Use scikit-learn for common tasks',
        'Apply ML to real-world problems',
      ],
      topics: [
        'Supervised Learning',
        'Unsupervised Learning',
        'Model Evaluation',
        'Feature Engineering',
      ],
      contentTypes: ['Video lectures', 'Coding exercises', 'Projects', 'Quizzes'],
    },
    {
      id: 'deep-learning',
      title: 'Deep Learning Specialization',
      category: 'AI/ML Advanced',
      difficulty: 'intermediate',
      duration: '12 weeks',
      prerequisites: ['Machine Learning Fundamentals', 'Linear Algebra', 'Calculus basics'],
      learningOutcomes: [
        'Build neural networks from scratch',
        'Implement CNNs and RNNs',
        'Use PyTorch/TensorFlow',
        'Train and optimize deep models',
      ],
      topics: ['Neural Networks', 'Backpropagation', 'CNNs', 'RNNs', 'Optimization'],
      contentTypes: ['Video lectures', 'Jupyter notebooks', 'Projects', 'Assignments'],
    },
    {
      id: 'nlp-mastery',
      title: 'Natural Language Processing Mastery',
      category: 'NLP',
      difficulty: 'advanced',
      duration: '10 weeks',
      prerequisites: ['Deep Learning', 'Python proficiency'],
      learningOutcomes: [
        'Build NLP applications',
        'Work with transformers and BERT',
        'Fine-tune large language models',
        'Deploy NLP systems',
      ],
      topics: [
        'Transformers',
        'BERT',
        'GPT models',
        'Text classification',
        'Named entity recognition',
      ],
      contentTypes: ['Video lectures', 'Coding labs', 'Real-world projects'],
    },
    {
      id: 'prompt-engineering',
      title: 'Prompt Engineering for AI',
      category: 'AI Applications',
      difficulty: 'beginner',
      duration: '4 weeks',
      prerequisites: ['Basic understanding of AI/LLMs'],
      learningOutcomes: [
        'Master prompt design techniques',
        'Build AI-powered applications',
        'Optimize LLM responses',
        'Understand prompt injection risks',
      ],
      topics: ['Prompt patterns', 'Chain-of-thought', 'Few-shot learning', 'RAG systems'],
      contentTypes: ['Interactive tutorials', 'Practice exercises', 'Real examples'],
    },
    {
      id: 'computer-vision',
      title: 'Computer Vision with Deep Learning',
      category: 'Computer Vision',
      difficulty: 'advanced',
      duration: '10 weeks',
      prerequisites: ['Deep Learning', 'CNNs'],
      learningOutcomes: [
        'Build image classification systems',
        'Implement object detection',
        'Work with vision transformers',
        'Deploy CV models',
      ],
      topics: ['Image classification', 'Object detection', 'Segmentation', 'Vision transformers'],
      contentTypes: ['Video lectures', 'Coding projects', 'Kaggle competitions'],
    },
    {
      id: 'mlops',
      title: 'MLOps: Deploying ML Systems',
      category: 'MLOps',
      difficulty: 'advanced',
      duration: '8 weeks',
      prerequisites: ['Machine Learning', 'Python', 'Basic DevOps'],
      learningOutcomes: [
        'Deploy ML models to production',
        'Set up ML pipelines',
        'Monitor model performance',
        'Implement CI/CD for ML',
      ],
      topics: ['Model deployment', 'Monitoring', 'Versioning', 'Scaling', 'CI/CD'],
      contentTypes: ['Hands-on labs', 'AWS/GCP tutorials', 'Real deployments'],
    },
  ];
}

function getLearningPaths(): LearningPath[] {
  return [
    {
      name: 'Complete AI/ML Journey',
      description: 'From beginner to professional ML engineer',
      targetAudience: 'Beginners with programming experience',
      timeline: '9-12 months',
      stages: [
        {
          stage: 1,
          title: 'Foundations',
          courses: ['Python Programming', 'Machine Learning Fundamentals'],
          duration: '3 months',
          goals: ['Understand ML basics', 'Build first models'],
        },
        {
          stage: 2,
          title: 'Deep Dive',
          courses: ['Deep Learning Specialization', 'Data Engineering'],
          duration: '3 months',
          goals: ['Master neural networks', 'Handle real datasets'],
        },
        {
          stage: 3,
          title: 'Specialization',
          courses: ['NLP Mastery OR Computer Vision', 'MLOps'],
          duration: '3-4 months',
          goals: ['Specialize in one domain', 'Deploy production systems'],
        },
        {
          stage: 4,
          title: 'Mastery',
          courses: ['Advanced topics', 'Capstone project'],
          duration: '2-3 months',
          goals: ['Build portfolio project', 'Job ready'],
        },
      ],
    },
    {
      name: 'NLP Specialist Track',
      description: 'Focus on language AI and large language models',
      targetAudience: 'Intermediate learners interested in NLP',
      timeline: '6 months',
      stages: [
        {
          stage: 1,
          title: 'Deep Learning Basics',
          courses: ['Deep Learning Specialization'],
          duration: '3 months',
          goals: ['Master neural networks', 'Understand architectures'],
        },
        {
          stage: 2,
          title: 'NLP Core',
          courses: ['NLP Mastery', 'Transformers Deep Dive'],
          duration: '2 months',
          goals: ['Work with BERT/GPT', 'Build text applications'],
        },
        {
          stage: 3,
          title: 'Advanced Applications',
          courses: ['Prompt Engineering', 'LLM Fine-tuning'],
          duration: '1 month',
          goals: ['Deploy LLM apps', 'Optimize prompts'],
        },
      ],
    },
    {
      name: 'Business AI Leader',
      description: 'AI strategy and implementation for executives',
      targetAudience: 'Business leaders and managers',
      timeline: '3 months',
      stages: [
        {
          stage: 1,
          title: 'AI Fundamentals',
          courses: ['AI for Business Leaders', 'ML Use Cases'],
          duration: '1 month',
          goals: ['Understand AI capabilities', 'Identify opportunities'],
        },
        {
          stage: 2,
          title: 'Implementation',
          courses: ['AI Strategy', 'ROI and Metrics'],
          duration: '1 month',
          goals: ['Build AI roadmap', 'Calculate business value'],
        },
        {
          stage: 3,
          title: 'Leadership',
          courses: ['AI Ethics', 'Team Building for AI'],
          duration: '1 month',
          goals: ['Lead AI initiatives', 'Build AI teams'],
        },
      ],
    },
    {
      name: 'Prompt Engineering Pro',
      description: 'Quick path to working with AI tools',
      targetAudience: 'Professionals wanting to use AI tools',
      timeline: '1 month',
      stages: [
        {
          stage: 1,
          title: 'Foundations',
          courses: ['Understanding LLMs', 'Prompt Engineering'],
          duration: '2 weeks',
          goals: ['Master prompt techniques', 'Use ChatGPT/Claude effectively'],
        },
        {
          stage: 2,
          title: 'Advanced',
          courses: ['RAG Systems', 'AI Tool Integration'],
          duration: '2 weeks',
          goals: ['Build custom AI workflows', 'Integrate with APIs'],
        },
      ],
    },
  ];
}

function getConceptMap(): ConceptRelationship[] {
  return [
    {
      concept: 'Neural Networks',
      prerequisites: ['Linear Algebra', 'Calculus basics', 'Python'],
      relatedConcepts: [
        'Perceptrons',
        'Activation functions',
        'Backpropagation',
        'Gradient descent',
      ],
      applications: ['Image classification', 'Text analysis', 'Pattern recognition'],
      commonMisconceptions: [
        'NNs can learn anything with enough data (reality: need good features)',
        'More layers always better (reality: can overfit)',
        'NNs are black boxes (reality: interpretability techniques exist)',
      ],
    },
    {
      concept: 'Transformers',
      prerequisites: ['Neural Networks', 'Attention Mechanism', 'Deep Learning'],
      relatedConcepts: ['BERT', 'GPT', 'Attention', 'Encoders', 'Decoders'],
      applications: [
        'Language translation',
        'Text generation',
        'Question answering',
        'Vision tasks',
      ],
      commonMisconceptions: [
        'Only for NLP (reality: used in vision, audio, etc.)',
        'Always better than RNNs (reality: depends on task)',
        'Need huge datasets (reality: transfer learning helps)',
      ],
    },
    {
      concept: 'Transfer Learning',
      prerequisites: ['Deep Learning basics', 'Pre-trained models'],
      relatedConcepts: ['Fine-tuning', 'Feature extraction', 'Domain adaptation'],
      applications: ['Using BERT for text', 'Using ResNet for images', 'Few-shot learning'],
      commonMisconceptions: [
        'Can transfer any model to any task (reality: needs related domains)',
        'No training needed (reality: fine-tuning often required)',
      ],
    },
    {
      concept: 'Prompt Engineering',
      prerequisites: ['Understanding LLMs', 'Basic NLP'],
      relatedConcepts: ['Few-shot learning', 'Chain-of-thought', 'RAG', 'Fine-tuning'],
      applications: ['Chatbots', 'Content generation', 'Code assistance', 'Data extraction'],
      commonMisconceptions: [
        'Just asking nicely (reality: structured techniques work better)',
        'One prompt fits all (reality: need iteration and testing)',
      ],
    },
    {
      concept: 'RAG (Retrieval Augmented Generation)',
      prerequisites: ['Vector databases', 'Embeddings', 'LLMs'],
      relatedConcepts: ['Semantic search', 'Embeddings', 'Vector similarity', 'Context injection'],
      applications: ['Document Q&A', 'Knowledge bases', 'Custom chatbots'],
      commonMisconceptions: [
        'Replaces fine-tuning (reality: complementary techniques)',
        'Just semantic search (reality: combines retrieval + generation)',
      ],
    },
  ];
}

function getPedagogicalStrategies(): PedagogicalStrategy[] {
  return [
    {
      topic: 'Neural Networks',
      strategies: [
        'Start with biological neuron analogy',
        'Visualize activation functions graphically',
        'Build simple network (XOR) before complex ones',
        'Use interactive visualizations (TensorFlow Playground)',
        'Practice forward/backward pass by hand first',
      ],
      assessmentMethods: [
        'Implement from scratch (no libraries)',
        'Debug broken networks',
        'Explain decisions to non-technical audience',
        'Optimize for specific constraints',
      ],
      commonChallenges: [
        'Understanding backpropagation math',
        'Choosing architecture (layers, neurons)',
        'Debugging vanishing/exploding gradients',
        'Overfitting vs underfitting',
      ],
      teachingTips: [
        'Use analogies: network = team of specialists',
        'Visualize everything (computation graphs)',
        'Start with intuition, then math',
        'Emphasize experimentation over memorization',
      ],
    },
    {
      topic: 'Transformers',
      strategies: [
        'Build on RNN limitations first',
        'Explain attention with search engine analogy',
        'Visualize attention weights',
        'Start with encoder-only (BERT) before encoder-decoder',
        'Use pre-trained models before building from scratch',
      ],
      assessmentMethods: [
        'Fine-tune BERT for classification',
        'Implement attention mechanism',
        'Explain positional encoding',
        'Optimize for production use',
      ],
      commonChallenges: [
        'Understanding self-attention mechanism',
        'Multi-head attention complexity',
        'Positional encoding rationale',
        'Computational requirements',
      ],
      teachingTips: [
        'Analogy: attention = spotlight on important parts',
        'Show attention visualizations',
        'Compare to human reading comprehension',
        'Emphasize why it works, not just how',
      ],
    },
    {
      topic: 'Prompt Engineering',
      strategies: [
        'Start with simple prompts, iterate',
        'Show good vs bad examples side-by-side',
        'Practice with real use cases',
        'Teach prompt patterns (templates)',
        'Emphasize testing and measurement',
      ],
      assessmentMethods: [
        'Optimize prompt for specific task',
        'A/B test different approaches',
        'Build prompt library',
        'Handle edge cases and errors',
      ],
      commonChallenges: [
        'Inconsistent outputs',
        'Prompt injection vulnerabilities',
        'Cost optimization',
        'Measuring quality',
      ],
      teachingTips: [
        'Provide prompt templates',
        'Show real-world examples',
        'Teach systematic iteration',
        'Emphasize context length limits',
      ],
    },
  ];
}
