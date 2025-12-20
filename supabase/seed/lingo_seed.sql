-- AIBORGLingo Seed Data
-- Seeds the 12 lessons and all questions from the initial curriculum

-- ============================================================================
-- Lesson 1: AI Foundations: Core Ideas
-- ============================================================================
INSERT INTO lingo_lessons (lesson_id, title, skill, duration, xp_reward, description, sort_order)
VALUES ('ai-basics-01', 'AI Foundations: Core Ideas', 'Foundations', '6 min', 30, 'Learn the essentials of how modern AI systems work and where they are used.', 1);

INSERT INTO lingo_questions (lesson_id, type, prompt, options, answer, explanation, sort_order)
SELECT id, 'multiple_choice',
  'What does inference mean in machine learning?',
  '["Collecting new training data", "Using a trained model to make predictions on fresh inputs", "Tuning hyperparameters to reduce loss", "Normalizing features before training"]'::jsonb,
  'Using a trained model to make predictions on fresh inputs',
  'Inference is running the trained model forward on unseen data to produce predictions.',
  1
FROM lingo_lessons WHERE lesson_id = 'ai-basics-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, answers, explanation, sort_order)
SELECT id, 'fill_blank',
  'The metric that measures how often a model''s predictions are wrong is called the ___ rate.',
  '["error", "error rate"]'::jsonb,
  'Accuracy and error rate are complements. Error rate shows how often predictions are incorrect.',
  2
FROM lingo_lessons WHERE lesson_id = 'ai-basics-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, pairs, explanation, sort_order)
SELECT id, 'matching',
  'Match the AI concept to its example.',
  '[{"left": "Inference", "right": "Using a vision model to label new photos"}, {"left": "Training", "right": "Updating weights by minimizing loss on labeled data"}, {"left": "Evaluation", "right": "Measuring accuracy on a held-out validation set"}]'::jsonb,
  'Inference = applying a trained model; training = updating parameters; evaluation = measuring quality.',
  3
FROM lingo_lessons WHERE lesson_id = 'ai-basics-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, steps, explanation, sort_order)
SELECT id, 'ordering',
  'Put a simple ML workflow in order.',
  '["Collect and clean data", "Split into train/validation sets", "Train the model on the training split", "Evaluate on the validation split", "Ship the model to production users"]'::jsonb,
  'You gather data, split it, train, evaluate, then deploy so users can get predictions.',
  4
FROM lingo_lessons WHERE lesson_id = 'ai-basics-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, ideal_answer, rubric, strictness, pass_score, explanation, sort_order)
SELECT id, 'free_response',
  'In 2-3 sentences, explain the difference between training and inference, and mention which is usually more resource intensive.',
  'Training updates model weights using labeled data and is compute-heavy. Inference runs the trained model forward on new inputs to make predictions and is usually lighter and cheaper.',
  'Define training vs inference; note training updates weights; note inference uses trained model on new data; mention training is heavier on compute/cost.',
  0.7, 0.65, NULL,
  5
FROM lingo_lessons WHERE lesson_id = 'ai-basics-01';

-- ============================================================================
-- Lesson 2: LLMs and Prompting
-- ============================================================================
INSERT INTO lingo_lessons (lesson_id, title, skill, duration, xp_reward, description, sort_order)
VALUES ('ai-llms-01', 'LLMs and Prompting', 'LLMs', '7 min', 35, 'Practice prompt-writing and safety basics for large language models.', 2);

INSERT INTO lingo_questions (lesson_id, type, prompt, options, answer, explanation, sort_order)
SELECT id, 'multiple_choice',
  'Why add system instructions to an LLM prompt?',
  '["To speed up the GPU", "To constrain behavior and tone", "To reduce tokenization cost", "To bypass model safety"]'::jsonb,
  'To constrain behavior and tone',
  'System instructions steer style, persona, and boundaries. They don''t change compute hardware.',
  1
FROM lingo_lessons WHERE lesson_id = 'ai-llms-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, answers, explanation, sort_order)
SELECT id, 'fill_blank',
  'Adding ___ in your prompt helps the model avoid answering outside allowed topics.',
  '["guardrails", "safety rules", "rules"]'::jsonb,
  'Explicit guardrails (allowed + disallowed topics) reduce unsafe generations.',
  2
FROM lingo_lessons WHERE lesson_id = 'ai-llms-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, pairs, explanation, sort_order)
SELECT id, 'matching',
  'Match the prompt pattern to its purpose.',
  '[{"left": "Few-shot examples", "right": "Show the model how to respond with 2-3 sample Q&A pairs"}, {"left": "Chain-of-thought", "right": "Ask the model to reason step-by-step before the final answer"}, {"left": "Refusal policy", "right": "State what the model must decline to answer"}]'::jsonb,
  'Few-shot provides patterns, chain-of-thought elicits reasoning, refusal sets boundaries.',
  3
FROM lingo_lessons WHERE lesson_id = 'ai-llms-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, steps, explanation, sort_order)
SELECT id, 'ordering',
  'Order the elements of a solid LLM prompt.',
  '["State the role or persona", "List the goal and constraints", "Provide examples (if needed)", "Add the user question or input", "Ask for a structured, concise reply"]'::jsonb,
  'Role -> constraints -> examples -> user input -> clear output format keeps the model on track.',
  4
