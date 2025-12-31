/**
 * Script to seed initial Knowledge Graph data
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://afrulkxxzcmngbrdfuzj.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmcnVsa3h4emNtbmdicmRmdXpqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzEzNzIxNiwiZXhwIjoyMDY4NzEzMjE2fQ.00fzC92PHO8CjMYvtMJ52BJTYirTQgXqOhDuR5fVQd0';

interface Concept {
  name: string;
  slug: string;
  description: string;
  type: 'skill' | 'topic' | 'technology' | 'technique';
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  estimated_hours: number;
}

async function seedData() {
  console.log('🌱 Seeding Knowledge Graph data...\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Define seed concepts
  const concepts: Concept[] = [
    // Programming Fundamentals
    {
      name: 'Variables',
      slug: 'variables',
      description: 'Understanding how to store and manipulate data using variables',
      type: 'skill',
      difficulty_level: 'beginner',
      estimated_hours: 2.0,
    },
    {
      name: 'Data Types',
      slug: 'data-types',
      description: 'Understanding different types of data (strings, numbers, booleans, etc.)',
      type: 'skill',
      difficulty_level: 'beginner',
      estimated_hours: 3.0,
    },
    {
      name: 'Conditional Logic',
      slug: 'conditional-logic',
      description: 'Using if/else statements to control program flow',
      type: 'skill',
      difficulty_level: 'beginner',
      estimated_hours: 4.0,
    },
    {
      name: 'Loops',
      slug: 'loops',
      description: 'Repeating code execution with for and while loops',
      type: 'skill',
      difficulty_level: 'beginner',
      estimated_hours: 5.0,
    },
    {
      name: 'Functions',
      slug: 'functions',
      description: 'Creating reusable blocks of code with functions',
      type: 'skill',
      difficulty_level: 'intermediate',
      estimated_hours: 6.0,
    },
    {
      name: 'Arrays and Lists',
      slug: 'arrays-lists',
      description: 'Working with ordered collections of data',
      type: 'skill',
      difficulty_level: 'intermediate',
      estimated_hours: 5.0,
    },
    {
      name: 'Object-Oriented Programming',
      slug: 'oop',
      description: 'Understanding classes, objects, and inheritance',
      type: 'technique',
      difficulty_level: 'intermediate',
      estimated_hours: 12.0,
    },
    {
      name: 'Algorithms',
      slug: 'algorithms',
      description: 'Problem-solving approaches and computational thinking',
      type: 'topic',
      difficulty_level: 'intermediate',
      estimated_hours: 20.0,
    },
    {
      name: 'Data Structures',
      slug: 'data-structures',
      description: 'Organizing data efficiently (trees, graphs, hash tables)',
      type: 'topic',
      difficulty_level: 'advanced',
      estimated_hours: 25.0,
    },
    {
      name: 'API Integration',
      slug: 'api-integration',
      description: 'Connecting to and using external APIs',
      type: 'skill',
      difficulty_level: 'intermediate',
      estimated_hours: 8.0,
    },
    // Python Specific
    {
      name: 'Python Basics',
      slug: 'python-basics',
      description: 'Fundamental Python syntax and concepts',
      type: 'technology',
      difficulty_level: 'beginner',
      estimated_hours: 10.0,
    },
    {
      name: 'Python Lists',
      slug: 'python-lists',
      description: 'Working with Python list data structure',
      type: 'skill',
      difficulty_level: 'beginner',
      estimated_hours: 3.0,
    },
    {
      name: 'Python Dictionaries',
      slug: 'python-dictionaries',
      description: 'Using key-value pairs in Python',
      type: 'skill',
      difficulty_level: 'beginner',
      estimated_hours: 4.0,
    },
    // JavaScript Specific
    {
      name: 'JavaScript Basics',
      slug: 'javascript-basics',
      description: 'Fundamental JavaScript syntax and concepts',
      type: 'technology',
      difficulty_level: 'beginner',
      estimated_hours: 10.0,
    },
    {
      name: 'Asynchronous JavaScript',
      slug: 'async-javascript',
      description: 'Promises, async/await, and callbacks',
      type: 'technique',
      difficulty_level: 'intermediate',
      estimated_hours: 8.0,
    },
  ];

  // Insert concepts
  console.log(`📚 Inserting ${concepts.length} concepts...`);
  const { data: insertedConcepts, error: conceptsError } = await supabase
    .from('concepts')
    .upsert(concepts, { onConflict: 'slug' })
    .select();

  if (conceptsError) {
    console.error('❌ Error inserting concepts:', conceptsError.message);
    process.exit(1);
  }

  console.log(`✅ Inserted ${insertedConcepts?.length || 0} concepts\n`);

  // Create a map of slug → id for relationships
  const conceptMap = new Map(insertedConcepts?.map(c => [c.slug, c.id]) || []);

  // Define relationships
  interface Relationship {
    source_slug: string;
    target_slug: string;
    relationship_type: 'prerequisite' | 'related_to' | 'part_of' | 'builds_on' | 'alternative_to';
    strength: number;
    description: string;
  }

  const relationships: Relationship[] = [
    // Prerequisites
    {
      source_slug: 'variables',
      target_slug: 'data-types',
      relationship_type: 'prerequisite',
      strength: 0.9,
      description: 'Must understand variables before working with different data types',
    },
    {
      source_slug: 'data-types',
      target_slug: 'conditional-logic',
      relationship_type: 'prerequisite',
      strength: 0.8,
      description: 'Must understand data types to write conditional logic',
    },
    {
      source_slug: 'conditional-logic',
      target_slug: 'loops',
      relationship_type: 'prerequisite',
      strength: 0.7,
      description: 'Conditional logic is foundational to understanding loops',
    },
    {
      source_slug: 'variables',
      target_slug: 'loops',
      relationship_type: 'prerequisite',
      strength: 0.8,
      description: 'Must understand variables to use them in loops',
    },
    {
      source_slug: 'loops',
      target_slug: 'functions',
      relationship_type: 'prerequisite',
      strength: 0.6,
      description: 'Understanding loops helps when learning functions',
    },
    {
      source_slug: 'variables',
      target_slug: 'functions',
      relationship_type: 'prerequisite',
      strength: 0.9,
      description: 'Functions use variables extensively',
    },
    {
      source_slug: 'data-types',
      target_slug: 'arrays-lists',
      relationship_type: 'prerequisite',
      strength: 0.9,
      description: 'Arrays are a data type',
    },
    {
      source_slug: 'functions',
      target_slug: 'oop',
      relationship_type: 'prerequisite',
      strength: 0.9,
      description: 'Must understand functions before learning OOP',
    },
    {
      source_slug: 'arrays-lists',
      target_slug: 'data-structures',
      relationship_type: 'prerequisite',
      strength: 0.8,
      description: 'Arrays are the simplest data structure',
    },
    {
      source_slug: 'loops',
      target_slug: 'algorithms',
      relationship_type: 'prerequisite',
      strength: 0.7,
      description: 'Algorithms often use loops',
    },
    {
      source_slug: 'functions',
      target_slug: 'algorithms',
      relationship_type: 'prerequisite',
      strength: 0.8,
      description: 'Algorithms are implemented as functions',
    },
    {
      source_slug: 'functions',
      target_slug: 'api-integration',
      relationship_type: 'prerequisite',
      strength: 0.7,
      description: 'API calls are typically made with functions',
    },
    {
      source_slug: 'javascript-basics',
      target_slug: 'async-javascript',
      relationship_type: 'prerequisite',
      strength: 0.9,
      description: 'Must learn JavaScript basics before async concepts',
    },
    // Part-of relationships
    {
      source_slug: 'python-basics',
      target_slug: 'python-lists',
      relationship_type: 'part_of',
      strength: 0.8,
      description: 'Lists are a fundamental part of Python',
    },
    {
      source_slug: 'python-basics',
      target_slug: 'python-dictionaries',
      relationship_type: 'part_of',
      strength: 0.8,
      description: 'Dictionaries are a fundamental part of Python',
    },
    // Builds-on relationships
    {
      source_slug: 'conditional-logic',
      target_slug: 'algorithms',
      relationship_type: 'builds_on',
      strength: 0.7,
      description: 'Algorithms use conditional logic extensively',
    },
    {
      source_slug: 'arrays-lists',
      target_slug: 'data-structures',
      relationship_type: 'builds_on',
      strength: 0.9,
      description: 'Complex data structures extend array concepts',
    },
    // Related-to relationships
    {
      source_slug: 'python-lists',
      target_slug: 'arrays-lists',
      relationship_type: 'related_to',
      strength: 0.9,
      description: 'Python lists implement the array concept',
    },
    {
      source_slug: 'python-basics',
      target_slug: 'variables',
      relationship_type: 'related_to',
      strength: 0.8,
      description: 'Python teaches variables in a specific way',
    },
    {
      source_slug: 'javascript-basics',
      target_slug: 'variables',
      relationship_type: 'related_to',
      strength: 0.8,
      description: 'JavaScript teaches variables in a specific way',
    },
    {
      source_slug: 'oop',
      target_slug: 'data-structures',
      relationship_type: 'related_to',
      strength: 0.6,
      description: 'OOP is often used to implement data structures',
    },
  ];

  // Insert relationships
  console.log(`🔗 Inserting ${relationships.length} relationships...`);

  const relationshipData = relationships.map(r => ({
    source_concept_id: conceptMap.get(r.source_slug),
    target_concept_id: conceptMap.get(r.target_slug),
    relationship_type: r.relationship_type,
    strength: r.strength,
    description: r.description,
  }));

  const { data: insertedRelationships, error: relsError } = await supabase
    .from('concept_relationships')
    .upsert(relationshipData, {
      onConflict: 'source_concept_id,target_concept_id,relationship_type',
    })
    .select();

  if (relsError) {
    console.error('❌ Error inserting relationships:', relsError.message);
    process.exit(1);
  }

  console.log(`✅ Inserted ${insertedRelationships?.length || 0} relationships\n`);

  // Summary
  console.log('📊 Summary by relationship type:');
  const typeCounts = relationshipData.reduce((acc: Record<string, number>, r) => {
    const type = r.relationship_type;
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  Object.entries(typeCounts).forEach(([type, count]) => {
    console.log(`   ${type}: ${count}`);
  });

  console.log('\n✨ Seed data inserted successfully!\n');
}

seedData()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  });
