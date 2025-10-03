-- AI Assessment Question Options
-- Answer choices for the assessment questions

-- Helper function to get question ID by text (for readability)
CREATE OR REPLACE FUNCTION get_question_id(q_text TEXT)
RETURNS UUID AS $$
  SELECT id FROM assessment_questions WHERE question_text = q_text LIMIT 1;
$$ LANGUAGE SQL;

-- =====================================================
-- AI FUNDAMENTALS OPTIONS
-- =====================================================

-- Question: What does AI stand for?
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index) VALUES
(get_question_id('What does AI stand for?'), 'Artificial Intelligence', 'artificial_intelligence', 5, true, 1),
(get_question_id('What does AI stand for?'), 'Automated Integration', 'automated_integration', 0, false, 2),
(get_question_id('What does AI stand for?'), 'Advanced Information', 'advanced_information', 0, false, 3),
(get_question_id('What does AI stand for?'), 'Algorithmic Interface', 'algorithmic_interface', 0, false, 4);

-- Question: Which of the following is a subset of AI?
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index, description) VALUES
(get_question_id('Which of the following is a subset of AI?'), 'Machine Learning', 'machine_learning', 5, true, 1, 'ML is a subset of AI that learns from data'),
(get_question_id('Which of the following is a subset of AI?'), 'Quantum Computing', 'quantum_computing', 0, false, 2, 'Related but separate field'),
(get_question_id('Which of the following is a subset of AI?'), 'Cloud Computing', 'cloud_computing', 0, false, 3, 'Infrastructure, not AI subset'),
(get_question_id('Which of the following is a subset of AI?'), 'Blockchain', 'blockchain', 0, false, 4, 'Different technology domain');

-- Question: What is the Turing Test used for?
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index) VALUES
(get_question_id('What is the Turing Test used for?'), 'Testing if a machine can exhibit human-like intelligence', 'human_intelligence', 10, true, 1),
(get_question_id('What is the Turing Test used for?'), 'Measuring computer processing speed', 'processing_speed', 0, false, 2),
(get_question_id('What is the Turing Test used for?'), 'Evaluating programming languages', 'programming_eval', 0, false, 3),
(get_question_id('What is the Turing Test used for?'), 'Testing network security', 'network_security', 0, false, 4);

-- Question: Explain the difference between narrow AI and general AI
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index, description) VALUES
(get_question_id('Explain the difference between narrow AI and general AI.'), 'Narrow AI is task-specific, General AI can perform any intellectual task', 'correct_distinction', 15, true, 1, 'Narrow AI excels at specific tasks, AGI would match human versatility'),
(get_question_id('Explain the difference between narrow AI and general AI.'), 'Narrow AI is older, General AI is newer', 'age_difference', 0, false, 2, 'Not about age of technology'),
(get_question_id('Explain the difference between narrow AI and general AI.'), 'Narrow AI uses less data, General AI uses more', 'data_difference', 0, false, 3, 'Not primarily about data volume'),
(get_question_id('Explain the difference between narrow AI and general AI.'), 'They are the same thing', 'same_thing', 0, false, 4, 'Fundamentally different concepts');

-- Question: How does symbolic AI differ from connectionist AI?
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index, description) VALUES
(get_question_id('How does symbolic AI differ from connectionist AI?'), 'Symbolic uses rules and logic, Connectionist uses neural networks', 'correct_paradigm', 15, true, 1, 'Two fundamental AI approaches'),
(get_question_id('How does symbolic AI differ from connectionist AI?'), 'Symbolic is faster, Connectionist is slower', 'speed_diff', 0, false, 2, 'Not about speed'),
(get_question_id('How does symbolic AI differ from connectionist AI?'), 'Symbolic is modern, Connectionist is outdated', 'age_diff', 0, false, 3, 'Both are still relevant'),
(get_question_id('How does symbolic AI differ from connectionist AI?'), 'No significant difference', 'no_diff', 0, false, 4, 'Major paradigm difference');

-- Question: Chess-playing system
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index, description) VALUES
(get_question_id('You need to build a system that can play chess. Which AI approach would be most suitable?'), 'Combination of search algorithms and evaluation functions', 'search_eval', 20, true, 1, 'Chess engines use minimax, alpha-beta pruning, and position evaluation'),
(get_question_id('You need to build a system that can play chess. Which AI approach would be most suitable?'), 'Simple pattern matching', 'pattern_match', 5, false, 2, 'Too simplistic for chess'),
(get_question_id('You need to build a system that can play chess. Which AI approach would be most suitable?'), 'Random move selection', 'random_moves', 0, false, 3, 'Would not play effectively'),
(get_question_id('You need to build a system that can play chess. Which AI approach would be most suitable?'), 'Text processing algorithms', 'text_processing', 0, false, 4, 'Wrong domain');