FROM lingo_lessons WHERE lesson_id = 'ai-llms-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, ideal_answer, rubric, strictness, pass_score, explanation, sort_order)
SELECT id, 'free_response',
  'Write a 2-3 sentence system message that sets a tutoring role, defines safe AI topics, and clearly refuses off-topic questions.',
  'You are an AI tutor focused on safe AI practices. Teach briefly, stay on approved AI topics (prompts, safety, evaluation). Politely refuse unrelated or harmful requests and remind the user of allowed scope.',
  'Set role; list allowed topics; include refusal/guardrails; keep concise and friendly.',
  0.7, 0.65, NULL,
  5
FROM lingo_lessons WHERE lesson_id = 'ai-llms-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, ideal_answer, rubric, strictness, pass_score, explanation, sort_order)
SELECT id, 'free_response',
  'Draft a refusal message for an unsafe prompt about evading security filters. Keep it polite, brief, and suggest a safe alternative topic.',
  'I can''t help with bypassing security filters. I''m here to talk about responsible AI use. Want to explore how safety systems work instead?',
  'Politely refuse; mention safety/responsibility; avoid giving unsafe details; suggest a safe alternative topic; stay concise.',
  0.75, 0.7, NULL,
  6
FROM lingo_lessons WHERE lesson_id = 'ai-llms-01';

-- ============================================================================
-- Lesson 3: Neural Networks & Deep Learning
-- ============================================================================
INSERT INTO lingo_lessons (lesson_id, title, skill, duration, xp_reward, description, sort_order)
VALUES ('ai-neural-01', 'Neural Networks & Deep Learning', 'Foundations', '8 min', 40, 'Understand how neural networks learn through layers, activations, and backpropagation.', 3);

INSERT INTO lingo_questions (lesson_id, type, prompt, options, answer, explanation, sort_order)
SELECT id, 'multiple_choice',
  'What is the primary purpose of an activation function in a neural network?',
  '["To store the training data", "To introduce non-linearity so the network can learn complex patterns", "To reduce the number of parameters", "To speed up data loading"]'::jsonb,
  'To introduce non-linearity so the network can learn complex patterns',
  'Without activation functions, a neural network would just be a linear transformation. Non-linearity enables learning complex, non-linear relationships in data.',
  1
FROM lingo_lessons WHERE lesson_id = 'ai-neural-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, answers, explanation, sort_order)
SELECT id, 'fill_blank',
  'The process of updating weights by computing gradients from the output back to the input is called ___.',
  '["backpropagation", "backprop", "back propagation"]'::jsonb,
  'Backpropagation calculates how much each weight contributed to the error, allowing the network to update weights to reduce loss.',
  2
FROM lingo_lessons WHERE lesson_id = 'ai-neural-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, pairs, explanation, sort_order)
SELECT id, 'matching',
  'Match each neural network layer type to its function.',
  '[{"left": "Input layer", "right": "Receives raw features from the data"}, {"left": "Hidden layer", "right": "Transforms data through learned weights and activations"}, {"left": "Output layer", "right": "Produces final predictions or classifications"}]'::jsonb,
  'Input receives data, hidden layers process it through transformations, and output generates the final result.',
  3
FROM lingo_lessons WHERE lesson_id = 'ai-neural-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, steps, explanation, sort_order)
SELECT id, 'ordering',
  'Put the forward pass steps in the correct order.',
  '["Input data enters the network", "Multiply inputs by weights and add bias", "Apply activation function to the result", "Pass output to the next layer", "Generate final prediction at output layer"]'::jsonb,
  'Data flows forward: input → weighted sum → activation → next layer → output prediction.',
  4
FROM lingo_lessons WHERE lesson_id = 'ai-neural-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, ideal_answer, rubric, strictness, pass_score, explanation, sort_order)
SELECT id, 'free_response',
  'In 2-3 sentences, explain what backpropagation does and why it''s essential for training neural networks.',
  'Backpropagation computes the gradient of the loss with respect to each weight by propagating errors backward through the network. It''s essential because it tells us how to adjust weights to minimize prediction errors during training.',
  'Define backpropagation; mention gradient computation; explain weight updates; note importance for training.',
  0.7, 0.65, NULL,
  5
FROM lingo_lessons WHERE lesson_id = 'ai-neural-01';

-- ============================================================================
-- Lesson 4: Computer Vision Fundamentals
-- ============================================================================
INSERT INTO lingo_lessons (lesson_id, title, skill, duration, xp_reward, description, sort_order)
VALUES ('ai-vision-01', 'Computer Vision Fundamentals', 'Vision', '8 min', 40, 'Learn how CNNs process images for classification, detection, and more.', 4);

