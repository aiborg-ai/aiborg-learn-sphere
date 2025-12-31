-- Seed data for Knowledge Graph (to be executed in Supabase SQL Editor)

-- Insert seed concepts
INSERT INTO public.concepts (name, slug, description, type, difficulty_level, estimated_hours, is_active)
VALUES
  -- Programming Fundamentals
  ('Variables', 'variables', 'Understanding how to store and manipulate data using variables', 'skill', 'beginner', 2.0, true),
  ('Data Types', 'data-types', 'Understanding different types of data (strings, numbers, booleans, etc.)', 'skill', 'beginner', 3.0, true),
  ('Conditional Logic', 'conditional-logic', 'Using if/else statements to control program flow', 'skill', 'beginner', 4.0, true),
  ('Loops', 'loops', 'Repeating code execution with for and while loops', 'skill', 'beginner', 5.0, true),
  ('Functions', 'functions', 'Creating reusable blocks of code with functions', 'skill', 'intermediate', 6.0, true),
  ('Arrays and Lists', 'arrays-lists', 'Working with ordered collections of data', 'skill', 'intermediate', 5.0, true),
  ('Object-Oriented Programming', 'oop', 'Understanding classes, objects, and inheritance', 'technique', 'intermediate', 12.0, true),
  ('Algorithms', 'algorithms', 'Problem-solving approaches and computational thinking', 'topic', 'intermediate', 20.0, true),
  ('Data Structures', 'data-structures', 'Organizing data efficiently (trees, graphs, hash tables)', 'topic', 'advanced', 25.0, true),
  ('API Integration', 'api-integration', 'Connecting to and using external APIs', 'skill', 'intermediate', 8.0, true),

  -- Python Specific
  ('Python Basics', 'python-basics', 'Fundamental Python syntax and concepts', 'technology', 'beginner', 10.0, true),
  ('Python Lists', 'python-lists', 'Working with Python list data structure', 'skill', 'beginner', 3.0, true),
  ('Python Dictionaries', 'python-dictionaries', 'Using key-value pairs in Python', 'skill', 'beginner', 4.0, true),

  -- JavaScript Specific
  ('JavaScript Basics', 'javascript-basics', 'Fundamental JavaScript syntax and concepts', 'technology', 'beginner', 10.0, true),
  ('Asynchronous JavaScript', 'async-javascript', 'Promises, async/await, and callbacks', 'technique', 'intermediate', 8.0, true)
ON CONFLICT (slug) DO NOTHING;

-- Insert seed relationships
DO $$
DECLARE
  var_variables UUID;
  var_data_types UUID;
  var_conditional UUID;
  var_loops UUID;
  var_functions UUID;
  var_arrays UUID;
  var_oop UUID;
  var_algorithms UUID;
  var_data_structures UUID;
  var_api UUID;
  var_python_basics UUID;
  var_python_lists UUID;
  var_python_dicts UUID;
  var_js_basics UUID;
  var_async_js UUID;
