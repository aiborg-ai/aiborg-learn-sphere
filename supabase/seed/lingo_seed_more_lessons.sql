-- AIBORGLingo Additional Lessons
-- Adds 6 more lessons (13-18) to expand the curriculum

-- ============================================================================
-- Lesson 13: Generative AI & Diffusion Models
-- ============================================================================
INSERT INTO lingo_lessons (lesson_id, title, skill, duration, xp_reward, description, sort_order)
VALUES ('ai-generative-01', 'Generative AI & Diffusion Models', 'Vision', '9 min', 45, 'Learn how AI creates images, from GANs to modern diffusion models like Stable Diffusion.', 13);

INSERT INTO lingo_questions (lesson_id, type, prompt, options, answer, explanation, sort_order)
SELECT id, 'multiple_choice',
  'What is the core concept behind diffusion models for image generation?',
  '["Copying pixels from existing images", "Gradually denoising random noise into coherent images", "Stacking multiple neural networks", "Compressing images to smaller sizes"]'::jsonb,
  'Gradually denoising random noise into coherent images',
  'Diffusion models learn to reverse a noise-adding process, starting from pure noise and iteratively removing it to produce realistic images.',
  1
FROM lingo_lessons WHERE lesson_id = 'ai-generative-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, answers, explanation, sort_order)
SELECT id, 'fill_blank',
  'In a GAN, the ___ network tries to create realistic outputs while the discriminator tries to detect fakes.',
  '["generator", "Generator"]'::jsonb,
  'GANs use two networks: a generator creates samples and a discriminator judges if they''re real or fake, improving each other.',
  2
FROM lingo_lessons WHERE lesson_id = 'ai-generative-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, pairs, explanation, sort_order)
SELECT id, 'matching',
  'Match each generative model to its characteristics.',
  '[{"left": "GAN", "right": "Uses adversarial training with generator and discriminator"}, {"left": "Diffusion", "right": "Learns to iteratively denoise images from random noise"}, {"left": "VAE", "right": "Encodes data to latent space and decodes to reconstruct"}]'::jsonb,
  'GANs use adversarial training, diffusion models denoise iteratively, VAEs use encode-decode with latent space.',
  3
FROM lingo_lessons WHERE lesson_id = 'ai-generative-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, steps, explanation, sort_order)
SELECT id, 'ordering',
  'Order the text-to-image generation pipeline.',
  '["User provides a text prompt", "Text encoder converts prompt to embeddings", "Model generates image from noise guided by embeddings", "Iterative denoising refines the image", "Final image is output"]'::jsonb,
  'Prompt -> encode -> generate from noise -> denoise -> output image.',
  4
FROM lingo_lessons WHERE lesson_id = 'ai-generative-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, options, answer, explanation, sort_order)
SELECT id, 'multiple_choice',
  'What is "negative prompting" in image generation?',
  '["Using negative numbers in the prompt", "Specifying what you DON''T want in the generated image", "Generating images in grayscale", "Reducing image quality for speed"]'::jsonb,
  'Specifying what you DON''T want in the generated image',
  'Negative prompts tell the model to avoid certain elements, like "no blur, no text" to improve output quality.',
  5
FROM lingo_lessons WHERE lesson_id = 'ai-generative-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, ideal_answer, rubric, strictness, pass_score, explanation, sort_order)
SELECT id, 'free_response',
  'In 2-3 sentences, explain a key challenge with generative AI and how it might be addressed.',
  'One challenge is that generative models can create deepfakes or misleading content. This can be addressed through watermarking AI-generated content, detection tools, and clear usage policies that require disclosure of AI-generated media.',
  'Identify a real challenge (deepfakes, copyright, bias, etc.); propose a reasonable mitigation; show understanding of the issue.',
  0.7, 0.65, NULL,
  6
FROM lingo_lessons WHERE lesson_id = 'ai-generative-01';

-- ============================================================================
-- Lesson 14: AI Ethics & Responsible Development
-- ============================================================================
INSERT INTO lingo_lessons (lesson_id, title, skill, duration, xp_reward, description, sort_order)
VALUES ('ai-ethics-01', 'AI Ethics & Responsible Development', 'Safety', '8 min', 40, 'Explore ethical considerations in AI development including fairness, transparency, and accountability.', 14);