INSERT INTO lingo_questions (lesson_id, type, prompt, options, answer, explanation, sort_order)
SELECT id, 'multiple_choice',
  'What does a convolutional layer primarily detect in an image?',
  '["The file size of the image", "Local patterns like edges, textures, and shapes", "The camera model used to take the photo", "The color histogram of the entire image"]'::jsonb,
  'Local patterns like edges, textures, and shapes',
  'Convolutional layers use filters (kernels) that slide across the image to detect local features like edges, corners, and textures.',
  1
FROM lingo_lessons WHERE lesson_id = 'ai-vision-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, answers, explanation, sort_order)
SELECT id, 'fill_blank',
  '___ pooling reduces spatial dimensions by selecting the maximum value in each region.',
  '["max", "Max", "maximum"]'::jsonb,
  'Max pooling takes the highest value in each pooling window, reducing image size while preserving the most prominent features.',
  2
FROM lingo_lessons WHERE lesson_id = 'ai-vision-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, pairs, explanation, sort_order)
SELECT id, 'matching',
  'Match each computer vision task to its description.',
  '[{"left": "Classification", "right": "Assign a single label to the entire image"}, {"left": "Object Detection", "right": "Locate and label multiple objects with bounding boxes"}, {"left": "Segmentation", "right": "Label every pixel in the image with a class"}]'::jsonb,
  'Classification gives one label per image, detection finds objects with boxes, segmentation labels each pixel.',
  3
FROM lingo_lessons WHERE lesson_id = 'ai-vision-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, steps, explanation, sort_order)
SELECT id, 'ordering',
  'Order the typical CNN processing pipeline.',
  '["Input image (e.g., 224x224 RGB)", "Apply convolutional layers to extract features", "Use pooling layers to reduce spatial size", "Flatten the feature maps into a vector", "Pass through fully connected layers for classification"]'::jsonb,
  'Images flow through conv layers (features) → pooling (downsampling) → flatten → FC layers → output.',
  4
FROM lingo_lessons WHERE lesson_id = 'ai-vision-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, ideal_answer, rubric, strictness, pass_score, explanation, sort_order)
SELECT id, 'free_response',
  'In 2-3 sentences, explain why CNNs are particularly effective for image processing compared to regular neural networks.',
  'CNNs use convolutional layers that preserve spatial relationships and detect local patterns regardless of position (translation invariance). They have fewer parameters than fully connected networks on images because weights are shared across the image.',
  'Mention spatial/local pattern detection; note translation invariance or weight sharing; explain efficiency vs fully connected.',
  0.7, 0.65, NULL,
  5
FROM lingo_lessons WHERE lesson_id = 'ai-vision-01';

-- ============================================================================
-- Lesson 5: Natural Language Processing
-- ============================================================================
INSERT INTO lingo_lessons (lesson_id, title, skill, duration, xp_reward, description, sort_order)
VALUES ('ai-nlp-01', 'Natural Language Processing', 'NLP', '9 min', 45, 'Explore how AI understands text through tokenization, embeddings, and transformers.', 5);

INSERT INTO lingo_questions (lesson_id, type, prompt, options, answer, explanation, sort_order)
SELECT id, 'multiple_choice',
  'What is tokenization in NLP?',
  '["Encrypting text for security", "Breaking text into smaller units like words or subwords", "Translating text between languages", "Compressing text files"]'::jsonb,
  'Breaking text into smaller units like words or subwords',
  'Tokenization splits text into tokens (words, subwords, or characters) that models can process numerically.',
  1
FROM lingo_lessons WHERE lesson_id = 'ai-nlp-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, answers, explanation, sort_order)
SELECT id, 'fill_blank',
  'Word ___ represent words as dense numerical vectors that capture semantic meaning.',
  '["embeddings", "vectors", "representations"]'::jsonb,
  'Word embeddings map words to vectors where similar words are close together in the vector space.',
  2
FROM lingo_lessons WHERE lesson_id = 'ai-nlp-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, pairs, explanation, sort_order)
SELECT id, 'matching',
  'Match each NLP concept to its definition.',
  '[{"left": "Attention", "right": "Mechanism that weighs the importance of different input parts"}, {"left": "Transformer", "right": "Architecture using self-attention without recurrence"}, {"left": "Encoder", "right": "Component that converts input into a representation"}]'::jsonb,
  'Attention focuses on relevant parts, transformers use attention efficiently, encoders create representations.',
  3
FROM lingo_lessons WHERE lesson_id = 'ai-nlp-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, steps, explanation, sort_order)
SELECT id, 'ordering',
  'Order a typical text processing pipeline.',
  '["Raw text input", "Tokenize into words or subwords", "Convert tokens to numerical IDs", "Look up token embeddings", "Process through model layers"]'::jsonb,
  'Text → tokens → IDs → embeddings → model processing.',
  4
FROM lingo_lessons WHERE lesson_id = 'ai-nlp-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, options, answer, explanation, sort_order)
SELECT id, 'multiple_choice',
  'What makes transformers more powerful than older RNN models for NLP?',
  '["They use less memory", "They can process all tokens in parallel using attention", "They don''t need training data", "They only work with English text"]'::jsonb,
  'They can process all tokens in parallel using attention',
  'Transformers use self-attention to relate all positions at once, enabling parallelization and capturing long-range dependencies better than sequential RNNs.',
  5
