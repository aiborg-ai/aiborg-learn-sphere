-- ============================================================================
-- AIBORGLingo - New Lessons Seed Data
-- 12 new lessons with 6 questions each (72 questions total)
-- ============================================================================

-- ============================================================================
-- LESSON 19: RAG - Retrieval Augmented Generation
-- ============================================================================
INSERT INTO lingo_lessons (lesson_id, title, skill, duration, xp_reward, description, sort_order, is_active)
VALUES ('ai-rag-01', 'RAG: Retrieval Augmented Generation', 'LLMs', '7 min', 45, 'Learn how RAG systems combine retrieval with generation for accurate AI responses.', 19, true)
ON CONFLICT (lesson_id) DO NOTHING;

-- Questions for RAG lesson
INSERT INTO lingo_questions (lesson_id, question_type, question_text, options, correct_answer, explanation, hint, sort_order)
SELECT l.id, 'multiple_choice',
  'What does RAG stand for in AI?',
  ARRAY['Random Answer Generator', 'Retrieval Augmented Generation', 'Recursive Algorithm Graph', 'Real-time AI Gateway'],
  'Retrieval Augmented Generation',
  'RAG stands for Retrieval Augmented Generation - a technique that combines information retrieval with text generation.',
  'Think about combining search with generation',
  1
FROM lingo_lessons l WHERE l.lesson_id = 'ai-rag-01'
ON CONFLICT DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, correct_answer, accepted_answers, explanation, hint, sort_order)
SELECT l.id, 'fill_blank',
  'RAG helps reduce AI _____ by grounding responses in retrieved documents.',
  'hallucinations',
  ARRAY['hallucinations', 'hallucination', 'errors', 'mistakes'],
  'RAG reduces hallucinations by providing factual context from retrieved documents.',
  'What do we call when AI makes things up?',
  2
FROM lingo_lessons l WHERE l.lesson_id = 'ai-rag-01'
ON CONFLICT DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, matching_pairs, explanation, hint, sort_order)
SELECT l.id, 'matching',
  'Match the RAG components with their functions:',
  '[{"left": "Retriever", "right": "Finds relevant documents"}, {"left": "Generator", "right": "Creates text responses"}, {"left": "Vector DB", "right": "Stores embeddings"}, {"left": "Chunking", "right": "Splits documents"}]'::jsonb,
  'Each component plays a specific role in the RAG pipeline.',
  'Think about the RAG workflow',
  3
FROM lingo_lessons l WHERE l.lesson_id = 'ai-rag-01'
ON CONFLICT DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, ordering_items, explanation, hint, sort_order)
SELECT l.id, 'ordering',
  'Put the RAG process steps in order:',
  ARRAY['User asks question', 'Query is embedded', 'Relevant docs retrieved', 'Context added to prompt', 'LLM generates response'],
  'The RAG process follows a specific sequence from query to response.',
  'Start with the user input',
  4
FROM lingo_lessons l WHERE l.lesson_id = 'ai-rag-01'
ON CONFLICT DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, options, correct_answer, explanation, hint, sort_order)
SELECT l.id, 'multiple_choice',
  'Which is NOT a benefit of RAG systems?',
  ARRAY['Reduces hallucinations', 'Provides citations', 'No need for training data', 'Access to current information'],
  'No need for training data',
  'RAG still requires training data for the LLM; it adds retrieval capabilities on top.',
  'RAG enhances but doesn''t replace training',
  5
FROM lingo_lessons l WHERE l.lesson_id = 'ai-rag-01'
ON CONFLICT DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, free_response_config, explanation, hint, sort_order)
SELECT l.id, 'free_response',
  'Explain why a company might use RAG instead of fine-tuning their AI model.',
  '{"ideal_answer": "Companies use RAG because it allows them to incorporate up-to-date knowledge without retraining, provides traceable sources for compliance, costs less than fine-tuning, and keeps proprietary data separate from the model.", "rubric": "RAG vs fine-tuning comparison", "min_length": 50, "max_length": 300, "pass_score": 0.6}'::jsonb,
  'RAG offers flexibility and cost advantages over fine-tuning.',
  'Consider cost, updates, and transparency',
  6
FROM lingo_lessons l WHERE l.lesson_id = 'ai-rag-01'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- LESSON 20: Fine-Tuning LLMs
-- ============================================================================
INSERT INTO lingo_lessons (lesson_id, title, skill, duration, xp_reward, description, sort_order, is_active)
VALUES ('ai-finetuning-01', 'Fine-Tuning LLMs', 'LLMs', '8 min', 50, 'Understand how to customize large language models for specific tasks.', 20, true)
ON CONFLICT (lesson_id) DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, options, correct_answer, explanation, hint, sort_order)
SELECT l.id, 'multiple_choice',
  'What is fine-tuning in the context of LLMs?',
  ARRAY['Building a model from scratch', 'Further training a pre-trained model on specific data', 'Adjusting model temperature', 'Compressing model size'],
  'Further training a pre-trained model on specific data',
  'Fine-tuning adapts a pre-trained model to perform better on specific tasks or domains.',
  'Think about specialization',
  1
FROM lingo_lessons l WHERE l.lesson_id = 'ai-finetuning-01'
ON CONFLICT DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, correct_answer, accepted_answers, explanation, hint, sort_order)
SELECT l.id, 'fill_blank',
  'LoRA stands for Low-Rank _____.',
  'Adaptation',
  ARRAY['Adaptation', 'adaptation'],
  'LoRA (Low-Rank Adaptation) is an efficient fine-tuning technique that reduces parameters.',
  'Think about adjusting to new tasks',
  2