INSERT INTO lingo_questions (lesson_id, type, prompt, options, answer, explanation, sort_order)
SELECT id, 'multiple_choice',
  'What does "explainability" mean in the context of AI systems?',
  '["The AI can speak multiple languages", "The ability to understand and communicate how an AI makes its decisions", "The AI can explain complex topics to users", "The speed at which AI explains answers"]'::jsonb,
  'The ability to understand and communicate how an AI makes its decisions',
  'Explainable AI helps users and developers understand why a model made a particular prediction, building trust and enabling debugging.',
  1
FROM lingo_lessons WHERE lesson_id = 'ai-ethics-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, answers, explanation, sort_order)
SELECT id, 'fill_blank',
  'The principle that AI systems should allow humans to override automated decisions is called human-in-the-___.',
  '["loop", "Loop"]'::jsonb,
  'Human-in-the-loop ensures that critical decisions can be reviewed and overridden by humans when needed.',
  2
FROM lingo_lessons WHERE lesson_id = 'ai-ethics-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, pairs, explanation, sort_order)
SELECT id, 'matching',
  'Match each ethical principle to its meaning.',
  '[{"left": "Fairness", "right": "AI should not discriminate based on protected characteristics"}, {"left": "Transparency", "right": "Users should know when they are interacting with AI"}, {"left": "Accountability", "right": "Clear responsibility for AI system outcomes"}]'::jsonb,
  'Fairness prevents discrimination, transparency enables informed interactions, accountability assigns responsibility.',
  3
FROM lingo_lessons WHERE lesson_id = 'ai-ethics-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, steps, explanation, sort_order)
SELECT id, 'ordering',
  'Order the responsible AI development lifecycle.',
  '["Assess potential risks and impacts before building", "Design with fairness and safety requirements", "Test for bias and edge cases", "Document limitations and appropriate use", "Monitor deployed systems for issues"]'::jsonb,
  'Assess risks -> design responsibly -> test thoroughly -> document -> monitor continuously.',
  4
FROM lingo_lessons WHERE lesson_id = 'ai-ethics-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, options, answer, explanation, sort_order)
SELECT id, 'multiple_choice',
  'Why might an AI hiring tool exhibit bias even if it wasn''t explicitly programmed to?',
  '["AI always has bugs", "Historical data used for training may contain past discrimination", "The developers were biased", "AI cannot make hiring decisions"]'::jsonb,
  'Historical data used for training may contain past discrimination',
  'AI learns patterns from training data. If historical hiring data reflects past biases, the model will learn and perpetuate those biases.',
  5
FROM lingo_lessons WHERE lesson_id = 'ai-ethics-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, ideal_answer, rubric, strictness, pass_score, explanation, sort_order)
SELECT id, 'free_response',
  'In 2-3 sentences, describe one ethical consideration when deploying AI in healthcare.',
  'Privacy is critical since healthcare AI handles sensitive patient data that must be protected. Additionally, the consequences of errors are high, so the system needs thorough validation and human oversight for critical decisions.',
  'Mention a relevant ethical concern (privacy, accuracy, bias, consent, etc.); explain why it matters in healthcare; suggest appropriate safeguards.',
  0.7, 0.65, NULL,
  6
FROM lingo_lessons WHERE lesson_id = 'ai-ethics-01';

-- ============================================================================
-- Lesson 15: Model Deployment & MLOps
-- ============================================================================
INSERT INTO lingo_lessons (lesson_id, title, skill, duration, xp_reward, description, sort_order)
VALUES ('ai-mlops-01', 'Model Deployment & MLOps', 'Advanced', '9 min', 45, 'Learn how to deploy, monitor, and maintain ML models in production environments.', 15);

INSERT INTO lingo_questions (lesson_id, type, prompt, options, answer, explanation, sort_order)
SELECT id, 'multiple_choice',
  'What is model drift?',
  '["The model file corrupting over time", "Changes in data patterns that degrade model performance over time", "The model moving to different servers", "Network latency during inference"]'::jsonb,
  'Changes in data patterns that degrade model performance over time',
  'Data drift occurs when production data differs from training data, causing model accuracy to decline. Regular monitoring helps detect this.',
  1
FROM lingo_lessons WHERE lesson_id = 'ai-mlops-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, answers, explanation, sort_order)
SELECT id, 'fill_blank',
  'The practice of managing ML systems with principles from software DevOps is called ___.',
  '["MLOps", "mlops", "ML Ops"]'::jsonb,
  'MLOps applies DevOps practices to ML systems: version control, CI/CD, monitoring, and automated pipelines.',
  2