FROM lingo_lessons WHERE lesson_id = 'ai-nlp-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, ideal_answer, rubric, strictness, pass_score, explanation, sort_order)
SELECT id, 'free_response',
  'In 2-3 sentences, explain what the attention mechanism does and why it''s important for language models.',
  'Attention allows a model to focus on relevant parts of the input when producing each output. It''s important because it helps models understand context and relationships between distant words in a sentence.',
  'Define attention as focusing on relevant parts; mention context understanding; note handling of word relationships or long-range dependencies.',
  0.7, 0.65, NULL,
  6
FROM lingo_lessons WHERE lesson_id = 'ai-nlp-01';

-- ============================================================================
-- Lesson 6: Advanced Prompt Engineering
-- ============================================================================
INSERT INTO lingo_lessons (lesson_id, title, skill, duration, xp_reward, description, sort_order)
VALUES ('ai-prompting-02', 'Advanced Prompt Engineering', 'LLMs', '8 min', 40, 'Master temperature settings, token optimization, and prompt security.', 6);

INSERT INTO lingo_questions (lesson_id, type, prompt, options, answer, explanation, sort_order)
SELECT id, 'multiple_choice',
  'What does the temperature parameter control in LLM outputs?',
  '["The speed of inference", "The randomness/creativity of responses", "The maximum response length", "The model''s memory usage"]'::jsonb,
  'The randomness/creativity of responses',
  'Lower temperature (e.g., 0.1) makes outputs more deterministic and focused. Higher temperature (e.g., 1.0) increases randomness and creativity.',
  1
FROM lingo_lessons WHERE lesson_id = 'ai-prompting-02';

INSERT INTO lingo_questions (lesson_id, type, prompt, answers, explanation, sort_order)
SELECT id, 'fill_blank',
  'Reducing ___ count in your prompts helps lower API costs and speeds up responses.',
  '["token", "tokens"]'::jsonb,
  'API pricing is often per token. Concise prompts use fewer tokens, reducing cost and latency.',
  2
FROM lingo_lessons WHERE lesson_id = 'ai-prompting-02';

INSERT INTO lingo_questions (lesson_id, type, prompt, pairs, explanation, sort_order)
SELECT id, 'matching',
  'Match each prompt technique to its best use case.',
  '[{"left": "Zero-shot", "right": "Simple tasks where no examples are needed"}, {"left": "Few-shot", "right": "Tasks that benefit from seeing 2-5 examples first"}, {"left": "JSON mode", "right": "When you need structured, parseable output"}]'::jsonb,
  'Zero-shot for simple tasks, few-shot when examples help, JSON mode for structured data extraction.',
  3
FROM lingo_lessons WHERE lesson_id = 'ai-prompting-02';

INSERT INTO lingo_questions (lesson_id, type, prompt, steps, explanation, sort_order)
SELECT id, 'ordering',
  'Order the steps to get reliable structured output from an LLM.',
  '["Define the exact output schema you need", "Specify the format in the system prompt", "Provide an example of valid output", "Ask the model to respond only in that format", "Validate and parse the response"]'::jsonb,
  'Schema → format instruction → example → strict format request → validation.',
  4
FROM lingo_lessons WHERE lesson_id = 'ai-prompting-02';

INSERT INTO lingo_questions (lesson_id, type, prompt, ideal_answer, rubric, strictness, pass_score, explanation, sort_order)
SELECT id, 'free_response',
  'In 2-3 sentences, explain what prompt injection is and one way to prevent it.',
  'Prompt injection is when malicious input tries to override the system instructions to make the model behave unexpectedly. Prevention includes clearly separating user input from instructions and validating/sanitizing inputs before including them in prompts.',
  'Define prompt injection; mention it overrides instructions; suggest at least one prevention method (separation, validation, sanitization).',
  0.7, 0.65, NULL,
  5
FROM lingo_lessons WHERE lesson_id = 'ai-prompting-02';

-- ============================================================================
-- Lesson 7: Model Evaluation & Metrics
-- ============================================================================
INSERT INTO lingo_lessons (lesson_id, title, skill, duration, xp_reward, description, sort_order)
VALUES ('ai-evaluation-01', 'Model Evaluation & Metrics', 'Foundations', '8 min', 40, 'Learn to measure model performance with precision, recall, F1, and more.', 7);

INSERT INTO lingo_questions (lesson_id, type, prompt, options, answer, explanation, sort_order)
SELECT id, 'multiple_choice',
  'What does precision measure in a classification model?',
  '["The percentage of all positive cases correctly identified", "The percentage of predicted positives that are actually positive", "The total number of correct predictions", "The speed of model inference"]'::jsonb,
  'The percentage of predicted positives that are actually positive',
  'Precision = True Positives / (True Positives + False Positives). It measures how many of the model''s positive predictions were correct.',
  1
FROM lingo_lessons WHERE lesson_id = 'ai-evaluation-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, answers, explanation, sort_order)
SELECT id, 'fill_blank',
  'The ___ score is the harmonic mean of precision and recall.',
  '["F1", "f1", "F-1", "f-1"]'::jsonb,
  'F1 score balances precision and recall into a single metric, useful when you need both low false positives and low false negatives.',
  2
