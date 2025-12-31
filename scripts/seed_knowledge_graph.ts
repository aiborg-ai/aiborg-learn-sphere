/**
 * Knowledge Graph Seeding Script
 *
 * Populates the knowledge graph with core programming concepts and relationships
 * Run with: npx tsx scripts/seed_knowledge_graph.ts
 *
 * This creates:
 * - 50+ foundational programming concepts
 * - 100+ relationships between concepts
 * - Prerequisite chains
 * - Topic hierarchies
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://afrulkxxzcmngbrdfuzj.supabase.co';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

// Core concepts to seed
const SEED_CONCEPTS = [
  // Foundational Programming (Beginner)
  {
    name: 'Variables and Data Types',
    slug: 'variables-and-data-types',
    type: 'topic' as const,
    difficulty_level: 'beginner' as const,
    description: 'Understanding variables, data types, and basic data storage in programming',
    estimated_hours: 4,
  },
  {
    name: 'Control Flow',
    slug: 'control-flow',
    type: 'topic' as const,
    difficulty_level: 'beginner' as const,
    description: 'Conditional statements (if/else) and loops (for/while) for program control',
    estimated_hours: 6,
  },
  {
    name: 'Functions and Methods',
    slug: 'functions-and-methods',
    type: 'topic' as const,
    difficulty_level: 'beginner' as const,
    description: 'Creating reusable code blocks with parameters and return values',
    estimated_hours: 8,
  },
  {
    name: 'Arrays and Lists',
    slug: 'arrays-and-lists',
    type: 'topic' as const,
    difficulty_level: 'beginner' as const,
    description: 'Working with ordered collections of data',
    estimated_hours: 5,
  },
  {
    name: 'String Manipulation',
    slug: 'string-manipulation',
    type: 'skill' as const,
    difficulty_level: 'beginner' as const,
    description: 'Working with text data, concatenation, formatting, and parsing',
    estimated_hours: 4,
  },

  // Object-Oriented Programming (Intermediate)
  {
    name: 'Object-Oriented Programming',
    slug: 'object-oriented-programming',
    type: 'topic' as const,
    difficulty_level: 'intermediate' as const,
    description: 'Programming paradigm based on objects containing data and methods',
    estimated_hours: 15,
  },
  {
    name: 'Classes and Objects',
    slug: 'classes-and-objects',
    type: 'topic' as const,
    difficulty_level: 'intermediate' as const,
    description: 'Defining classes as blueprints and creating object instances',
    estimated_hours: 8,
  },
  {
    name: 'Inheritance',
    slug: 'inheritance',
    type: 'skill' as const,
    difficulty_level: 'intermediate' as const,
    description: 'Creating class hierarchies with parent-child relationships',
    estimated_hours: 6,
  },
  {
    name: 'Encapsulation',
    slug: 'encapsulation',
    type: 'skill' as const,
    difficulty_level: 'intermediate' as const,
    description: 'Data hiding and access control with public/private members',
    estimated_hours: 5,
  },
  {
    name: 'Polymorphism',
    slug: 'polymorphism',
    type: 'skill' as const,
    difficulty_level: 'intermediate' as const,
    description: 'Objects of different types responding to the same interface',
    estimated_hours: 6,
  },

  // Data Structures (Intermediate)
  {
    name: 'Data Structures',
    slug: 'data-structures',
    type: 'topic' as const,
    difficulty_level: 'intermediate' as const,
    description: 'Organizing and storing data efficiently for different use cases',
    estimated_hours: 20,
  },
  {
    name: 'Linked Lists',
    slug: 'linked-lists',
    type: 'skill' as const,
    difficulty_level: 'intermediate' as const,
    description: 'Dynamic data structure with nodes containing data and pointers',
    estimated_hours: 6,
  },
  {
    name: 'Stacks and Queues',
    slug: 'stacks-and-queues',
    type: 'skill' as const,
    difficulty_level: 'intermediate' as const,
    description: 'LIFO and FIFO data structures for ordered data management',
    estimated_hours: 5,
  },
  {
    name: 'Hash Tables',
    slug: 'hash-tables',
    type: 'skill' as const,
    difficulty_level: 'intermediate' as const,
    description: 'Key-value data structures with fast lookup using hash functions',
    estimated_hours: 7,
  },
  {
    name: 'Trees and Graphs',
    slug: 'trees-and-graphs',
    type: 'skill' as const,
    difficulty_level: 'advanced' as const,
    description: 'Hierarchical and networked data structures',
    estimated_hours: 12,
  },

  // Algorithms (Intermediate/Advanced)
  {
    name: 'Algorithms',
    slug: 'algorithms',
    type: 'topic' as const,
    difficulty_level: 'intermediate' as const,
    description: 'Step-by-step procedures for solving computational problems',
    estimated_hours: 25,
  },
  {
    name: 'Searching Algorithms',
    slug: 'searching-algorithms',
    type: 'skill' as const,
    difficulty_level: 'intermediate' as const,
    description: 'Linear search, binary search, and advanced search techniques',
    estimated_hours: 6,
  },
  {
    name: 'Sorting Algorithms',
    slug: 'sorting-algorithms',
    type: 'skill' as const,
    difficulty_level: 'intermediate' as const,
    description: 'Bubble sort, merge sort, quick sort, and other sorting methods',
    estimated_hours: 8,
  },
  {
    name: 'Recursion',
    slug: 'recursion',
    type: 'technique' as const,
    difficulty_level: 'intermediate' as const,
    description: 'Functions calling themselves to solve problems iteratively',
    estimated_hours: 8,
  },
  {
    name: 'Dynamic Programming',
    slug: 'dynamic-programming',
    type: 'technique' as const,
    difficulty_level: 'advanced' as const,
    description: 'Optimization technique using memoization and tabulation',
    estimated_hours: 15,
  },

  // Web Development (Beginner/Intermediate)
  {
    name: 'HTML',
    slug: 'html',
    type: 'technology' as const,
    difficulty_level: 'beginner' as const,
    description: 'HyperText Markup Language for structuring web content',
    estimated_hours: 8,
  },
  {
    name: 'CSS',
    slug: 'css',
    type: 'technology' as const,
    difficulty_level: 'beginner' as const,
    description: 'Cascading Style Sheets for styling web pages',
    estimated_hours: 12,
  },
  {
    name: 'JavaScript',
    slug: 'javascript',
    type: 'technology' as const,
    difficulty_level: 'intermediate' as const,
    description: 'Programming language for interactive web applications',
    estimated_hours: 30,
  },
  {
    name: 'DOM Manipulation',
    slug: 'dom-manipulation',
    type: 'skill' as const,
    difficulty_level: 'intermediate' as const,
    description: 'Dynamically modifying HTML structure and content with JavaScript',
    estimated_hours: 8,
  },
  {
    name: 'Event Handling',
    slug: 'event-handling',
    type: 'skill' as const,
    difficulty_level: 'intermediate' as const,
    description: 'Responding to user interactions like clicks, keyboard input, and mouse events',
    estimated_hours: 6,
  },
  {
    name: 'Asynchronous JavaScript',
    slug: 'asynchronous-javascript',
    type: 'skill' as const,
    difficulty_level: 'advanced' as const,
    description: 'Callbacks, Promises, async/await for non-blocking operations',
    estimated_hours: 10,
  },

  // Python (Beginner/Intermediate)
  {
    name: 'Python Programming',
    slug: 'python-programming',
    type: 'technology' as const,
    difficulty_level: 'beginner' as const,
    description: 'General-purpose programming language known for readability',
    estimated_hours: 25,
  },
  {
    name: 'Python Data Structures',
    slug: 'python-data-structures',
    type: 'skill' as const,
    difficulty_level: 'intermediate' as const,
    description: 'Lists, tuples, dictionaries, sets in Python',
    estimated_hours: 10,
  },
  {
    name: 'Python Libraries',
    slug: 'python-libraries',
    type: 'topic' as const,
    difficulty_level: 'intermediate' as const,
    description: 'Using and importing external Python packages',
    estimated_hours: 8,
  },

  // Databases (Intermediate)
  {
    name: 'Databases',
    slug: 'databases',
    type: 'topic' as const,
    difficulty_level: 'intermediate' as const,
    description: 'Structured data storage and retrieval systems',
    estimated_hours: 20,
  },
  {
    name: 'SQL',
    slug: 'sql',
    type: 'technology' as const,
    difficulty_level: 'intermediate' as const,
    description: 'Structured Query Language for relational databases',
    estimated_hours: 15,
  },
  {
    name: 'NoSQL Databases',
    slug: 'nosql-databases',
    type: 'technology' as const,
    difficulty_level: 'intermediate' as const,
    description: 'Non-relational databases (document, key-value, graph)',
    estimated_hours: 12,
  },

  // Version Control (Beginner)
  {
    name: 'Git Version Control',
    slug: 'git-version-control',
    type: 'technology' as const,
    difficulty_level: 'beginner' as const,
    description: 'Distributed version control system for tracking code changes',
    estimated_hours: 8,
  },
  {
    name: 'GitHub Collaboration',
    slug: 'github-collaboration',
    type: 'skill' as const,
    difficulty_level: 'intermediate' as const,
    description: 'Using GitHub for team collaboration, pull requests, and code review',
    estimated_hours: 6,
  },

  // Testing (Intermediate)
  {
    name: 'Software Testing',
    slug: 'software-testing',
    type: 'topic' as const,
    difficulty_level: 'intermediate' as const,
    description: 'Ensuring code quality through automated and manual testing',
    estimated_hours: 15,
  },
  {
    name: 'Unit Testing',
    slug: 'unit-testing',
    type: 'skill' as const,
    difficulty_level: 'intermediate' as const,
    description: 'Testing individual functions and methods in isolation',
    estimated_hours: 8,
  },
  {
    name: 'Test-Driven Development',
    slug: 'test-driven-development',
    type: 'technique' as const,
    difficulty_level: 'advanced' as const,
    description: 'Writing tests before implementation code (Red-Green-Refactor)',
    estimated_hours: 10,
  },

  // API Development (Advanced)
  {
    name: 'RESTful APIs',
    slug: 'restful-apis',
    type: 'technology' as const,
    difficulty_level: 'advanced' as const,
    description: 'Building web services with REST architectural principles',
    estimated_hours: 15,
  },
  {
    name: 'API Authentication',
    slug: 'api-authentication',
    type: 'skill' as const,
    difficulty_level: 'advanced' as const,
    description: 'Securing APIs with tokens, OAuth, and other auth methods',
    estimated_hours: 10,
  },

  // Design Patterns (Advanced)
  {
    name: 'Design Patterns',
    slug: 'design-patterns',
    type: 'topic' as const,
    difficulty_level: 'advanced' as const,
    description: 'Reusable solutions to common software design problems',
    estimated_hours: 20,
  },
  {
    name: 'MVC Pattern',
    slug: 'mvc-pattern',
    type: 'technique' as const,
    difficulty_level: 'advanced' as const,
    description: 'Model-View-Controller architectural pattern',
    estimated_hours: 8,
  },

  // AI/ML Foundations (Intermediate/Advanced)
  {
    name: 'Machine Learning Fundamentals',
    slug: 'machine-learning-fundamentals',
    type: 'topic' as const,
    difficulty_level: 'advanced' as const,
    description: 'Core concepts of training models to learn from data',
    estimated_hours: 25,
  },
  {
    name: 'Neural Networks',
    slug: 'neural-networks',
    type: 'skill' as const,
    difficulty_level: 'advanced' as const,
    description: 'Layered networks inspired by biological neurons',
    estimated_hours: 20,
  },
  {
    name: 'Natural Language Processing',
    slug: 'natural-language-processing',
    type: 'skill' as const,
    difficulty_level: 'advanced' as const,
    description: 'Processing and analyzing human language with computers',
    estimated_hours: 18,
  },
];

// Relationships (prerequisite, part_of, builds_on, related_to)
const SEED_RELATIONSHIPS = [
  // Foundational prerequisites
  {
    source: 'variables-and-data-types',
    target: 'control-flow',
    type: 'prerequisite',
    strength: 0.9,
  },
  { source: 'control-flow', target: 'functions-and-methods', type: 'prerequisite', strength: 0.8 },
  { source: 'control-flow', target: 'arrays-and-lists', type: 'prerequisite', strength: 0.7 },

  // OOP hierarchy
  {
    source: 'functions-and-methods',
    target: 'classes-and-objects',
    type: 'prerequisite',
    strength: 0.9,
  },
  {
    source: 'classes-and-objects',
    target: 'object-oriented-programming',
    type: 'part_of',
    strength: 0.9,
  },
  { source: 'inheritance', target: 'object-oriented-programming', type: 'part_of', strength: 0.8 },
  {
    source: 'encapsulation',
    target: 'object-oriented-programming',
    type: 'part_of',
    strength: 0.8,
  },
  { source: 'polymorphism', target: 'object-oriented-programming', type: 'part_of', strength: 0.8 },
  { source: 'classes-and-objects', target: 'inheritance', type: 'prerequisite', strength: 0.9 },
  { source: 'classes-and-objects', target: 'encapsulation', type: 'prerequisite', strength: 0.8 },
  { source: 'inheritance', target: 'polymorphism', type: 'prerequisite', strength: 0.7 },

  // Data structures hierarchy
  { source: 'arrays-and-lists', target: 'data-structures', type: 'part_of', strength: 0.8 },
  { source: 'linked-lists', target: 'data-structures', type: 'part_of', strength: 0.8 },
  { source: 'stacks-and-queues', target: 'data-structures', type: 'part_of', strength: 0.8 },
  { source: 'hash-tables', target: 'data-structures', type: 'part_of', strength: 0.8 },
  { source: 'trees-and-graphs', target: 'data-structures', type: 'part_of', strength: 0.9 },
  { source: 'arrays-and-lists', target: 'linked-lists', type: 'prerequisite', strength: 0.6 },
  { source: 'arrays-and-lists', target: 'stacks-and-queues', type: 'prerequisite', strength: 0.7 },

  // Algorithms hierarchy
  { source: 'searching-algorithms', target: 'algorithms', type: 'part_of', strength: 0.8 },
  { source: 'sorting-algorithms', target: 'algorithms', type: 'part_of', strength: 0.8 },
  { source: 'recursion', target: 'algorithms', type: 'part_of', strength: 0.9 },
  { source: 'dynamic-programming', target: 'algorithms', type: 'part_of', strength: 0.8 },
  { source: 'functions-and-methods', target: 'recursion', type: 'prerequisite', strength: 0.9 },
  { source: 'recursion', target: 'dynamic-programming', type: 'prerequisite', strength: 0.8 },
  {
    source: 'arrays-and-lists',
    target: 'searching-algorithms',
    type: 'prerequisite',
    strength: 0.7,
  },
  { source: 'arrays-and-lists', target: 'sorting-algorithms', type: 'prerequisite', strength: 0.7 },

  // Web dev chain
  { source: 'html', target: 'css', type: 'prerequisite', strength: 0.7 },
  { source: 'html', target: 'javascript', type: 'prerequisite', strength: 0.8 },
  { source: 'javascript', target: 'dom-manipulation', type: 'prerequisite', strength: 0.9 },
  { source: 'javascript', target: 'event-handling', type: 'prerequisite', strength: 0.8 },
  {
    source: 'functions-and-methods',
    target: 'asynchronous-javascript',
    type: 'prerequisite',
    strength: 0.9,
  },
  { source: 'javascript', target: 'asynchronous-javascript', type: 'prerequisite', strength: 0.9 },

  // Python
  {
    source: 'variables-and-data-types',
    target: 'python-programming',
    type: 'related_to',
    strength: 0.6,
  },
  {
    source: 'python-programming',
    target: 'python-data-structures',
    type: 'prerequisite',
    strength: 0.9,
  },
  {
    source: 'python-data-structures',
    target: 'python-libraries',
    type: 'prerequisite',
    strength: 0.7,
  },

  // Databases
  { source: 'sql', target: 'databases', type: 'part_of', strength: 0.9 },
  { source: 'nosql-databases', target: 'databases', type: 'part_of', strength: 0.8 },
  { source: 'sql', target: 'nosql-databases', type: 'alternative_to', strength: 0.7 },

  // Testing
  { source: 'unit-testing', target: 'software-testing', type: 'part_of', strength: 0.9 },
  { source: 'test-driven-development', target: 'software-testing', type: 'part_of', strength: 0.8 },
  {
    source: 'unit-testing',
    target: 'test-driven-development',
    type: 'prerequisite',
    strength: 0.8,
  },

  // Advanced topics
  { source: 'javascript', target: 'restful-apis', type: 'prerequisite', strength: 0.7 },
  {
    source: 'asynchronous-javascript',
    target: 'restful-apis',
    type: 'prerequisite',
    strength: 0.8,
  },
  { source: 'restful-apis', target: 'api-authentication', type: 'prerequisite', strength: 0.8 },
  {
    source: 'object-oriented-programming',
    target: 'design-patterns',
    type: 'prerequisite',
    strength: 0.9,
  },
  { source: 'mvc-pattern', target: 'design-patterns', type: 'part_of', strength: 0.8 },

  // AI/ML
  {
    source: 'python-programming',
    target: 'machine-learning-fundamentals',
    type: 'prerequisite',
    strength: 0.9,
  },
  {
    source: 'algorithms',
    target: 'machine-learning-fundamentals',
    type: 'prerequisite',
    strength: 0.8,
  },
  {
    source: 'machine-learning-fundamentals',
    target: 'neural-networks',
    type: 'prerequisite',
    strength: 0.9,
  },
  {
    source: 'machine-learning-fundamentals',
    target: 'natural-language-processing',
    type: 'prerequisite',
    strength: 0.8,
  },

  // Cross-domain relationships
  { source: 'data-structures', target: 'algorithms', type: 'related_to', strength: 0.9 },
  {
    source: 'object-oriented-programming',
    target: 'python-programming',
    type: 'related_to',
    strength: 0.7,
  },
  {
    source: 'object-oriented-programming',
    target: 'javascript',
    type: 'related_to',
    strength: 0.7,
  },
];

async function seedKnowledgeGraph() {
  console.log('🌱 Starting Knowledge Graph Seeding...\n');

  const conceptIdMap = new Map<string, string>();

  // Step 1: Create all concepts
  console.log('📝 Creating concepts...');
  let createdCount = 0;
  let skippedCount = 0;

  for (const concept of SEED_CONCEPTS) {
    // Check if concept already exists
    const { data: existing } = await supabase
      .from('knowledge_graph_concepts')
      .select('id')
      .eq('slug', concept.slug)
      .single();

    if (existing) {
      console.log(`  ⏭️  Skipped: ${concept.name} (already exists)`);
      conceptIdMap.set(concept.slug, existing.id);
      skippedCount++;
      continue;
    }

    // Create concept
    const { data, error } = await supabase
      .from('knowledge_graph_concepts')
      .insert([concept])
      .select('id')
      .single();

    if (error) {
      console.error(`  ❌ Error creating ${concept.name}:`, error);
      continue;
    }

    conceptIdMap.set(concept.slug, data.id);
    createdCount++;
    console.log(`  ✅ Created: ${concept.name}`);
  }

  console.log(`\n📊 Concepts: ${createdCount} created, ${skippedCount} skipped\n`);

  // Step 2: Create relationships
  console.log('🔗 Creating relationships...');
  let relCreatedCount = 0;
  let relSkippedCount = 0;

  for (const rel of SEED_RELATIONSHIPS) {
    const sourceId = conceptIdMap.get(rel.source);
    const targetId = conceptIdMap.get(rel.target);

    if (!sourceId || !targetId) {
      console.log(`  ⏭️  Skipped: ${rel.source} -> ${rel.target} (concepts not found)`);
      relSkippedCount++;
      continue;
    }

    // Check if relationship already exists
    const { data: existing } = await supabase
      .from('knowledge_graph_concept_relationships')
      .select('id')
      .eq('source_concept_id', sourceId)
      .eq('target_concept_id', targetId)
      .eq('relationship_type', rel.type)
      .single();

    if (existing) {
      relSkippedCount++;
      continue;
    }

    // Create relationship
    const { error } = await supabase.from('knowledge_graph_concept_relationships').insert([
      {
        source_concept_id: sourceId,
        target_concept_id: targetId,
        relationship_type: rel.type,
        strength: rel.strength,
      },
    ]);

    if (error) {
      console.error(`  ❌ Error creating relationship ${rel.source} -> ${rel.target}:`, error);
      relSkippedCount++;
      continue;
    }

    relCreatedCount++;
    console.log(`  ✅ ${rel.source} --[${rel.type}]--> ${rel.target}`);
  }

  console.log(`\n📊 Relationships: ${relCreatedCount} created, ${relSkippedCount} skipped\n`);

  console.log('✨ Knowledge Graph Seeding Complete!');
  console.log(`\nTotal:`);
  console.log(`  - ${createdCount + skippedCount} concepts`);
  console.log(`  - ${relCreatedCount + relSkippedCount} relationships`);
}

// Run seeding
seedKnowledgeGraph().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
