-- Seed Data: External AI Courses
-- Sample courses from various providers for the marketplace

-- First, ensure we have the provider IDs
DO $$
DECLARE
  v_coursera_id UUID;
  v_udemy_id UUID;
  v_edx_id UUID;
  v_deeplearning_ai_id UUID;
  v_fast_ai_id UUID;
  v_kaggle_id UUID;
  v_google_ai_id UUID;
  v_aws_ml_id UUID;
  v_huggingface_id UUID;
  v_linkedin_learning_id UUID;
  v_pluralsight_id UUID;
  v_swayam_id UUID;
  v_futurelearn_id UUID;
BEGIN
  -- Get provider IDs
  SELECT id INTO v_coursera_id FROM course_providers WHERE slug = 'coursera';
  SELECT id INTO v_udemy_id FROM course_providers WHERE slug = 'udemy';
  SELECT id INTO v_edx_id FROM course_providers WHERE slug = 'edx';
  SELECT id INTO v_deeplearning_ai_id FROM course_providers WHERE slug = 'deeplearning_ai';
  SELECT id INTO v_fast_ai_id FROM course_providers WHERE slug = 'fast_ai';
  SELECT id INTO v_kaggle_id FROM course_providers WHERE slug = 'kaggle';
  SELECT id INTO v_google_ai_id FROM course_providers WHERE slug = 'google_ai';
  SELECT id INTO v_aws_ml_id FROM course_providers WHERE slug = 'aws_ml';
  SELECT id INTO v_huggingface_id FROM course_providers WHERE slug = 'huggingface';
  SELECT id INTO v_linkedin_learning_id FROM course_providers WHERE slug = 'linkedin_learning';
  SELECT id INTO v_pluralsight_id FROM course_providers WHERE slug = 'pluralsight';
  SELECT id INTO v_swayam_id FROM course_providers WHERE slug = 'swayam';
  SELECT id INTO v_futurelearn_id FROM course_providers WHERE slug = 'futurelearn';

  -- Insert Coursera courses
  INSERT INTO external_courses (
    provider_id, slug, title, description, instructor_name, thumbnail_url, external_url,
    level, mode, language, duration_hours, duration_text, price_type, price_amount, price_currency,
    rating, review_count, enrollment_count, certificate_available, skills, topics, categories,
    learning_outcomes, prerequisites, is_featured
  ) VALUES
  (
    v_coursera_id, 'machine-learning-stanford',
    'Machine Learning by Stanford University',
    'This course provides a broad introduction to machine learning and statistical pattern recognition. Learn about supervised and unsupervised learning, dimensionality reduction, and best practices.',
    'Andrew Ng',
    'https://d3njjcbhbojbot.cloudfront.net/api/utilities/v1/imageproxy/https://s3.amazonaws.com/coursera-course-photos/83/e258e0532611e5a5072321239ff4d4/ML.png',
    'https://www.coursera.org/learn/machine-learning',
    'intermediate', 'self-paced', 'en', 60, '11 weeks', 'freemium', 49.00, 'USD',
    4.9, 185000, 4800000, true,
    ARRAY['Machine Learning', 'Supervised Learning', 'Unsupervised Learning', 'Neural Networks', 'Python'],
    ARRAY['Algorithms', 'Data Science', 'AI'],
    ARRAY['Machine Learning', 'AI Fundamentals'],
    ARRAY['Understand the fundamentals of machine learning', 'Apply supervised learning techniques', 'Implement neural networks from scratch'],
    ARRAY['Basic programming knowledge', 'Linear algebra fundamentals'],
    true
  ),
  (
    v_coursera_id, 'deep-learning-specialization',
    'Deep Learning Specialization',
    'Master Deep Learning and Break into AI. Learn the foundations of Deep Learning, understand how to build neural networks, and learn to lead successful machine learning projects.',
    'Andrew Ng',
    'https://d3njjcbhbojbot.cloudfront.net/api/utilities/v1/imageproxy/https://d15cw65ipctsrr.cloudfront.net/82/f7c8106d6011e8bb47af21cc0c9a54/CourseArt.png',
    'https://www.coursera.org/specializations/deep-learning',
    'intermediate', 'self-paced', 'en', 120, '5 months', 'subscription', 49.00, 'USD',
    4.9, 120000, 950000, true,
    ARRAY['Deep Learning', 'TensorFlow', 'CNN', 'RNN', 'NLP', 'Computer Vision'],
    ARRAY['Neural Networks', 'AI', 'Machine Learning'],
    ARRAY['Deep Learning', 'Neural Networks'],
    ARRAY['Build and train deep neural networks', 'Implement vectorized neural networks', 'Build CNNs and RNNs'],
    ARRAY['Python programming', 'Basic machine learning knowledge'],
    true
  ),
  (
    v_coursera_id, 'generative-ai-for-everyone',
    'Generative AI for Everyone',
    'Learn the fundamentals of generative AI, including how it works, what it can and cannot do, and how to use it in your work and life.',
    'Andrew Ng',
    'https://d3njjcbhbojbot.cloudfront.net/api/utilities/v1/imageproxy/https://d15cw65ipctsrr.cloudfront.net/cd/2c03e0d85111ee8a0f6b8fc5d35c21/genai-course-art.png',
    'https://www.coursera.org/learn/generative-ai-for-everyone',
    'beginner', 'self-paced', 'en', 8, '3 weeks', 'freemium', 0, 'USD',
    4.8, 45000, 520000, true,
    ARRAY['Generative AI', 'ChatGPT', 'LLMs', 'Prompt Engineering'],
    ARRAY['AI', 'Productivity', 'Business'],
    ARRAY['Generative AI', 'Large Language Models'],
    ARRAY['Understand how generative AI works', 'Learn prompt engineering techniques', 'Apply AI to business problems'],
    ARRAY[]::text[],
    true
  );

  -- Insert DeepLearning.AI courses
  INSERT INTO external_courses (
    provider_id, slug, title, description, instructor_name, thumbnail_url, external_url,
    level, mode, language, duration_hours, duration_text, price_type, price_amount, price_currency,
    rating, review_count, enrollment_count, certificate_available, skills, topics, categories,
    learning_outcomes, is_featured
  ) VALUES
  (
    v_deeplearning_ai_id, 'chatgpt-prompt-engineering',
    'ChatGPT Prompt Engineering for Developers',
    'Learn prompt engineering best practices for application development. Learn how to effectively use LLM technology, including OpenAI API.',
    'Isa Fulford, Andrew Ng',
    'https://www.deeplearning.ai/content/images/2023/04/prompt-engineering-course.png',
    'https://www.deeplearning.ai/short-courses/chatgpt-prompt-engineering-for-developers/',
    'beginner', 'self-paced', 'en', 2, '1 hour', 'free', 0, 'USD',
    4.9, 28000, 450000, false,
    ARRAY['Prompt Engineering', 'ChatGPT', 'OpenAI API', 'Python'],
    ARRAY['LLMs', 'AI Development'],
    ARRAY['Prompt Engineering', 'Large Language Models'],
    ARRAY['Write effective prompts', 'Build applications with LLMs', 'Understand LLM limitations'],
    true
  ),
  (
    v_deeplearning_ai_id, 'langchain-llm-apps',
    'LangChain for LLM Application Development',
    'Learn to build powerful applications combining LLMs with other sources of knowledge and computation using LangChain framework.',
    'Harrison Chase, Andrew Ng',
    'https://www.deeplearning.ai/content/images/2023/05/langchain-course.png',
    'https://www.deeplearning.ai/short-courses/langchain-for-llm-application-development/',
    'intermediate', 'self-paced', 'en', 2, '1 hour', 'free', 0, 'USD',
    4.8, 15000, 180000, false,
    ARRAY['LangChain', 'LLMs', 'RAG', 'Python', 'Vector Databases'],
    ARRAY['AI Development', 'Framework'],
    ARRAY['Large Language Models', 'AI Applications'],
    ARRAY['Build LLM applications with LangChain', 'Implement RAG systems', 'Chain multiple LLM calls'],
    true
  );

  -- Insert fast.ai courses
  INSERT INTO external_courses (
    provider_id, slug, title, description, instructor_name, thumbnail_url, external_url,
    level, mode, language, duration_hours, duration_text, price_type, rating, review_count,
    enrollment_count, certificate_available, skills, topics, categories, learning_outcomes, is_featured
  ) VALUES
  (
    v_fast_ai_id, 'practical-deep-learning',
    'Practical Deep Learning for Coders',
    'A free course designed for people with some coding experience who want to learn how to apply deep learning and machine learning to practical problems.',
    'Jeremy Howard',
    'https://course.fast.ai/images/course-card.png',
    'https://course.fast.ai/',
    'intermediate', 'self-paced', 'en', 40, '7 weeks', 'free',
    4.9, 12000, 350000, false,
    ARRAY['Deep Learning', 'PyTorch', 'fastai', 'Computer Vision', 'NLP', 'Tabular Data'],
    ARRAY['Practical AI', 'Machine Learning'],
    ARRAY['Deep Learning', 'AI Fundamentals'],
    ARRAY['Build and deploy deep learning models', 'Use transfer learning effectively', 'Apply AI to real-world problems'],
    true
  );

  -- Insert Kaggle courses
  INSERT INTO external_courses (
    provider_id, slug, title, description, instructor_name, thumbnail_url, external_url,
    level, mode, language, duration_hours, duration_text, price_type, rating, review_count,
    enrollment_count, certificate_available, skills, topics, categories
  ) VALUES
  (
    v_kaggle_id, 'intro-to-machine-learning',
    'Intro to Machine Learning',
    'Learn the core ideas in machine learning, and build your first models.',
    'Dan Becker',
    'https://storage.googleapis.com/kaggle-course-assets/learnml.png',
    'https://www.kaggle.com/learn/intro-to-machine-learning',
    'beginner', 'self-paced', 'en', 3, '3 hours', 'free',
    4.7, 8500, 420000, true,
    ARRAY['Machine Learning', 'scikit-learn', 'Python', 'Model Training'],
    ARRAY['Data Science', 'ML Basics'],
    ARRAY['Machine Learning', 'AI Fundamentals']
  ),
  (
    v_kaggle_id, 'intro-to-deep-learning',
    'Intro to Deep Learning',
    'Use TensorFlow and Keras to build and train neural networks for structured data.',
    'Ryan Holbrook',
    'https://storage.googleapis.com/kaggle-course-assets/dl-intro.png',
    'https://www.kaggle.com/learn/intro-to-deep-learning',
    'intermediate', 'self-paced', 'en', 4, '4 hours', 'free',
    4.6, 5200, 180000, true,
    ARRAY['Deep Learning', 'TensorFlow', 'Keras', 'Neural Networks'],
    ARRAY['AI', 'Neural Networks'],
    ARRAY['Deep Learning']
  );

  -- Insert Google AI courses
  INSERT INTO external_courses (
    provider_id, slug, title, description, instructor_name, thumbnail_url, external_url,
    level, mode, language, duration_hours, duration_text, price_type, rating, review_count,
    enrollment_count, certificate_available, skills, topics, categories, is_featured
  ) VALUES
  (
    v_google_ai_id, 'machine-learning-crash-course',
    'Machine Learning Crash Course with TensorFlow',
    'A self-study guide for aspiring machine learning practitioners from Google. Features interactive visualizations, video lectures, and hands-on exercises.',
    'Google AI Team',
    'https://developers.google.com/static/machine-learning/crash-course/images/mlcc-promo.png',
    'https://developers.google.com/machine-learning/crash-course',
    'beginner', 'self-paced', 'en', 15, '15 hours', 'free',
    4.8, 18000, 680000, false,
    ARRAY['TensorFlow', 'Machine Learning', 'Python', 'Data Analysis'],
    ARRAY['ML Fundamentals', 'Google Cloud'],
    ARRAY['Machine Learning', 'AI Fundamentals'],
    true
  );

  -- Insert AWS ML courses
  INSERT INTO external_courses (
    provider_id, slug, title, description, instructor_name, thumbnail_url, external_url,
    level, mode, language, duration_hours, duration_text, price_type, price_amount,
    rating, review_count, enrollment_count, certificate_available, skills, topics, categories
  ) VALUES
  (
    v_aws_ml_id, 'aws-machine-learning-foundations',
    'AWS Machine Learning Foundations',
    'Learn the fundamentals of machine learning on AWS. Understand ML concepts and gain hands-on experience with Amazon SageMaker.',
    'AWS Training Team',
    'https://d1.awsstatic.com/training-and-certification/Learning_Paths/learning-path_machine-learning-dev.png',
    'https://aws.amazon.com/training/learn-about/machine-learning/',
    'beginner', 'self-paced', 'en', 8, '8 hours', 'free', 0,
    4.5, 6800, 145000, true,
    ARRAY['AWS', 'SageMaker', 'Machine Learning', 'Cloud ML'],
    ARRAY['Cloud Computing', 'MLOps'],
    ARRAY['Machine Learning', 'MLOps']
  );

  -- Insert Hugging Face courses
  INSERT INTO external_courses (
    provider_id, slug, title, description, instructor_name, thumbnail_url, external_url,
    level, mode, language, duration_hours, duration_text, price_type, rating, review_count,
    enrollment_count, certificate_available, skills, topics, categories, is_featured
  ) VALUES
  (
    v_huggingface_id, 'nlp-course',
    'Hugging Face NLP Course',
    'Learn how to apply Transformers to various NLP tasks. The course teaches you how to use the Hugging Face ecosystem.',
    'Hugging Face Team',
    'https://huggingface.co/datasets/huggingface-course/assets/resolve/main/en/chapter1/summary.png',
    'https://huggingface.co/learn/nlp-course/chapter1',
    'intermediate', 'self-paced', 'en', 20, '20 hours', 'free',
    4.9, 9500, 220000, false,
    ARRAY['Transformers', 'NLP', 'Hugging Face', 'PyTorch', 'BERT', 'GPT'],
    ARRAY['Natural Language Processing', 'Transformers'],
    ARRAY['Natural Language Processing'],
    true
  );

  -- Insert Udemy courses
  INSERT INTO external_courses (
    provider_id, slug, title, description, instructor_name, thumbnail_url, external_url,
    level, mode, language, duration_hours, duration_text, price_type, price_amount, price_currency,
    original_price, rating, review_count, enrollment_count, certificate_available, skills, topics, categories
  ) VALUES
  (
    v_udemy_id, 'complete-python-bootcamp',
    'Complete Python Bootcamp: From Zero to Hero in Python',
    'Learn Python like a Professional. Start from the basics and go all the way to creating your own applications and games.',
    'Jose Portilla',
    'https://img-c.udemycdn.com/course/750x422/567828_67d0.jpg',
    'https://www.udemy.com/course/complete-python-bootcamp/',
    'beginner', 'self-paced', 'en', 22, '22 hours', 'paid', 14.99, 'USD', 84.99,
    4.6, 485000, 1850000, true,
    ARRAY['Python', 'Programming', 'OOP', 'Web Scraping'],
    ARRAY['Programming', 'Development'],
    ARRAY['AI Fundamentals']
  ),
  (
    v_udemy_id, 'machine-learning-a-z',
    'Machine Learning A-Z: AI, Python & R + ChatGPT Prize',
    'Learn to create Machine Learning Algorithms in Python and R from two Data Science experts. Code templates included.',
    'Kirill Eremenko, Hadelin de Ponteves',
    'https://img-c.udemycdn.com/course/750x422/950390_270f_3.jpg',
    'https://www.udemy.com/course/machinelearning/',
    'intermediate', 'self-paced', 'en', 44, '44 hours', 'paid', 14.99, 'USD', 99.99,
    4.5, 185000, 980000, true,
    ARRAY['Machine Learning', 'Python', 'R', 'Data Science', 'Deep Learning'],
    ARRAY['Data Science', 'ML'],
    ARRAY['Machine Learning', 'Data Science']
  );

  -- Insert LinkedIn Learning courses
  INSERT INTO external_courses (
    provider_id, slug, title, description, instructor_name, thumbnail_url, external_url,
    level, mode, language, duration_hours, duration_text, price_type, price_amount, price_currency,
    rating, review_count, enrollment_count, certificate_available, skills, topics, categories
  ) VALUES
  (
    v_linkedin_learning_id, 'ai-foundations-machine-learning',
    'Artificial Intelligence Foundations: Machine Learning',
    'Get a foundational understanding of machine learning concepts, algorithms, and applications.',
    'Doug Rose',
    'https://media.licdn.com/dms/image/C560DAQH8dxvD9w-sVQ/learning-public-crop_288_512/0',
    'https://www.linkedin.com/learning/artificial-intelligence-foundations-machine-learning',
    'beginner', 'self-paced', 'en', 2, '2 hours', 'subscription', 29.99, 'USD',
    4.7, 12500, 185000, true,
    ARRAY['Machine Learning', 'AI Concepts', 'Business AI'],
    ARRAY['Business', 'AI'],
    ARRAY['AI Fundamentals', 'AI for Business']
  );

  -- Insert Pluralsight courses
  INSERT INTO external_courses (
    provider_id, slug, title, description, instructor_name, thumbnail_url, external_url,
    level, mode, language, duration_hours, duration_text, price_type, price_amount, price_currency,
    rating, review_count, enrollment_count, certificate_available, skills, topics, categories
  ) VALUES
  (
    v_pluralsight_id, 'building-ml-solutions-azure',
    'Building Machine Learning Solutions with Azure',
    'Learn to build and deploy machine learning models using Azure Machine Learning services.',
    'Matt Kruczek',
    'https://pluralsight.imgix.net/course-images/building-machine-learning-solutions-microsoft-azure-ml-service-v1.png',
    'https://www.pluralsight.com/courses/azure-machine-learning-service-building-solutions',
    'intermediate', 'self-paced', 'en', 4, '4 hours', 'subscription', 29.00, 'USD',
    4.6, 3200, 42000, true,
    ARRAY['Azure ML', 'Cloud ML', 'MLOps', 'Python'],
    ARRAY['Cloud', 'Enterprise ML'],
    ARRAY['Machine Learning', 'MLOps']
  );

  -- Insert FutureLearn courses
  INSERT INTO external_courses (
    provider_id, slug, title, description, instructor_name, thumbnail_url, external_url,
    level, mode, language, duration_hours, duration_text, price_type, rating, review_count,
    enrollment_count, certificate_available, skills, topics, categories
  ) VALUES
  (
    v_futurelearn_id, 'introduction-to-ai',
    'Introduction to Artificial Intelligence',
    'Explore what artificial intelligence is and how it works. Learn about the history of AI and its potential impact on society.',
    'Raspberry Pi Foundation',
    'https://futurelearn.imgix.net/courses/introduction-artificial-intelligence/header-image.jpg',
    'https://www.futurelearn.com/courses/introduction-to-artificial-intelligence',
    'beginner', 'cohort', 'en', 4, '4 weeks', 'freemium',
    4.5, 8500, 125000, true,
    ARRAY['AI Concepts', 'Ethics in AI', 'Machine Learning Basics'],
    ARRAY['AI Introduction', 'Ethics'],
    ARRAY['AI Fundamentals', 'AI Ethics']
  );

  -- Insert SWAYAM (India) courses
  INSERT INTO external_courses (
    provider_id, slug, title, description, instructor_name, thumbnail_url, external_url,
    level, mode, language, duration_hours, duration_text, price_type, rating, review_count,
    enrollment_count, certificate_available, skills, topics, categories
  ) VALUES
  (
    v_swayam_id, 'nptel-deep-learning',
    'Deep Learning - IIT Madras',
    'A comprehensive course on deep learning from the Indian Institute of Technology Madras, covering neural networks, CNNs, RNNs, and more.',
    'Prof. Mitesh Khapra',
    'https://onlinecourses.nptel.ac.in/noc23_cs92/assets/img/noc23_cs92.jpg',
    'https://onlinecourses.nptel.ac.in/noc23_cs92/',
    'intermediate', 'cohort', 'en', 60, '12 weeks', 'free',
    4.8, 6500, 185000, true,
    ARRAY['Deep Learning', 'Neural Networks', 'CNN', 'RNN', 'PyTorch'],
    ARRAY['Academic', 'Deep Learning'],
    ARRAY['Deep Learning', 'Neural Networks']
  );

  -- Insert edX courses
  INSERT INTO external_courses (
    provider_id, slug, title, description, instructor_name, thumbnail_url, external_url,
    level, mode, language, duration_hours, duration_text, price_type, price_amount, price_currency,
    rating, review_count, enrollment_count, certificate_available, skills, topics, categories, is_featured
  ) VALUES
  (
    v_edx_id, 'cs50-ai',
    'CS50''s Introduction to Artificial Intelligence with Python',
    'Learn to use machine learning in Python in this introductory course on artificial intelligence from Harvard University.',
    'Brian Yu, David J. Malan',
    'https://prod-discovery.edx-cdn.org/media/course/image/1d05c6e6-8c58-4a45-b3d0-8e07d1f8c0c2-7c548f5b63c0.small.png',
    'https://www.edx.org/learn/artificial-intelligence/harvard-university-cs50-s-introduction-to-artificial-intelligence-with-python',
    'intermediate', 'self-paced', 'en', 70, '7 weeks', 'freemium', 199.00, 'USD',
    4.9, 15800, 420000, true,
    ARRAY['Python', 'AI', 'Machine Learning', 'Search Algorithms', 'Knowledge Representation'],
    ARRAY['Computer Science', 'AI'],
    ARRAY['AI Fundamentals', 'Machine Learning'],
    true
  ),
  (
    v_edx_id, 'mit-intro-computational-thinking',
    'Introduction to Computational Thinking and Data Science',
    'Learn computational thinking and data science with Python from MIT. Covers optimization, simulation, and data analysis.',
    'John Guttag, Eric Grimson',
    'https://prod-discovery.edx-cdn.org/media/course/image/6.00.2x-3T2018.small.png',
    'https://www.edx.org/learn/computer-science/massachusetts-institute-of-technology-introduction-to-computational-thinking-and-data-science',
    'intermediate', 'self-paced', 'en', 90, '9 weeks', 'freemium', 75.00, 'USD',
    4.7, 8200, 285000, true,
    ARRAY['Python', 'Data Science', 'Machine Learning', 'Statistics', 'Optimization'],
    ARRAY['Data Science', 'Computer Science'],
    ARRAY['Data Science', 'Machine Learning'],
    false
  );

END $$;

-- Add comment for documentation
COMMENT ON TABLE external_courses IS 'Curated external AI courses from global providers. Seeded with sample courses from Coursera, DeepLearning.AI, fast.ai, Kaggle, Google AI, AWS, Hugging Face, Udemy, LinkedIn Learning, Pluralsight, FutureLearn, SWAYAM, and edX.';