FROM lingo_lessons WHERE lesson_id = 'ai-evaluation-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, pairs, explanation, sort_order)
SELECT id, 'matching',
  'Match each metric to when you should prioritize it.',
  '[{"left": "Precision", "right": "When false positives are costly (e.g., spam detection)"}, {"left": "Recall", "right": "When false negatives are costly (e.g., disease screening)"}, {"left": "Accuracy", "right": "When classes are balanced and all errors matter equally"}]'::jsonb,
  'Prioritize precision to avoid false alarms, recall to avoid missing cases, accuracy when classes are balanced.',
  3
FROM lingo_lessons WHERE lesson_id = 'ai-evaluation-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, options, answer, explanation, sort_order)
SELECT id, 'multiple_choice',
  'What indicates that a model is overfitting?',
  '["Low training error and low validation error", "High training error and high validation error", "Low training error but high validation error", "The model trains very slowly"]'::jsonb,
  'Low training error but high validation error',
  'Overfitting means the model memorized training data but doesn''t generalize. It performs well on training data but poorly on new data.',
  4
FROM lingo_lessons WHERE lesson_id = 'ai-evaluation-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, steps, explanation, sort_order)
SELECT id, 'ordering',
  'Order the model evaluation workflow.',
  '["Split data into train, validation, and test sets", "Train the model on training data only", "Tune hyperparameters using validation set", "Select the best model based on validation metrics", "Evaluate final performance on the held-out test set"]'::jsonb,
  'Train → validate → tune → select → final test evaluation (never use test set for tuning!).',
  5
FROM lingo_lessons WHERE lesson_id = 'ai-evaluation-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, ideal_answer, rubric, strictness, pass_score, explanation, sort_order)
SELECT id, 'free_response',
  'In 2-3 sentences, explain when you would prioritize recall over precision. Give a real-world example.',
  'You prioritize recall when missing positive cases is more harmful than false alarms. For example, in cancer screening, you want to catch all potential cases (high recall) even if some healthy patients get flagged for further tests.',
  'Explain recall prioritization when missing cases is costly; provide a relevant real-world example; show understanding of the precision-recall tradeoff.',
  0.7, 0.65, NULL,
  6
FROM lingo_lessons WHERE lesson_id = 'ai-evaluation-01';

-- ============================================================================
-- Lesson 8: RAG: Retrieval-Augmented Generation
-- ============================================================================
INSERT INTO lingo_lessons (lesson_id, title, skill, duration, xp_reward, description, sort_order)
VALUES ('ai-rag-01', 'RAG: Retrieval-Augmented Generation', 'Advanced', '9 min', 45, 'Learn how to enhance LLMs with external knowledge using RAG pipelines.', 8);

INSERT INTO lingo_questions (lesson_id, type, prompt, options, answer, explanation, sort_order)
SELECT id, 'multiple_choice',
  'What is the main purpose of RAG (Retrieval-Augmented Generation)?',
  '["To train models faster", "To provide LLMs with relevant external knowledge at inference time", "To reduce model size", "To translate between languages"]'::jsonb,
  'To provide LLMs with relevant external knowledge at inference time',
  'RAG retrieves relevant documents and includes them in the prompt, giving the LLM access to knowledge beyond its training data.',
  1
FROM lingo_lessons WHERE lesson_id = 'ai-rag-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, answers, explanation, sort_order)
SELECT id, 'fill_blank',
  'In RAG, documents are converted to ___ for semantic similarity search.',
  '["embeddings", "vectors", "vector embeddings"]'::jsonb,
  'Text embeddings represent documents as numerical vectors. Similar documents have similar vectors, enabling semantic search.',
  2
FROM lingo_lessons WHERE lesson_id = 'ai-rag-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, pairs, explanation, sort_order)
SELECT id, 'matching',
  'Match each RAG component to its purpose.',
  '[{"left": "Vector database", "right": "Stores document embeddings for fast similarity search"}, {"left": "Chunking", "right": "Splits large documents into smaller retrievable pieces"}, {"left": "Reranking", "right": "Reorders retrieved results by relevance to the query"}]'::jsonb,
  'Vector DB stores embeddings, chunking breaks docs into pieces, reranking improves retrieval quality.',
  3
FROM lingo_lessons WHERE lesson_id = 'ai-rag-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, steps, explanation, sort_order)
SELECT id, 'ordering',
  'Order the RAG pipeline steps.',
  '["User asks a question", "Convert question to embedding vector", "Search vector database for similar chunks", "Include top chunks as context in the prompt", "LLM generates answer using the retrieved context"]'::jsonb,
  'Question → embed → search → context injection → LLM response.',
  4
FROM lingo_lessons WHERE lesson_id = 'ai-rag-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, options, answer, explanation, sort_order)
SELECT id, 'multiple_choice',
  'What happens if document chunks are too large in a RAG system?',
  '["The system runs faster", "Relevant information may be diluted with irrelevant content", "The embeddings become more accurate", "Memory usage decreases"]'::jsonb,
  'Relevant information may be diluted with irrelevant content',
  'Large chunks may contain both relevant and irrelevant information, making it harder to retrieve precisely what''s needed.',
  5