FROM lingo_lessons l WHERE l.lesson_id = 'ai-finetuning-01'
ON CONFLICT DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, matching_pairs, explanation, hint, sort_order)
SELECT l.id, 'matching',
  'Match fine-tuning methods with descriptions:',
  '[{"left": "Full fine-tuning", "right": "Updates all parameters"}, {"left": "LoRA", "right": "Low-rank matrix updates"}, {"left": "Prefix tuning", "right": "Adds learnable tokens"}, {"left": "Adapter layers", "right": "Small modules between layers"}]'::jsonb,
  'Different fine-tuning methods have different trade-offs.',
  'Consider parameter efficiency',
  3
FROM lingo_lessons l WHERE l.lesson_id = 'ai-finetuning-01'
ON CONFLICT DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, ordering_items, explanation, hint, sort_order)
SELECT l.id, 'ordering',
  'Order the fine-tuning workflow steps:',
  ARRAY['Prepare training dataset', 'Choose base model', 'Configure hyperparameters', 'Train model', 'Evaluate and iterate'],
  'Fine-tuning follows a structured workflow.',
  'Data comes first',
  4
FROM lingo_lessons l WHERE l.lesson_id = 'ai-finetuning-01'
ON CONFLICT DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, options, correct_answer, explanation, hint, sort_order)
SELECT l.id, 'multiple_choice',
  'Why might you choose fine-tuning over prompting?',
  ARRAY['It''s always cheaper', 'Better for complex, consistent behaviors', 'Requires no data', 'Works with any model'],
  'Better for complex, consistent behaviors',
  'Fine-tuning excels when you need consistent specialized behavior across many queries.',
  'Think about reliability and specialization',
  5
FROM lingo_lessons l WHERE l.lesson_id = 'ai-finetuning-01'
ON CONFLICT DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, free_response_config, explanation, hint, sort_order)
SELECT l.id, 'free_response',
  'What are the key considerations when preparing a dataset for fine-tuning an LLM?',
  '{"ideal_answer": "Key considerations include data quality and diversity, proper formatting matching the task, sufficient quantity (hundreds to thousands of examples), avoiding bias, including edge cases, and ensuring data is clean and well-labeled.", "rubric": "Fine-tuning dataset preparation", "min_length": 50, "max_length": 300, "pass_score": 0.6}'::jsonb,
  'Dataset quality directly impacts fine-tuning results.',
  'Consider quality, quantity, and format',
  6
FROM lingo_lessons l WHERE l.lesson_id = 'ai-finetuning-01'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- LESSON 21: AI Agents & Tool Use
-- ============================================================================
INSERT INTO lingo_lessons (lesson_id, title, skill, duration, xp_reward, description, sort_order, is_active)
VALUES ('ai-agents-01', 'AI Agents & Tool Use', 'Advanced', '8 min', 50, 'Explore how AI agents use tools to complete complex tasks autonomously.', 21, true)
ON CONFLICT (lesson_id) DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, options, correct_answer, explanation, hint, sort_order)
SELECT l.id, 'multiple_choice',
  'What defines an AI agent compared to a simple chatbot?',
  ARRAY['Larger model size', 'Ability to take actions and use tools', 'Faster response time', 'Better grammar'],
  'Ability to take actions and use tools',
  'AI agents can autonomously take actions, use external tools, and complete multi-step tasks.',
  'Think about autonomy and actions',
  1
FROM lingo_lessons l WHERE l.lesson_id = 'ai-agents-01'
ON CONFLICT DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, correct_answer, accepted_answers, explanation, hint, sort_order)
SELECT l.id, 'fill_blank',
  'The process where an AI decides which tool to use is called tool _____.',
  'calling',
  ARRAY['calling', 'selection', 'invocation'],
  'Tool calling (or function calling) is how AI selects and invokes external tools.',
  'What does the AI do with tools?',
  2
FROM lingo_lessons l WHERE l.lesson_id = 'ai-agents-01'
ON CONFLICT DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, matching_pairs, explanation, hint, sort_order)
SELECT l.id, 'matching',
  'Match agent components with their roles:',
  '[{"left": "Planning", "right": "Breaking down tasks"}, {"left": "Memory", "right": "Storing context"}, {"left": "Tools", "right": "External capabilities"}, {"left": "Execution", "right": "Carrying out actions"}]'::jsonb,
  'Agents have several key components working together.',
  'Think about what agents need to work',
  3
FROM lingo_lessons l WHERE l.lesson_id = 'ai-agents-01'
ON CONFLICT DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, ordering_items, explanation, hint, sort_order)
SELECT l.id, 'ordering',
  'Order the agent reasoning loop:',
  ARRAY['Receive task', 'Plan approach', 'Select tool', 'Execute action', 'Observe result', 'Continue or finish'],
  'Agents follow a reasoning and action loop.',
  'Start with the task',
  4
FROM lingo_lessons l WHERE l.lesson_id = 'ai-agents-01'
ON CONFLICT DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, options, correct_answer, explanation, hint, sort_order)
SELECT l.id, 'multiple_choice',
  'Which is a common safety concern with AI agents?',
  ARRAY['Slow response time', 'Unintended autonomous actions', 'High memory usage', 'Limited vocabulary'],
  'Unintended autonomous actions',
  'Agents taking unexpected actions is a key safety concern requiring guardrails.',
  'Think about autonomy risks',
  5
FROM lingo_lessons l WHERE l.lesson_id = 'ai-agents-01'
ON CONFLICT DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, free_response_config, explanation, hint, sort_order)
SELECT l.id, 'free_response',
  'Describe a real-world use case where an AI agent with tools would be more useful than a standard chatbot.',
  '{"ideal_answer": "A customer service agent that can check order status in a database, initiate refunds through a payment system, schedule callbacks in a calendar, and send confirmation emails - all within one conversation, automating the complete support workflow.", "rubric": "AI agent use cases", "min_length": 50, "max_length": 300, "pass_score": 0.6}'::jsonb,
  'Agents excel at multi-step workflows requiring external actions.',
  'Think about tasks needing multiple systems',
  6