BEGIN
  -- Fetch all concept IDs
  SELECT id INTO var_variables FROM public.concepts WHERE slug = 'variables';
  SELECT id INTO var_data_types FROM public.concepts WHERE slug = 'data-types';
  SELECT id INTO var_conditional FROM public.concepts WHERE slug = 'conditional-logic';
  SELECT id INTO var_loops FROM public.concepts WHERE slug = 'loops';
  SELECT id INTO var_functions FROM public.concepts WHERE slug = 'functions';
  SELECT id INTO var_arrays FROM public.concepts WHERE slug = 'arrays-lists';
  SELECT id INTO var_oop FROM public.concepts WHERE slug = 'oop';
  SELECT id INTO var_algorithms FROM public.concepts WHERE slug = 'algorithms';
  SELECT id INTO var_data_structures FROM public.concepts WHERE slug = 'data-structures';
  SELECT id INTO var_api FROM public.concepts WHERE slug = 'api-integration';
  SELECT id INTO var_python_basics FROM public.concepts WHERE slug = 'python-basics';
  SELECT id INTO var_python_lists FROM public.concepts WHERE slug = 'python-lists';
  SELECT id INTO var_python_dicts FROM public.concepts WHERE slug = 'python-dictionaries';
  SELECT id INTO var_js_basics FROM public.concepts WHERE slug = 'javascript-basics';
  SELECT id INTO var_async_js FROM public.concepts WHERE slug = 'async-javascript';

  -- Insert prerequisite relationships
  INSERT INTO public.concept_relationships (source_concept_id, target_concept_id, relationship_type, strength, description)
  VALUES
    -- Prerequisites
    (var_variables, var_data_types, 'prerequisite', 0.9, 'Must understand variables before working with different data types'),
    (var_data_types, var_conditional, 'prerequisite', 0.8, 'Must understand data types to write conditional logic'),
    (var_conditional, var_loops, 'prerequisite', 0.7, 'Conditional logic is foundational to understanding loops'),
    (var_variables, var_loops, 'prerequisite', 0.8, 'Must understand variables to use them in loops'),
    (var_loops, var_functions, 'prerequisite', 0.6, 'Understanding loops helps when learning functions'),
    (var_variables, var_functions, 'prerequisite', 0.9, 'Functions use variables extensively'),
    (var_data_types, var_arrays, 'prerequisite', 0.9, 'Arrays are a data type'),
    (var_functions, var_oop, 'prerequisite', 0.9, 'Must understand functions before learning OOP'),
    (var_arrays, var_data_structures, 'prerequisite', 0.8, 'Arrays are the simplest data structure'),
    (var_loops, var_algorithms, 'prerequisite', 0.7, 'Algorithms often use loops'),
    (var_functions, var_algorithms, 'prerequisite', 0.8, 'Algorithms are implemented as functions'),
    (var_functions, var_api, 'prerequisite', 0.7, 'API calls are typically made with functions'),
    (var_js_basics, var_async_js, 'prerequisite', 0.9, 'Must learn JavaScript basics before async concepts')
  ON CONFLICT (source_concept_id, target_concept_id, relationship_type) DO NOTHING;

  -- Insert "part_of" hierarchical relationships
  INSERT INTO public.concept_relationships (source_concept_id, target_concept_id, relationship_type, strength, description)
  VALUES
    (var_python_basics, var_python_lists, 'part_of', 0.8, 'Lists are a fundamental part of Python'),
    (var_python_basics, var_python_dicts, 'part_of', 0.8, 'Dictionaries are a fundamental part of Python')
  ON CONFLICT (source_concept_id, target_concept_id, relationship_type) DO NOTHING;

  -- Insert "builds_on" relationships
  INSERT INTO public.concept_relationships (source_concept_id, target_concept_id, relationship_type, strength, description)
  VALUES
    (var_conditional, var_algorithms, 'builds_on', 0.7, 'Algorithms use conditional logic extensively'),
    (var_arrays, var_data_structures, 'builds_on', 0.9, 'Complex data structures extend array concepts')
  ON CONFLICT (source_concept_id, target_concept_id, relationship_type) DO NOTHING;

  -- Insert "related_to" relationships
  INSERT INTO public.concept_relationships (source_concept_id, target_concept_id, relationship_type, strength, description)
  VALUES
    (var_python_lists, var_arrays, 'related_to', 0.9, 'Python lists implement the array concept'),
    (var_python_basics, var_variables, 'related_to', 0.8, 'Python teaches variables in a specific way'),
    (var_js_basics, var_variables, 'related_to', 0.8, 'JavaScript teaches variables in a specific way'),
    (var_oop, var_data_structures, 'related_to', 0.6, 'OOP is often used to implement data structures')
  ON CONFLICT (source_concept_id, target_concept_id, relationship_type) DO NOTHING;

END $$;

-- Verify insertion
SELECT 'Concepts inserted:', COUNT(*) FROM public.concepts;
SELECT 'Relationships inserted:', COUNT(*) FROM public.concept_relationships;

-- Show summary
SELECT relationship_type, COUNT(*) as count
FROM public.concept_relationships
GROUP BY relationship_type
ORDER BY relationship_type;