FROM lingo_lessons WHERE lesson_id = 'ai-rag-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, ideal_answer, rubric, strictness, pass_score, explanation, sort_order)
SELECT id, 'free_response',
  'In 2-3 sentences, explain why you might choose RAG over fine-tuning for adding domain knowledge to an LLM.',
  'RAG allows updating knowledge without retraining by simply updating the document database. It''s also more cost-effective and transparent since you can see which documents informed each response.',
  'Mention ease of updating knowledge; note cost or time savings vs fine-tuning; mention transparency or source attribution benefits.',
  0.7, 0.65, NULL,
  6
FROM lingo_lessons WHERE lesson_id = 'ai-rag-01';

-- ============================================================================
-- Lesson 9: AI Safety & Alignment
-- ============================================================================
INSERT INTO lingo_lessons (lesson_id, title, skill, duration, xp_reward, description, sort_order)
VALUES ('ai-safety-01', 'AI Safety & Alignment', 'Safety', '8 min', 40, 'Understand AI risks including hallucinations, bias, and alignment challenges.', 9);

INSERT INTO lingo_questions (lesson_id, type, prompt, options, answer, explanation, sort_order)
SELECT id, 'multiple_choice',
  'What is a ''hallucination'' in the context of AI language models?',
  '["When the model sees images that don''t exist", "When the model generates confident but false or made-up information", "When the model refuses to answer questions", "When the model crashes unexpectedly"]'::jsonb,
  'When the model generates confident but false or made-up information',
  'Hallucinations occur when LLMs generate plausible-sounding but factually incorrect or fabricated content.',
  1
FROM lingo_lessons WHERE lesson_id = 'ai-safety-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, answers, explanation, sort_order)
SELECT id, 'fill_blank',
  '___ testing involves deliberately trying to make an AI system behave unsafely or produce harmful outputs.',
  '["Red team", "Red-team", "Redteam", "red team", "red-team", "adversarial"]'::jsonb,
  'Red teaming proactively tests AI systems for vulnerabilities by simulating attacks and edge cases.',
  2
FROM lingo_lessons WHERE lesson_id = 'ai-safety-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, pairs, explanation, sort_order)
SELECT id, 'matching',
  'Match each AI safety concept to its definition.',
  '[{"left": "Alignment", "right": "Ensuring AI systems act according to human values and intentions"}, {"left": "Bias", "right": "Systematic unfairness in model outputs toward certain groups"}, {"left": "Robustness", "right": "Maintaining safe behavior even with unusual or adversarial inputs"}]'::jsonb,
  'Alignment = following human values, bias = unfair patterns, robustness = handling edge cases safely.',
  3
FROM lingo_lessons WHERE lesson_id = 'ai-safety-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, options, answer, explanation, sort_order)
SELECT id, 'multiple_choice',
  'What is one effective way to reduce bias in AI systems?',
  '["Use only data from one source", "Train on diverse, representative datasets and audit outputs regularly", "Make the model larger", "Remove all human oversight"]'::jsonb,
  'Train on diverse, representative datasets and audit outputs regularly',
  'Diverse training data and regular bias audits help identify and mitigate unfair patterns in model behavior.',
  4
FROM lingo_lessons WHERE lesson_id = 'ai-safety-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, steps, explanation, sort_order)
SELECT id, 'ordering',
  'Order the AI safety evaluation process.',
  '["Define safety requirements and potential risks", "Develop test cases including edge cases and adversarial inputs", "Evaluate model behavior on safety benchmarks", "Red team the system to find vulnerabilities", "Implement mitigations and monitor in production"]'::jsonb,
  'Requirements → test cases → benchmark → red team → mitigate & monitor.',
  5
FROM lingo_lessons WHERE lesson_id = 'ai-safety-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, ideal_answer, rubric, strictness, pass_score, explanation, sort_order)
SELECT id, 'free_response',
  'Write 2-3 sentences describing a safety guideline for an AI assistant that handles customer service.',
  'The AI should never share customer personal data with unauthorized parties or make up information it doesn''t know. When unsure, it should acknowledge uncertainty and offer to escalate to a human agent. It should refuse requests that could harm customers or violate company policies.',
  'Include data privacy protection; mention handling uncertainty honestly; suggest human escalation or refusal of harmful requests.',
  0.7, 0.65, NULL,
  6
FROM lingo_lessons WHERE lesson_id = 'ai-safety-01';

-- ============================================================================
-- Lesson 10: Transfer Learning & Fine-Tuning
-- ============================================================================
INSERT INTO lingo_lessons (lesson_id, title, skill, duration, xp_reward, description, sort_order)
VALUES ('ai-transfer-01', 'Transfer Learning & Fine-Tuning', 'Advanced', '8 min', 40, 'Learn when and how to adapt pre-trained models to new tasks.', 10);