FROM lingo_lessons l WHERE l.lesson_id = 'ai-agents-01'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- LESSON 22: Multimodal AI Systems
-- ============================================================================
INSERT INTO lingo_lessons (lesson_id, title, skill, duration, xp_reward, description, sort_order, is_active)
VALUES ('ai-multimodal-01', 'Multimodal AI Systems', 'Vision', '6 min', 40, 'Learn about AI that processes multiple types of input: text, images, audio, and more.', 22, true)
ON CONFLICT (lesson_id) DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, options, correct_answer, explanation, hint, sort_order)
SELECT l.id, 'multiple_choice',
  'What makes an AI system "multimodal"?',
  ARRAY['Very large size', 'Processes multiple input types', 'Multiple programming languages', 'Works on multiple devices'],
  'Processes multiple input types',
  'Multimodal AI can understand and generate across different modalities like text, images, and audio.',
  'Think about "multi" + "mode"',
  1
FROM lingo_lessons l WHERE l.lesson_id = 'ai-multimodal-01'
ON CONFLICT DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, correct_answer, accepted_answers, explanation, hint, sort_order)
SELECT l.id, 'fill_blank',
  'GPT-4V, Claude 3, and Gemini are examples of _____ LLMs.',
  'multimodal',
  ARRAY['multimodal', 'multi-modal', 'vision'],
  'These models can process both text and images, making them multimodal.',
  'What type handles multiple inputs?',
  2
FROM lingo_lessons l WHERE l.lesson_id = 'ai-multimodal-01'
ON CONFLICT DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, matching_pairs, explanation, hint, sort_order)
SELECT l.id, 'matching',
  'Match modalities with AI capabilities:',
  '[{"left": "Vision", "right": "Image understanding"}, {"left": "Audio", "right": "Speech recognition"}, {"left": "Text", "right": "Language processing"}, {"left": "Video", "right": "Temporal visual analysis"}]'::jsonb,
  'Each modality enables different AI capabilities.',
  'Think about what each type enables',
  3
FROM lingo_lessons l WHERE l.lesson_id = 'ai-multimodal-01'
ON CONFLICT DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, ordering_items, explanation, hint, sort_order)
SELECT l.id, 'ordering',
  'Order multimodal processing complexity (simplest to most complex):',
  ARRAY['Text only', 'Text + static images', 'Text + images + audio', 'Real-time video + audio + text'],
  'Multimodal complexity increases with modalities and real-time requirements.',
  'Start with the simplest input type',
  4
FROM lingo_lessons l WHERE l.lesson_id = 'ai-multimodal-01'
ON CONFLICT DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, options, correct_answer, explanation, hint, sort_order)
SELECT l.id, 'multiple_choice',
  'What is a key challenge in multimodal AI?',
  ARRAY['Not enough modalities', 'Aligning representations across modalities', 'Too few applications', 'Only works in English'],
  'Aligning representations across modalities',
  'Ensuring text, image, and audio representations work together coherently is a major challenge.',
  'Think about combining different input types',
  5
FROM lingo_lessons l WHERE l.lesson_id = 'ai-multimodal-01'
ON CONFLICT DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, free_response_config, explanation, hint, sort_order)
SELECT l.id, 'free_response',
  'Give an example of how multimodal AI could help in healthcare.',
  '{"ideal_answer": "Multimodal AI could analyze medical images (X-rays, MRIs) alongside patient notes, lab results, and symptoms to provide more accurate diagnoses. It could also transcribe doctor-patient conversations while viewing scans, creating comprehensive reports.", "rubric": "Healthcare multimodal AI applications", "min_length": 50, "max_length": 300, "pass_score": 0.6}'::jsonb,
  'Healthcare benefits from combining medical images with text records.',
  'Think about medical images and records together',
  6
FROM lingo_lessons l WHERE l.lesson_id = 'ai-multimodal-01'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- LESSON 23: Understanding Embeddings
-- ============================================================================
INSERT INTO lingo_lessons (lesson_id, title, skill, duration, xp_reward, description, sort_order, is_active)
VALUES ('ai-embeddings-01', 'Understanding Embeddings', 'NLP', '6 min', 40, 'Learn how AI represents text, images, and data as numerical vectors.', 23, true)
ON CONFLICT (lesson_id) DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, options, correct_answer, explanation, hint, sort_order)
SELECT l.id, 'multiple_choice',
  'What is an embedding in AI?',
  ARRAY['A way to hide code', 'A numerical vector representation', 'A type of database', 'An encryption method'],
  'A numerical vector representation',
  'Embeddings convert data (text, images) into dense numerical vectors that capture semantic meaning.',
  'Think about representing meaning as numbers',
  1
FROM lingo_lessons l WHERE l.lesson_id = 'ai-embeddings-01'
ON CONFLICT DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, correct_answer, accepted_answers, explanation, hint, sort_order)
SELECT l.id, 'fill_blank',
  'Similar items have _____ embeddings in vector space.',
  'similar',
  ARRAY['similar', 'close', 'nearby', 'related'],
  'Semantically similar items cluster together in embedding space.',
  'Think about proximity',
  2
FROM lingo_lessons l WHERE l.lesson_id = 'ai-embeddings-01'
ON CONFLICT DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, matching_pairs, explanation, hint, sort_order)
SELECT l.id, 'matching',
  'Match embedding concepts:',
  '[{"left": "Dimension", "right": "Vector length (e.g., 1536)"}, {"left": "Cosine similarity", "right": "Measures angle between vectors"}, {"left": "Semantic search", "right": "Finding similar meanings"}, {"left": "Vector database", "right": "Stores embeddings"}]'::jsonb,
  'Understanding these concepts is key to working with embeddings.',
  'Think about vector operations',
  3