FROM lingo_lessons WHERE lesson_id = 'ai-mlops-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, pairs, explanation, sort_order)
SELECT id, 'matching',
  'Match each deployment pattern to its use case.',
  '[{"left": "Blue-green", "right": "Zero-downtime deployment by switching between two identical environments"}, {"left": "Canary", "right": "Gradually roll out to a small percentage of users first"}, {"left": "Shadow", "right": "Run new model alongside old one without affecting users"}]'::jsonb,
  'Blue-green switches environments, canary tests on subset of users, shadow tests without impacting production.',
  3
FROM lingo_lessons WHERE lesson_id = 'ai-mlops-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, steps, explanation, sort_order)
SELECT id, 'ordering',
  'Order the ML deployment pipeline.',
  '["Train and validate the model offline", "Package the model and dependencies", "Deploy to staging environment for testing", "Roll out gradually to production", "Monitor metrics and set up alerts"]'::jsonb,
  'Train -> package -> staging -> production rollout -> monitoring.',
  4
FROM lingo_lessons WHERE lesson_id = 'ai-mlops-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, options, answer, explanation, sort_order)
SELECT id, 'multiple_choice',
  'What should you track to detect model drift in production?',
  '["Only the model file size", "Input data distributions and prediction metrics over time", "The number of API requests", "Server CPU temperature"]'::jsonb,
  'Input data distributions and prediction metrics over time',
  'Tracking input distributions reveals data drift, while monitoring prediction metrics shows if model quality is degrading.',
  5
FROM lingo_lessons WHERE lesson_id = 'ai-mlops-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, ideal_answer, rubric, strictness, pass_score, explanation, sort_order)
SELECT id, 'free_response',
  'In 2-3 sentences, describe what a feature store is and why it''s useful for ML systems.',
  'A feature store is a centralized repository for storing, managing, and serving ML features. It ensures consistency between training and inference, enables feature reuse across projects, and handles both offline (batch) and online (real-time) feature serving.',
  'Define feature store as centralized repository; mention consistency between training/inference; note benefits like reuse or serving capabilities.',
  0.7, 0.65, NULL,
  6
FROM lingo_lessons WHERE lesson_id = 'ai-mlops-01';

-- ============================================================================
-- Lesson 16: Multimodal AI Systems
-- ============================================================================
INSERT INTO lingo_lessons (lesson_id, title, skill, duration, xp_reward, description, sort_order)
VALUES ('ai-multimodal-01', 'Multimodal AI Systems', 'Advanced', '9 min', 45, 'Explore how AI combines text, images, audio, and video for richer understanding.', 16);

INSERT INTO lingo_questions (lesson_id, type, prompt, options, answer, explanation, sort_order)
SELECT id, 'multiple_choice',
  'What makes an AI system "multimodal"?',
  '["It can only process one type of data very well", "It can understand and generate multiple types of data like text, images, and audio", "It runs on multiple computers", "It supports multiple programming languages"]'::jsonb,
  'It can understand and generate multiple types of data like text, images, and audio',
  'Multimodal AI processes different data types (modalities) together, enabling tasks like describing images or generating images from text.',
  1
FROM lingo_lessons WHERE lesson_id = 'ai-multimodal-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, answers, explanation, sort_order)
SELECT id, 'fill_blank',
  'CLIP from OpenAI learns to ___ images and text into a shared embedding space.',
  '["align", "encode", "map"]'::jsonb,
  'CLIP aligns image and text representations so that similar concepts have similar embeddings regardless of modality.',
  2
FROM lingo_lessons WHERE lesson_id = 'ai-multimodal-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, pairs, explanation, sort_order)
SELECT id, 'matching',
  'Match each multimodal task to its description.',
  '[{"left": "Image captioning", "right": "Generate text descriptions of images"}, {"left": "Text-to-image", "right": "Create images from text prompts"}, {"left": "Visual QA", "right": "Answer questions about image content"}]'::jsonb,
  'Captioning describes images, text-to-image generates from prompts, VQA answers questions about visual content.',
  3