INSERT INTO lingo_questions (lesson_id, type, prompt, options, answer, explanation, sort_order)
SELECT id, 'multiple_choice',
  'What is transfer learning?',
  '["Moving data between databases", "Using knowledge from a model trained on one task to improve performance on another task", "Copying model weights to a new server", "Converting models between frameworks"]'::jsonb,
  'Using knowledge from a model trained on one task to improve performance on another task',
  'Transfer learning leverages pre-trained models so you don''t have to train from scratch, saving time and data requirements.',
  1
FROM lingo_lessons WHERE lesson_id = 'ai-transfer-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, answers, explanation, sort_order)
SELECT id, 'fill_blank',
  '___ is a parameter-efficient fine-tuning technique that adds small trainable matrices to frozen model weights.',
  '["LoRA", "lora", "LORA"]'::jsonb,
  'LoRA (Low-Rank Adaptation) enables fine-tuning with far fewer parameters by training only small additional matrices.',
  2
FROM lingo_lessons WHERE lesson_id = 'ai-transfer-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, pairs, explanation, sort_order)
SELECT id, 'matching',
  'Match each fine-tuning strategy to its best scenario.',
  '[{"left": "Full fine-tuning", "right": "When you have lots of data and compute resources"}, {"left": "LoRA/Adapters", "right": "When you need efficiency and have limited compute"}, {"left": "Prompt tuning", "right": "When you can''t modify model weights at all"}]'::jsonb,
  'Full fine-tuning for max performance with resources, LoRA for efficiency, prompt tuning when weights are frozen.',
  3
FROM lingo_lessons WHERE lesson_id = 'ai-transfer-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, steps, explanation, sort_order)
SELECT id, 'ordering',
  'Order the fine-tuning workflow.',
  '["Select a pre-trained base model", "Prepare task-specific training data", "Configure which layers to train or freeze", "Train on your data with appropriate learning rate", "Evaluate and iterate on a validation set"]'::jsonb,
  'Select model → prepare data → configure training → train → evaluate.',
  4
FROM lingo_lessons WHERE lesson_id = 'ai-transfer-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, options, answer, explanation, sort_order)
SELECT id, 'multiple_choice',
  'When might you NOT want to fine-tune a model?',
  '["When you have high-quality domain-specific data", "When prompting alone achieves good enough results", "When you need specialized behavior", "When you have unlimited compute budget"]'::jsonb,
  'When prompting alone achieves good enough results',
  'If prompt engineering or few-shot learning achieves your goals, fine-tuning adds unnecessary complexity and cost.',
  5
FROM lingo_lessons WHERE lesson_id = 'ai-transfer-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, ideal_answer, rubric, strictness, pass_score, explanation, sort_order)
SELECT id, 'free_response',
  'In 2-3 sentences, compare fine-tuning versus prompt engineering. When would you choose each approach?',
  'Prompt engineering is faster and cheaper, good for quick experiments and when the base model already handles the task reasonably. Fine-tuning is better when you need consistent specialized behavior, have good training data, and prompting alone doesn''t achieve the required quality.',
  'Mention speed/cost advantage of prompting; note fine-tuning for specialized behavior; discuss trade-offs like data requirements or consistency.',
  0.7, 0.65, NULL,
  6
FROM lingo_lessons WHERE lesson_id = 'ai-transfer-01';

-- ============================================================================
-- Lesson 11: AI Agents & Reasoning
-- ============================================================================
INSERT INTO lingo_lessons (lesson_id, title, skill, duration, xp_reward, description, sort_order)
VALUES ('ai-agents-01', 'AI Agents & Reasoning', 'Advanced', '9 min', 45, 'Explore how AI agents use tools, plan actions, and reason step-by-step.', 11);

INSERT INTO lingo_questions (lesson_id, type, prompt, options, answer, explanation, sort_order)
SELECT id, 'multiple_choice',
  'What primarily distinguishes an AI agent from a simple chatbot?',
  '["Agents can only answer questions", "Agents can take actions, use tools, and work toward goals autonomously", "Agents don''t use language models", "Agents are always faster"]'::jsonb,
  'Agents can take actions, use tools, and work toward goals autonomously',
  'AI agents go beyond Q&A by planning, using external tools, and taking actions to accomplish multi-step goals.',
  1
FROM lingo_lessons WHERE lesson_id = 'ai-agents-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, answers, explanation, sort_order)
SELECT id, 'fill_blank',
  'Agents use ___ to interact with external systems like APIs, databases, or code execution.',
  '["tools", "functions", "tool calls"]'::jsonb,
  'Tools extend agent capabilities beyond language, allowing them to search the web, run code, query databases, etc.',
  2
FROM lingo_lessons WHERE lesson_id = 'ai-agents-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, pairs, explanation, sort_order)
SELECT id, 'matching',
  'Match each agent component to its function.',
  '[{"left": "Planning", "right": "Breaking down goals into actionable steps"}, {"left": "Memory", "right": "Storing context and past interactions"}, {"left": "Tool use", "right": "Executing external functions to gather info or take action"}]'::jsonb,
  'Planning creates steps, memory maintains context, tools enable external interactions.',
  3