FROM lingo_lessons l WHERE l.lesson_id = 'ai-embeddings-01'
ON CONFLICT DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, ordering_items, explanation, hint, sort_order)
SELECT l.id, 'ordering',
  'Order the semantic search process:',
  ARRAY['User enters query', 'Query converted to embedding', 'Search vector database', 'Return similar items', 'Display results'],
  'Semantic search uses embeddings to find similar content.',
  'Start with user input',
  4
FROM lingo_lessons l WHERE l.lesson_id = 'ai-embeddings-01'
ON CONFLICT DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, options, correct_answer, explanation, hint, sort_order)
SELECT l.id, 'multiple_choice',
  'Why are embeddings useful for search?',
  ARRAY['They''re faster than keywords', 'They understand meaning, not just words', 'They use less storage', 'They work offline'],
  'They understand meaning, not just words',
  'Embeddings capture semantic similarity, finding results with similar meaning even if words differ.',
  'Think about meaning vs. exact matching',
  5
FROM lingo_lessons l WHERE l.lesson_id = 'ai-embeddings-01'
ON CONFLICT DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, free_response_config, explanation, hint, sort_order)
SELECT l.id, 'free_response',
  'Explain how embeddings enable recommendation systems.',
  '{"ideal_answer": "Embeddings represent items and users as vectors. When a user interacts with content, their embedding updates. The system recommends items with similar embeddings to what the user liked, finding semantically related content even if it has different keywords.", "rubric": "Embeddings in recommendations", "min_length": 50, "max_length": 300, "pass_score": 0.6}'::jsonb,
  'Recommendations leverage vector similarity to find related items.',
  'Think about similarity and user preferences',
  6
FROM lingo_lessons l WHERE l.lesson_id = 'ai-embeddings-01'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- LESSON 24: Vector Databases
-- ============================================================================
INSERT INTO lingo_lessons (lesson_id, title, skill, duration, xp_reward, description, sort_order, is_active)
VALUES ('ai-vectordb-01', 'Vector Databases', 'Advanced', '7 min', 45, 'Understand specialized databases for storing and searching AI embeddings.', 24, true)
ON CONFLICT (lesson_id) DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, options, correct_answer, explanation, hint, sort_order)
SELECT l.id, 'multiple_choice',
  'What is a vector database optimized for?',
  ARRAY['Storing JSON documents', 'Similarity search on embeddings', 'Relational queries', 'File storage'],
  'Similarity search on embeddings',
  'Vector databases are designed to efficiently store and search high-dimensional vector embeddings.',
  'Think about what embeddings need',
  1
FROM lingo_lessons l WHERE l.lesson_id = 'ai-vectordb-01'
ON CONFLICT DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, correct_answer, accepted_answers, explanation, hint, sort_order)
SELECT l.id, 'fill_blank',
  'Pinecone, Weaviate, and Milvus are examples of _____ databases.',
  'vector',
  ARRAY['vector', 'Vector'],
  'These are popular vector database solutions for AI applications.',
  'What type of data do they store?',
  2
FROM lingo_lessons l WHERE l.lesson_id = 'ai-vectordb-01'
ON CONFLICT DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, matching_pairs, explanation, hint, sort_order)
SELECT l.id, 'matching',
  'Match vector database features:',
  '[{"left": "ANN search", "right": "Fast approximate matching"}, {"left": "Indexing", "right": "Speeds up queries"}, {"left": "Metadata filtering", "right": "Combines vector + traditional search"}, {"left": "Sharding", "right": "Distributes data across nodes"}]'::jsonb,
  'Vector databases have specialized features for embedding operations.',
  'Think about performance and organization',
  3
FROM lingo_lessons l WHERE l.lesson_id = 'ai-vectordb-01'
ON CONFLICT DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, ordering_items, explanation, hint, sort_order)
SELECT l.id, 'ordering',
  'Order vector database usage steps:',
  ARRAY['Generate embeddings', 'Upload to vector DB', 'Create index', 'Query with new embedding', 'Retrieve similar vectors'],
  'Using a vector database follows this workflow.',
  'Generate data before storing',
  4
FROM lingo_lessons l WHERE l.lesson_id = 'ai-vectordb-01'
ON CONFLICT DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, options, correct_answer, explanation, hint, sort_order)
SELECT l.id, 'multiple_choice',
  'What does ANN stand for in vector search?',
  ARRAY['Artificial Neural Network', 'Approximate Nearest Neighbor', 'Automatic Number Naming', 'Advanced Node Navigation'],
  'Approximate Nearest Neighbor',
  'ANN algorithms find similar vectors quickly by accepting approximate (not exact) matches.',
  'Think about speed vs. exactness',
  5
FROM lingo_lessons l WHERE l.lesson_id = 'ai-vectordb-01'
ON CONFLICT DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, free_response_config, explanation, hint, sort_order)
SELECT l.id, 'free_response',
  'Why might a company choose a vector database over storing embeddings in a traditional SQL database?',
  '{"ideal_answer": "Vector databases offer specialized indexing algorithms (like HNSW) for fast similarity search, native support for high-dimensional vectors, optimized distance calculations, and can scale to billions of vectors - features that would be slow or complex to implement in SQL.", "rubric": "Vector DB vs SQL for embeddings", "min_length": 50, "max_length": 300, "pass_score": 0.6}'::jsonb,
  'Vector databases are purpose-built for embedding operations.',
  'Think about performance and specialization',
  6