FROM lingo_lessons WHERE lesson_id = 'ai-multimodal-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, steps, explanation, sort_order)
SELECT id, 'ordering',
  'Order a typical multimodal processing pipeline.',
  '["Receive inputs from different modalities (text, image, audio)", "Encode each modality into embeddings", "Fuse or align embeddings in shared space", "Process combined representation through model", "Generate output in the desired modality"]'::jsonb,
  'Multi-input -> encode each -> fuse/align -> process -> output.',
  4
FROM lingo_lessons WHERE lesson_id = 'ai-multimodal-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, options, answer, explanation, sort_order)
SELECT id, 'multiple_choice',
  'What is a key challenge in multimodal AI?',
  '["Text is harder to process than images", "Aligning and fusing information from different modalities effectively", "Multimodal data is rare", "GPUs cannot process multiple data types"]'::jsonb,
  'Aligning and fusing information from different modalities effectively',
  'Different modalities have different structures and scales. Effectively combining them requires sophisticated alignment and fusion strategies.',
  5
FROM lingo_lessons WHERE lesson_id = 'ai-multimodal-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, ideal_answer, rubric, strictness, pass_score, explanation, sort_order)
SELECT id, 'free_response',
  'In 2-3 sentences, give an example of a real-world application that benefits from multimodal AI.',
  'Accessibility tools can use multimodal AI to describe images and videos for visually impaired users by combining visual understanding with natural language generation. Another example is autonomous vehicles that combine camera images, LIDAR data, and sensor readings to understand their environment.',
  'Provide a specific real-world application; explain how it uses multiple modalities; show understanding of the benefit.',
  0.7, 0.65, NULL,
  6
FROM lingo_lessons WHERE lesson_id = 'ai-multimodal-01';

-- ============================================================================
-- Lesson 17: Reinforcement Learning Basics
-- ============================================================================
INSERT INTO lingo_lessons (lesson_id, title, skill, duration, xp_reward, description, sort_order)
VALUES ('ai-rl-01', 'Reinforcement Learning Basics', 'Foundations', '9 min', 45, 'Understand how AI learns through trial and error with rewards and penalties.', 17);

INSERT INTO lingo_questions (lesson_id, type, prompt, options, answer, explanation, sort_order)
SELECT id, 'multiple_choice',
  'In reinforcement learning, what does the agent learn to maximize?',
  '["The amount of training data", "Cumulative reward over time", "The number of actions taken", "Memory usage"]'::jsonb,
  'Cumulative reward over time',
  'RL agents learn policies that maximize expected cumulative reward by taking actions in an environment.',
  1
FROM lingo_lessons WHERE lesson_id = 'ai-rl-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, answers, explanation, sort_order)
SELECT id, 'fill_blank',
  'The tradeoff between trying new actions and using known good actions is called the exploration-___ dilemma.',
  '["exploitation", "exploit"]'::jsonb,
  'Exploration discovers new strategies while exploitation uses known good strategies. Balancing them is key to RL success.',
  2
FROM lingo_lessons WHERE lesson_id = 'ai-rl-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, pairs, explanation, sort_order)
SELECT id, 'matching',
  'Match each RL concept to its definition.',
  '[{"left": "Agent", "right": "The learner that takes actions in the environment"}, {"left": "State", "right": "The current situation the agent observes"}, {"left": "Policy", "right": "The strategy that maps states to actions"}]'::jsonb,
  'Agent acts, state describes the situation, policy is the decision-making strategy.',
  3
FROM lingo_lessons WHERE lesson_id = 'ai-rl-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, steps, explanation, sort_order)
SELECT id, 'ordering',
  'Order the reinforcement learning loop.',
  '["Agent observes the current state", "Agent selects an action based on policy", "Environment transitions to new state", "Environment returns reward signal", "Agent updates policy based on experience"]'::jsonb,
  'Observe -> act -> environment responds -> receive reward -> learn.',
  4
FROM lingo_lessons WHERE lesson_id = 'ai-rl-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, options, answer, explanation, sort_order)
SELECT id, 'multiple_choice',
  'What problem does RLHF (Reinforcement Learning from Human Feedback) help solve?',
  '["Making models run faster", "Aligning model outputs with human preferences when rewards are hard to define", "Reducing training data needs", "Improving GPU utilization"]'::jsonb,
  'Aligning model outputs with human preferences when rewards are hard to define',
  'RLHF uses human feedback as the reward signal, helping train models to produce outputs humans prefer.',
  5