-- Question: Customer service automation
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index) VALUES
(get_question_id('A company wants to automate customer service responses. Which combination of AI techniques would you recommend?'), 'Natural Language Processing', 'nlp', 8, true, 1),
(get_question_id('A company wants to automate customer service responses. Which combination of AI techniques would you recommend?'), 'Sentiment Analysis', 'sentiment', 8, true, 2),
(get_question_id('A company wants to automate customer service responses. Which combination of AI techniques would you recommend?'), 'Dialogue Systems/Chatbots', 'chatbots', 9, true, 3),
(get_question_id('A company wants to automate customer service responses. Which combination of AI techniques would you recommend?'), 'Image Recognition', 'image_rec', 0, false, 4),
(get_question_id('A company wants to automate customer service responses. Which combination of AI techniques would you recommend?'), 'Self-driving algorithms', 'autonomous', 0, false, 5);

-- =====================================================
-- MACHINE LEARNING OPTIONS
-- =====================================================

-- Question: Three main types of ML
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index) VALUES
(get_question_id('What are the three main types of machine learning?'), 'Supervised Learning', 'supervised', 4, true, 1),
(get_question_id('What are the three main types of machine learning?'), 'Unsupervised Learning', 'unsupervised', 3, true, 2),
(get_question_id('What are the three main types of machine learning?'), 'Reinforcement Learning', 'reinforcement', 3, true, 3),
(get_question_id('What are the three main types of machine learning?'), 'Quantum Learning', 'quantum', 0, false, 4),
(get_question_id('What are the three main types of machine learning?'), 'Cloud Learning', 'cloud', 0, false, 5);

-- Question: Training dataset purpose
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index, description) VALUES
(get_question_id('What is the purpose of a training dataset?'), 'To teach the model patterns and relationships', 'teach_patterns', 10, true, 1, 'Training data is used to learn'),
(get_question_id('What is the purpose of a training dataset?'), 'To test final model performance', 'test_performance', 2, false, 2, 'That''s the test set purpose'),
(get_question_id('What is the purpose of a training dataset?'), 'To store model parameters', 'store_params', 0, false, 3, 'Not for storage'),
(get_question_id('What is the purpose of a training dataset?'), 'To validate hyperparameters', 'validate_hyper', 3, false, 4, 'That''s the validation set');

-- Question: Overfitting vs Underfitting
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index, description) VALUES
(get_question_id('Explain the difference between overfitting and underfitting.'), 'Overfitting: too complex, poor generalization. Underfitting: too simple, poor performance', 'correct_explanation', 15, true, 1, 'Overfitting memorizes, underfitting doesn''t capture patterns'),
(get_question_id('Explain the difference between overfitting and underfitting.'), 'Overfitting is good, underfitting is bad', 'good_bad', 0, false, 2, 'Both are problems'),
(get_question_id('Explain the difference between overfitting and underfitting.'), 'Overfitting uses more data, underfitting uses less', 'data_amount', 0, false, 3, 'Not about data volume'),
(get_question_id('Explain the difference between overfitting and underfitting.'), 'They are the same thing', 'same', 0, false, 4, 'Opposite problems');

-- Question: Cross-validation
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index, description) VALUES
(get_question_id('How does cross-validation help improve model performance?'), 'Better estimates model generalization by using multiple train/test splits', 'generalization', 15, true, 1, 'K-fold CV reduces variance in performance estimates'),
(get_question_id('How does cross-validation help improve model performance?'), 'It increases training data size', 'data_size', 3, false, 2, 'Doesn''t add data'),
(get_question_id('How does cross-validation help improve model performance?'), 'It speeds up training', 'speed', 0, false, 3, 'Actually takes longer'),
(get_question_id('How does cross-validation help improve model performance?'), 'It eliminates the need for test data', 'no_test', 0, false, 4, 'Still need final test set');