FROM lingo_lessons l WHERE l.lesson_id = 'ai-vectordb-01'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- LESSON 25: Handling AI Hallucinations
-- ============================================================================
INSERT INTO lingo_lessons (lesson_id, title, skill, duration, xp_reward, description, sort_order, is_active)
VALUES ('ai-hallucinations-01', 'Handling AI Hallucinations', 'Safety', '5 min', 35, 'Learn strategies to detect and mitigate when AI generates false information.', 25, true)
ON CONFLICT (lesson_id) DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, options, correct_answer, explanation, hint, sort_order)
SELECT l.id, 'multiple_choice',
  'What is an AI hallucination?',
  ARRAY['A visual glitch', 'Confidently generating false information', 'Slow response time', 'Model crashing'],
  'Confidently generating false information',
  'Hallucinations are when AI generates plausible-sounding but factually incorrect content.',
  'Think about false confidence',
  1
FROM lingo_lessons l WHERE l.lesson_id = 'ai-hallucinations-01'
ON CONFLICT DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, correct_answer, accepted_answers, explanation, hint, sort_order)
SELECT l.id, 'fill_blank',
  'Asking AI to cite sources or say "I don''t know" helps reduce _____.',
  'hallucinations',
  ARRAY['hallucinations', 'hallucination', 'errors', 'mistakes', 'false information'],
  'Encouraging uncertainty acknowledgment and citations reduces hallucinations.',
  'What are we trying to prevent?',
  2
FROM lingo_lessons l WHERE l.lesson_id = 'ai-hallucinations-01'
ON CONFLICT DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, matching_pairs, explanation, hint, sort_order)
SELECT l.id, 'matching',
  'Match hallucination mitigation strategies:',
  '[{"left": "RAG", "right": "Ground responses in documents"}, {"left": "Temperature 0", "right": "Reduce randomness"}, {"left": "Chain of thought", "right": "Show reasoning steps"}, {"left": "Human review", "right": "Verify critical outputs"}]'::jsonb,
  'Multiple strategies help reduce AI hallucinations.',
  'Think about verification and grounding',
  3
FROM lingo_lessons l WHERE l.lesson_id = 'ai-hallucinations-01'
ON CONFLICT DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, ordering_items, explanation, hint, sort_order)
SELECT l.id, 'ordering',
  'Order verification approaches by reliability:',
  ARRAY['AI self-verification', 'Automated fact-checking', 'Expert review', 'Multiple source confirmation'],
  'Some verification methods are more reliable than others.',
  'Human verification is most reliable',
  4
FROM lingo_lessons l WHERE l.lesson_id = 'ai-hallucinations-01'
ON CONFLICT DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, options, correct_answer, explanation, hint, sort_order)
SELECT l.id, 'multiple_choice',
  'Which prompt technique helps reduce hallucinations?',
  ARRAY['Ask for longer responses', 'Request specific citations', 'Use more emojis', 'Increase creativity settings'],
  'Request specific citations',
  'Asking for citations makes AI ground claims in verifiable sources.',
  'Think about verifiability',
  5
FROM lingo_lessons l WHERE l.lesson_id = 'ai-hallucinations-01'
ON CONFLICT DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, free_response_config, explanation, hint, sort_order)
SELECT l.id, 'free_response',
  'Describe a scenario where an AI hallucination could cause real harm, and how to prevent it.',
  '{"ideal_answer": "In medical advice, AI could hallucinate a drug interaction or dosage, potentially harming patients. Prevention includes: requiring verified medical databases (RAG), adding disclaimers, having physicians review outputs, and blocking medical advice in consumer apps.", "rubric": "Hallucination harm and prevention", "min_length": 50, "max_length": 300, "pass_score": 0.6}'::jsonb,
  'Hallucinations in high-stakes domains require careful safeguards.',
  'Think about medical, legal, or financial contexts',
  6
FROM lingo_lessons l WHERE l.lesson_id = 'ai-hallucinations-01'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- LESSON 26: Red Teaming AI Systems
-- ============================================================================
INSERT INTO lingo_lessons (lesson_id, title, skill, duration, xp_reward, description, sort_order, is_active)
VALUES ('ai-redteaming-01', 'Red Teaming AI Systems', 'Safety', '7 min', 45, 'Learn how security researchers test AI systems to find vulnerabilities.', 26, true)
ON CONFLICT (lesson_id) DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, options, correct_answer, explanation, hint, sort_order)
SELECT l.id, 'multiple_choice',
  'What is red teaming in AI safety?',
  ARRAY['Training models with red data', 'Adversarial testing to find weaknesses', 'Color-coding errors', 'Marketing AI products'],
  'Adversarial testing to find weaknesses',
  'Red teaming involves deliberately trying to make AI systems fail or behave unsafely.',
  'Think about security testing',
  1
FROM lingo_lessons l WHERE l.lesson_id = 'ai-redteaming-01'
ON CONFLICT DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, correct_answer, accepted_answers, explanation, hint, sort_order)
SELECT l.id, 'fill_blank',
  'A _____ injection is when attackers manipulate AI by hiding instructions in inputs.',
  'prompt',
  ARRAY['prompt', 'Prompt'],
  'Prompt injection is a major vulnerability where hidden prompts override system instructions.',
  'What type of input manipulation?',
  2
FROM lingo_lessons l WHERE l.lesson_id = 'ai-redteaming-01'
ON CONFLICT DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, matching_pairs, explanation, hint, sort_order)
SELECT l.id, 'matching',
  'Match AI attack types:',
  '[{"left": "Jailbreaking", "right": "Bypassing safety guardrails"}, {"left": "Data poisoning", "right": "Corrupting training data"}, {"left": "Model extraction", "right": "Stealing model weights"}, {"left": "Prompt leaking", "right": "Exposing system prompts"}]'::jsonb,
  'Different attack types target different AI vulnerabilities.',
  'Think about what each attack does',
  3