FROM lingo_lessons WHERE lesson_id = 'ai-rl-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, ideal_answer, rubric, strictness, pass_score, explanation, sort_order)
SELECT id, 'free_response',
  'In 2-3 sentences, describe a task where reinforcement learning is better suited than supervised learning.',
  'Game playing like chess or Go is well-suited for RL because the optimal moves depend on long-term strategy, and there''s a clear reward signal (winning). Unlike supervised learning, RL can discover novel strategies through self-play without needing labeled examples of "correct" moves.',
  'Identify a suitable RL task; explain why RL fits better; mention rewards, sequential decisions, or discovery aspects.',
  0.7, 0.65, NULL,
  6
FROM lingo_lessons WHERE lesson_id = 'ai-rl-01';

-- ============================================================================
-- Lesson 18: Conversational AI Design
-- ============================================================================
INSERT INTO lingo_lessons (lesson_id, title, skill, duration, xp_reward, description, sort_order)
VALUES ('ai-conversational-01', 'Conversational AI Design', 'LLMs', '8 min', 40, 'Learn best practices for designing chatbots and conversational interfaces.', 18);

INSERT INTO lingo_questions (lesson_id, type, prompt, options, answer, explanation, sort_order)
SELECT id, 'multiple_choice',
  'What is "context window" in conversational AI?',
  '["The physical screen where chat appears", "The amount of conversation history the model can consider", "The time limit for responses", "The chat UI design"]'::jsonb,
  'The amount of conversation history the model can consider',
  'Context window limits how many tokens (words/characters) the model can "see" at once, affecting memory of past conversation.',
  1
FROM lingo_lessons WHERE lesson_id = 'ai-conversational-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, answers, explanation, sort_order)
SELECT id, 'fill_blank',
  'Providing a consistent identity and voice for a chatbot is called giving it a ___.',
  '["persona", "personality", "character"]'::jsonb,
  'A well-defined persona helps the chatbot maintain consistent tone, behavior, and responses throughout conversations.',
  2
FROM lingo_lessons WHERE lesson_id = 'ai-conversational-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, pairs, explanation, sort_order)
SELECT id, 'matching',
  'Match each conversation design principle to its purpose.',
  '[{"left": "Fallback handling", "right": "Gracefully respond when the bot doesn''t understand"}, {"left": "Slot filling", "right": "Collect required information through conversation"}, {"left": "Disambiguation", "right": "Clarify user intent when multiple interpretations exist"}]'::jsonb,
  'Fallbacks handle misunderstandings, slot filling gathers info, disambiguation clarifies unclear requests.',
  3
FROM lingo_lessons WHERE lesson_id = 'ai-conversational-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, steps, explanation, sort_order)
SELECT id, 'ordering',
  'Order the chatbot response flow.',
  '["Receive user message", "Parse intent and extract entities", "Query relevant context or data sources", "Generate appropriate response", "Handle any error or edge cases gracefully"]'::jsonb,
  'Receive -> parse -> query context -> generate response -> handle edges.',
  4
FROM lingo_lessons WHERE lesson_id = 'ai-conversational-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, options, answer, explanation, sort_order)
SELECT id, 'multiple_choice',
  'What is a good practice when a chatbot cannot fulfill a user request?',
  '["Ignore the request", "Apologize, explain limitations, and suggest alternatives or human handoff", "Make up an answer anyway", "End the conversation immediately"]'::jsonb,
  'Apologize, explain limitations, and suggest alternatives or human handoff',
  'Graceful fallbacks maintain user trust. Acknowledge limitations, offer alternatives, and provide paths to human help when needed.',
  5
FROM lingo_lessons WHERE lesson_id = 'ai-conversational-01';

INSERT INTO lingo_questions (lesson_id, type, prompt, ideal_answer, rubric, strictness, pass_score, explanation, sort_order)
SELECT id, 'free_response',
  'In 2-3 sentences, describe how you would handle long conversations that exceed the context window limit.',
  'You can summarize older parts of the conversation and include only recent messages plus the summary. Another approach is using a retrieval system to store conversation history and fetch relevant past context when needed.',
  'Mention summarization or retrieval; explain how to maintain relevant context; show understanding of the context limit challenge.',
  0.7, 0.65, NULL,
  6
FROM lingo_lessons WHERE lesson_id = 'ai-conversational-01';