FROM lingo_lessons WHERE lesson_id = 'ai-agents-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, steps, explanation, sort_order)
SELECT id, 'ordering',
  'Order the typical agent action loop.',
  '["Observe the current state or user request", "Think and plan the next action", "Select and execute an appropriate tool", "Evaluate the result of the action", "Decide if goal is met or continue the loop"]'::jsonb,
  'Observe → think → act → evaluate → continue or complete.',
  4
FROM lingo_lessons WHERE lesson_id = 'ai-agents-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, options, answer, explanation, sort_order)
SELECT id, 'multiple_choice',
  'What is chain-of-thought (CoT) prompting?',
  '["Connecting multiple models together", "Asking the model to show its reasoning steps before the final answer", "Training on thought data", "Linking prompts in a database"]'::jsonb,
  'Asking the model to show its reasoning steps before the final answer',
  'Chain-of-thought prompting improves reasoning by having the model break down problems step-by-step before concluding.',
  5
FROM lingo_lessons WHERE lesson_id = 'ai-agents-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, ideal_answer, rubric, strictness, pass_score, explanation, sort_order)
SELECT id, 'free_response',
  'In 2-3 sentences, describe a simple agent workflow for helping a user book a flight.',
  'The agent would first ask for travel details (dates, destination, preferences), then use a flight search tool to find options. It would present the options to the user, and upon selection, use a booking tool to complete the reservation.',
  'Include gathering user requirements; mention using tools for search/booking; show a logical multi-step workflow.',
  0.7, 0.65, NULL,
  6
FROM lingo_lessons WHERE lesson_id = 'ai-agents-01';

-- ============================================================================
-- Lesson 12: Data & Annotation Strategies
-- ============================================================================
INSERT INTO lingo_lessons (lesson_id, title, skill, duration, xp_reward, description, sort_order)
VALUES ('ai-data-01', 'Data & Annotation Strategies', 'Foundations', '8 min', 40, 'Master data preparation techniques including augmentation, labeling, and handling imbalance.', 12);

INSERT INTO lingo_questions (lesson_id, type, prompt, options, answer, explanation, sort_order)
SELECT id, 'multiple_choice',
  'What is data augmentation?',
  '["Deleting duplicate data points", "Creating modified versions of existing data to increase training set size and diversity", "Compressing data for storage", "Converting data to different formats"]'::jsonb,
  'Creating modified versions of existing data to increase training set size and diversity',
  'Augmentation applies transformations (rotation, cropping, noise) to create new training examples, improving model generalization.',
  1
FROM lingo_lessons WHERE lesson_id = 'ai-data-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, answers, explanation, sort_order)
SELECT id, 'fill_blank',
  '___ learning is a technique that selects the most informative samples to label, reducing annotation costs.',
  '["Active", "active"]'::jsonb,
  'Active learning prioritizes labeling samples where the model is most uncertain, maximizing the value of each annotation.',
  2
FROM lingo_lessons WHERE lesson_id = 'ai-data-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, pairs, explanation, sort_order)
SELECT id, 'matching',
  'Match each data strategy to its use case.',
  '[{"left": "Synthetic data", "right": "When real data is scarce, sensitive, or expensive to collect"}, {"left": "Data augmentation", "right": "When you need more training examples from existing data"}, {"left": "Active learning", "right": "When labeling budget is limited and you want maximum impact"}]'::jsonb,
  'Synthetic for data scarcity, augmentation for variety, active learning for efficient labeling.',
  3
FROM lingo_lessons WHERE lesson_id = 'ai-data-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, steps, explanation, sort_order)
SELECT id, 'ordering',
  'Order the dataset preparation pipeline.',
  '["Collect raw data from various sources", "Clean and preprocess the data", "Label or annotate the data", "Split into train, validation, and test sets", "Apply augmentation to training set only"]'::jsonb,
  'Collect → clean → label → split → augment training data.',
  4
FROM lingo_lessons WHERE lesson_id = 'ai-data-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, options, answer, explanation, sort_order)
SELECT id, 'multiple_choice',
  'When is synthetic data most useful?',
  '["When real data is abundant and easy to label", "When real data is scarce, expensive, or has privacy concerns", "When you don''t want to train a model", "When inference speed is the only priority"]'::jsonb,
  'When real data is scarce, expensive, or has privacy concerns',
  'Synthetic data can supplement or replace real data when collection is difficult, costly, or raises privacy issues.',
  5
FROM lingo_lessons WHERE lesson_id = 'ai-data-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, ideal_answer, rubric, strictness, pass_score, explanation, sort_order)
SELECT id, 'free_response',
  'In 2-3 sentences, explain how you would handle a severely imbalanced dataset where 95% of samples are class A and only 5% are class B.',
  'You could use techniques like oversampling the minority class, undersampling the majority class, or using SMOTE to generate synthetic minority samples. Additionally, using class weights in the loss function or choosing metrics like F1 score instead of accuracy helps the model learn from rare classes.',
  'Mention resampling techniques (over/under sampling, SMOTE); suggest class weights or balanced loss; note appropriate evaluation metrics.',
  0.7, 0.65, NULL,
  6
FROM lingo_lessons WHERE lesson_id = 'ai-data-01';