FROM lingo_lessons l WHERE l.lesson_id = 'ai-redteaming-01'
ON CONFLICT DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, ordering_items, explanation, hint, sort_order)
SELECT l.id, 'ordering',
  'Order the red team process:',
  ARRAY['Define attack scope', 'Identify potential vulnerabilities', 'Attempt exploits', 'Document findings', 'Recommend fixes'],
  'Red teaming follows a structured approach.',
  'Start with scope definition',
  4
FROM lingo_lessons l WHERE l.lesson_id = 'ai-redteaming-01'
ON CONFLICT DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, options, correct_answer, explanation, hint, sort_order)
SELECT l.id, 'multiple_choice',
  'What is a "jailbreak" in AI context?',
  ARRAY['Breaking into AI company servers', 'Bypassing model safety restrictions', 'Installing AI on a phone', 'Speeding up AI responses'],
  'Bypassing model safety restrictions',
  'Jailbreaks trick AI into ignoring safety guidelines and producing restricted content.',
  'Think about circumventing rules',
  5
FROM lingo_lessons l WHERE l.lesson_id = 'ai-redteaming-01'
ON CONFLICT DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, free_response_config, explanation, hint, sort_order)
SELECT l.id, 'free_response',
  'Why should AI companies invest in red teaming before launching products?',
  '{"ideal_answer": "Red teaming identifies vulnerabilities before malicious actors do, prevents PR disasters from jailbreaks, ensures regulatory compliance, builds user trust, and is cheaper than fixing issues post-launch. It''s proactive defense vs. reactive damage control.", "rubric": "Value of AI red teaming", "min_length": 50, "max_length": 300, "pass_score": 0.6}'::jsonb,
  'Proactive security testing prevents costly post-launch issues.',
  'Think about prevention vs. cure',
  6
FROM lingo_lessons l WHERE l.lesson_id = 'ai-redteaming-01'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- LESSON 27: Context Windows & Memory
-- ============================================================================
INSERT INTO lingo_lessons (lesson_id, title, skill, duration, xp_reward, description, sort_order, is_active)
VALUES ('ai-contextwindow-01', 'Context Windows & Memory', 'LLMs', '5 min', 35, 'Understand how AI models handle conversation history and long inputs.', 27, true)
ON CONFLICT (lesson_id) DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, options, correct_answer, explanation, hint, sort_order)
SELECT l.id, 'multiple_choice',
  'What is a context window in LLMs?',
  ARRAY['The GUI interface', 'Maximum tokens the model processes at once', 'Training time period', 'Output display area'],
  'Maximum tokens the model processes at once',
  'The context window is the limit on how much text (in tokens) the model can consider in a single interaction.',
  'Think about input limits',
  1
FROM lingo_lessons l WHERE l.lesson_id = 'ai-contextwindow-01'
ON CONFLICT DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, correct_answer, accepted_answers, explanation, hint, sort_order)
SELECT l.id, 'fill_blank',
  'Claude 3 has a context window of _____ tokens.',
  '200K',
  ARRAY['200K', '200000', '200k', '200,000'],
  'Claude 3 supports up to 200,000 tokens, enabling processing of long documents.',
  'It''s a very large number',
  2
FROM lingo_lessons l WHERE l.lesson_id = 'ai-contextwindow-01'
ON CONFLICT DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, matching_pairs, explanation, hint, sort_order)
SELECT l.id, 'matching',
  'Match context management strategies:',
  '[{"left": "Summarization", "right": "Compress older conversation"}, {"left": "RAG", "right": "Retrieve relevant context"}, {"left": "Sliding window", "right": "Keep only recent messages"}, {"left": "Memory systems", "right": "Store long-term facts"}]'::jsonb,
  'Different strategies manage context limitations.',
  'Think about handling long conversations',
  3
FROM lingo_lessons l WHERE l.lesson_id = 'ai-contextwindow-01'
ON CONFLICT DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, ordering_items, explanation, hint, sort_order)
SELECT l.id, 'ordering',
  'Order context window sizes (smallest to largest):',
  ARRAY['GPT-3 (4K)', 'GPT-4 (8K)', 'GPT-4 Turbo (128K)', 'Claude 3 (200K)'],
  'Context windows have grown significantly over time.',
  'Earlier models had smaller windows',
  4
FROM lingo_lessons l WHERE l.lesson_id = 'ai-contextwindow-01'
ON CONFLICT DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, options, correct_answer, explanation, hint, sort_order)
SELECT l.id, 'multiple_choice',
  'What happens when input exceeds the context window?',
  ARRAY['Model gets smarter', 'Oldest content is lost or truncated', 'Processing speeds up', 'Nothing changes'],
  'Oldest content is lost or truncated',
  'Content beyond the context limit is either truncated or summarized, potentially losing information.',
  'Think about limitations',
  5
FROM lingo_lessons l WHERE l.lesson_id = 'ai-contextwindow-01'
ON CONFLICT DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, free_response_config, explanation, hint, sort_order)
SELECT l.id, 'free_response',
  'Explain why larger context windows matter for enterprise AI applications.',
  '{"ideal_answer": "Larger context windows enable processing entire documents without chunking, maintaining full conversation history for complex support cases, analyzing multiple related documents together, and reducing information loss from summarization - critical for enterprise accuracy and compliance.", "rubric": "Enterprise value of large context", "min_length": 50, "max_length": 300, "pass_score": 0.6}'::jsonb,
  'Enterprise use cases often involve processing large amounts of related information.',
  'Think about long documents and complex conversations',
  6