-- Question: Bias-variance tradeoff
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index, description) VALUES
(get_question_id('What is the bias-variance tradeoff?'), 'Balancing model simplicity (bias) and complexity (variance) for optimal performance', 'balance', 20, true, 1, 'Sweet spot between underfitting and overfitting'),
(get_question_id('What is the bias-variance tradeoff?'), 'Choosing between biased and unbiased datasets', 'data_bias', 0, false, 2, 'Not about data bias'),
(get_question_id('What is the bias-variance tradeoff?'), 'Trading training time for accuracy', 'time_accuracy', 0, false, 3, 'Not about time'),
(get_question_id('What is the bias-variance tradeoff?'), 'Selecting between different algorithms', 'algorithm_choice', 5, false, 4, 'Related but not the definition');

-- Question: Cat/dog classification
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index, description) VALUES
(get_question_id('You have a dataset with 100,000 images of cats and dogs. Which algorithm would be most appropriate for classification?'), 'Convolutional Neural Network (CNN)', 'cnn', 20, true, 1, 'CNNs excel at image classification'),
(get_question_id('You have a dataset with 100,000 images of cats and dogs. Which algorithm would be most appropriate for classification?'), 'Linear Regression', 'linear_reg', 0, false, 2, 'For continuous values, not classification'),
(get_question_id('You have a dataset with 100,000 images of cats and dogs. Which algorithm would be most appropriate for classification?'), 'K-means Clustering', 'kmeans', 3, false, 3, 'Unsupervised, not ideal for labeled data'),
(get_question_id('You have a dataset with 100,000 images of cats and dogs. Which algorithm would be most appropriate for classification?'), 'Decision Tree', 'decision_tree', 8, false, 4, 'Can work but not optimal for images');

-- Question: Overfitting troubleshooting
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index) VALUES
(get_question_id('Your model achieves 95% accuracy on training data but only 60% on test data. What steps would you take?'), 'Regularization (L1/L2)', 'regularization', 8, true, 1),
(get_question_id('Your model achieves 95% accuracy on training data but only 60% on test data. What steps would you take?'), 'Reduce model complexity', 'reduce_complexity', 8, true, 2),
(get_question_id('Your model achieves 95% accuracy on training data but only 60% on test data. What steps would you take?'), 'Add more training data', 'more_data', 9, true, 3),
(get_question_id('Your model achieves 95% accuracy on training data but only 60% on test data. What steps would you take?'), 'Use dropout', 'dropout', 0, false, 4),
(get_question_id('Your model achieves 95% accuracy on training data but only 60% on test data. What steps would you take?'), 'Increase learning rate', 'increase_lr', 0, false, 5);

-- Continue with remaining questions...
-- (For brevity, I'll add a few more key ones)

-- =====================================================
-- DEEP LEARNING OPTIONS
-- =====================================================

-- Question: Neural network composition
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index) VALUES
(get_question_id('What is a neural network composed of?'), 'Layers of interconnected neurons/nodes', 'layers_neurons', 10, true, 1),
(get_question_id('What is a neural network composed of?'), 'Database tables', 'database', 0, false, 2),
(get_question_id('What is a neural network composed of?'), 'If-then rules', 'rules', 0, false, 3),
(get_question_id('What is a neural network composed of?'), 'Decision trees', 'trees', 0, false, 4);

-- Question: Activation function purpose
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index, description) VALUES
(get_question_id('What is the purpose of the activation function?'), 'Introduce non-linearity to learn complex patterns', 'nonlinearity', 15, true, 1, 'Enables neural networks to approximate complex functions'),
(get_question_id('What is the purpose of the activation function?'), 'Speed up training', 'speed', 0, false, 2, 'Not primary purpose'),
(get_question_id('What is the purpose of the activation function?'), 'Reduce memory usage', 'memory', 0, false, 3, 'Not related to memory'),
(get_question_id('What is the purpose of the activation function?'), 'Normalize inputs', 'normalize', 5, false, 4, 'That''s batch normalization');

-- =====================================================
-- NLP OPTIONS
-- =====================================================

-- Question: What does NLP stand for?
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index) VALUES
(get_question_id('What does NLP stand for?'), 'Natural Language Processing', 'nlp', 5, true, 1),
(get_question_id('What does NLP stand for?'), 'Network Layer Protocol', 'network', 0, false, 2),
(get_question_id('What does NLP stand for?'), 'Neural Learning Process', 'neural', 0, false, 3),
(get_question_id('What does NLP stand for?'), 'New Language Program', 'new', 0, false, 4);

-- Drop helper function
DROP FUNCTION IF EXISTS get_question_id(TEXT);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_assessment_options_question ON assessment_question_options(question_id);
CREATE INDEX IF NOT EXISTS idx_assessment_options_correct ON assessment_question_options(is_correct);