FROM lingo_lessons l WHERE l.lesson_id = 'ai-contextwindow-01'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- LESSON 28: OCR & Document AI
-- ============================================================================
INSERT INTO lingo_lessons (lesson_id, title, skill, duration, xp_reward, description, sort_order, is_active)
VALUES ('ai-ocr-01', 'OCR & Document AI', 'Vision', '6 min', 40, 'Learn how AI extracts and understands information from documents and images.', 28, true)
ON CONFLICT (lesson_id) DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, options, correct_answer, explanation, hint, sort_order)
SELECT l.id, 'multiple_choice',
  'What does OCR stand for?',
  ARRAY['Online Content Recognition', 'Optical Character Recognition', 'Original Copy Reader', 'Output Control Register'],
  'Optical Character Recognition',
  'OCR converts images of text into machine-readable text data.',
  'Think about reading text from images',
  1
FROM lingo_lessons l WHERE l.lesson_id = 'ai-ocr-01'
ON CONFLICT DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, correct_answer, accepted_answers, explanation, hint, sort_order)
SELECT l.id, 'fill_blank',
  'Modern document AI goes beyond OCR to understand document _____ and semantics.',
  'structure',
  ARRAY['structure', 'layout', 'format'],
  'Document AI understands tables, forms, and relationships between elements.',
  'Think about document organization',
  2
FROM lingo_lessons l WHERE l.lesson_id = 'ai-ocr-01'
ON CONFLICT DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, matching_pairs, explanation, hint, sort_order)
SELECT l.id, 'matching',
  'Match Document AI capabilities:',
  '[{"left": "OCR", "right": "Text extraction from images"}, {"left": "Table extraction", "right": "Structured data from tables"}, {"left": "Form parsing", "right": "Key-value pair identification"}, {"left": "Classification", "right": "Document type detection"}]'::jsonb,
  'Document AI has multiple specialized capabilities.',
  'Think about different document elements',
  3
FROM lingo_lessons l WHERE l.lesson_id = 'ai-ocr-01'
ON CONFLICT DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, ordering_items, explanation, hint, sort_order)
SELECT l.id, 'ordering',
  'Order the document processing pipeline:',
  ARRAY['Document ingestion', 'Image preprocessing', 'OCR text extraction', 'Layout analysis', 'Semantic understanding'],
  'Document processing follows these steps.',
  'Start with getting the document',
  4
FROM lingo_lessons l WHERE l.lesson_id = 'ai-ocr-01'
ON CONFLICT DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, options, correct_answer, explanation, hint, sort_order)
SELECT l.id, 'multiple_choice',
  'Which is a common challenge for document AI?',
  ARRAY['Documents are too large', 'Handwriting and poor image quality', 'Documents are digital', 'Text is too small'],
  'Handwriting and poor image quality',
  'Handwritten text and low-quality scans are difficult for Document AI to process accurately.',
  'Think about real-world document conditions',
  5
FROM lingo_lessons l WHERE l.lesson_id = 'ai-ocr-01'
ON CONFLICT DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, free_response_config, explanation, hint, sort_order)
SELECT l.id, 'free_response',
  'Describe how Document AI could automate invoice processing in a business.',
  '{"ideal_answer": "Document AI can extract vendor name, amounts, line items, and dates from invoice images, validate against purchase orders, flag discrepancies, route for approval, and integrate with accounting systems - automating the entire accounts payable workflow and reducing manual data entry errors.", "rubric": "Invoice processing automation", "min_length": 50, "max_length": 300, "pass_score": 0.6}'::jsonb,
  'Invoice processing is a common Document AI application.',
  'Think about extracting and validating invoice data',
  6
FROM lingo_lessons l WHERE l.lesson_id = 'ai-ocr-01'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- LESSON 29: Sentiment Analysis
-- ============================================================================
INSERT INTO lingo_lessons (lesson_id, title, skill, duration, xp_reward, description, sort_order, is_active)
VALUES ('ai-sentiment-01', 'Sentiment Analysis', 'NLP', '5 min', 35, 'Understand how AI detects emotions and opinions in text.', 29, true)
ON CONFLICT (lesson_id) DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, options, correct_answer, explanation, hint, sort_order)
SELECT l.id, 'multiple_choice',
  'What does sentiment analysis determine?',
  ARRAY['Text grammar quality', 'Emotional tone of text', 'Text length', 'Author identity'],
  'Emotional tone of text',
  'Sentiment analysis identifies whether text expresses positive, negative, or neutral emotions.',
  'Think about feelings in text',
  1
FROM lingo_lessons l WHERE l.lesson_id = 'ai-sentiment-01'
ON CONFLICT DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, correct_answer, accepted_answers, explanation, hint, sort_order)
SELECT l.id, 'fill_blank',
  'Analyzing sentiment at the feature level is called _____ sentiment analysis.',
  'aspect-based',
  ARRAY['aspect-based', 'aspect based', 'aspect', 'fine-grained'],
  'Aspect-based sentiment analysis identifies opinions about specific features or aspects.',
  'Think about specific features or aspects',
  2
FROM lingo_lessons l WHERE l.lesson_id = 'ai-sentiment-01'
ON CONFLICT DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, matching_pairs, explanation, hint, sort_order)
SELECT l.id, 'matching',
  'Match sentiment levels:',
  '[{"left": "Document-level", "right": "Overall text sentiment"}, {"left": "Sentence-level", "right": "Each sentence scored"}, {"left": "Aspect-level", "right": "Opinion on specific features"}, {"left": "Emotion detection", "right": "Specific emotions (anger, joy)"}]'::jsonb,
  'Sentiment can be analyzed at different granularities.',
  'Think about different levels of detail',
  3
FROM lingo_lessons l WHERE l.lesson_id = 'ai-sentiment-01'
ON CONFLICT DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, ordering_items, explanation, hint, sort_order)
SELECT l.id, 'ordering',
  'Order sentiment analysis complexity (simplest to most complex):',
  ARRAY['Binary (pos/neg)', 'Ternary (pos/neg/neutral)', 'Multi-class (5 levels)', 'Aspect-based with emotions'],
  'Sentiment analysis ranges from simple to complex.',
  'Start with the most basic classification',
  4
FROM lingo_lessons l WHERE l.lesson_id = 'ai-sentiment-01'
ON CONFLICT DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, options, correct_answer, explanation, hint, sort_order)
SELECT l.id, 'multiple_choice',
  'What makes sarcasm challenging for sentiment analysis?',
  ARRAY['Sarcasm is rare', 'Words don''t match true meaning', 'Sarcasm is always positive', 'It uses special characters'],
  'Words don''t match true meaning',
  'In sarcasm, the literal meaning contradicts the intended sentiment.',
  'Think about saying the opposite',
  5
FROM lingo_lessons l WHERE l.lesson_id = 'ai-sentiment-01'
ON CONFLICT DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, free_response_config, explanation, hint, sort_order)
SELECT l.id, 'free_response',
  'How could a company use sentiment analysis to improve customer experience?',
  '{"ideal_answer": "Companies can monitor social media for brand sentiment, analyze support tickets to prioritize urgent negative feedback, track product review sentiment to identify issues, route angry customers to senior agents, and measure campaign reception in real-time to adjust messaging.", "rubric": "Business applications of sentiment analysis", "min_length": 50, "max_length": 300, "pass_score": 0.6}'::jsonb,
  'Sentiment analysis has many business applications.',
  'Think about customer feedback and social media',
  6
FROM lingo_lessons l WHERE l.lesson_id = 'ai-sentiment-01'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- LESSON 30: AI Code Generation
-- ============================================================================
INSERT INTO lingo_lessons (lesson_id, title, skill, duration, xp_reward, description, sort_order, is_active)
VALUES ('ai-codegen-01', 'AI Code Generation', 'Advanced', '8 min', 50, 'Learn how AI assists developers by writing and understanding code.', 30, true)
ON CONFLICT (lesson_id) DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, options, correct_answer, explanation, hint, sort_order)
SELECT l.id, 'multiple_choice',
  'What is a code generation AI?',
  ARRAY['A text-to-image model', 'AI that writes or completes code', 'A code compiler', 'A programming language'],
  'AI that writes or completes code',
  'Code generation AI can write code from descriptions, complete partial code, and explain existing code.',
  'Think about AI writing programs',
  1
FROM lingo_lessons l WHERE l.lesson_id = 'ai-codegen-01'
ON CONFLICT DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, correct_answer, accepted_answers, explanation, hint, sort_order)
SELECT l.id, 'fill_blank',
  'GitHub _____ was one of the first AI coding assistants.',
  'Copilot',
  ARRAY['Copilot', 'copilot'],
  'GitHub Copilot, launched in 2021, pioneered AI-assisted coding in IDEs.',
  'Think about a famous coding assistant',
  2
FROM lingo_lessons l WHERE l.lesson_id = 'ai-codegen-01'
ON CONFLICT DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, matching_pairs, explanation, hint, sort_order)
SELECT l.id, 'matching',
  'Match AI coding capabilities:',
  '[{"left": "Code completion", "right": "Finishing partial code"}, {"left": "Code explanation", "right": "Describing what code does"}, {"left": "Bug fixing", "right": "Identifying and fixing errors"}, {"left": "Refactoring", "right": "Improving code structure"}]'::jsonb,
  'AI coding tools have various capabilities.',
  'Think about developer tasks',
  3
FROM lingo_lessons l WHERE l.lesson_id = 'ai-codegen-01'
ON CONFLICT DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, ordering_items, explanation, hint, sort_order)
SELECT l.id, 'ordering',
  'Order AI-assisted development workflow:',
  ARRAY['Write requirements/prompt', 'AI generates code', 'Developer reviews', 'Test and iterate', 'Deploy'],
  'AI coding follows a collaborative workflow.',
  'Start with what you want to build',
  4
FROM lingo_lessons l WHERE l.lesson_id = 'ai-codegen-01'
ON CONFLICT DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, options, correct_answer, explanation, hint, sort_order)
SELECT l.id, 'multiple_choice',
  'What is a key risk of AI-generated code?',
  ARRAY['It''s too fast', 'Security vulnerabilities', 'Uses too much memory', 'Wrong programming language'],
  'Security vulnerabilities',
  'AI can generate code with security flaws, requiring careful review of generated code.',
  'Think about code safety',
  5
FROM lingo_lessons l WHERE l.lesson_id = 'ai-codegen-01'
ON CONFLICT DO NOTHING;

INSERT INTO lingo_questions (lesson_id, question_type, question_text, free_response_config, explanation, hint, sort_order)
SELECT l.id, 'free_response',
  'How should developers approach reviewing AI-generated code to ensure quality?',
  '{"ideal_answer": "Developers should verify functionality through testing, check for security vulnerabilities, ensure code follows team standards, understand the logic rather than blindly accepting, validate edge cases, and check for proper error handling. AI is a starting point, not a final solution.", "rubric": "AI code review best practices", "min_length": 50, "max_length": 300, "pass_score": 0.6}'::jsonb,
  'AI code requires human review and validation.',
  'Think about verification and understanding',
  6
FROM lingo_lessons l WHERE l.lesson_id = 'ai-codegen-01'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Update question counts in lessons
-- ============================================================================
UPDATE lingo_lessons l
SET question_count = (
  SELECT COUNT(*) FROM lingo_questions q WHERE q.lesson_id = l.id
)
WHERE l.lesson_id IN (
  'ai-rag-01', 'ai-finetuning-01', 'ai-agents-01', 'ai-multimodal-01',
  'ai-embeddings-01', 'ai-vectordb-01', 'ai-hallucinations-01', 'ai-redteaming-01',
  'ai-contextwindow-01', 'ai-ocr-01', 'ai-sentiment-01', 'ai-codegen-01'
);
