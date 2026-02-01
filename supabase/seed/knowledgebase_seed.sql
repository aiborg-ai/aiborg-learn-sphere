-- Knowledgebase Seed Data
-- Sample entries for AI Pioneers, Events, Companies, and Research

-- AI Pioneers
INSERT INTO knowledgebase_entries (
  title, slug, excerpt, content, topic_type, status, is_featured, featured_order, tags, metadata
) VALUES

-- Geoffrey Hinton
(
  'Geoffrey Hinton',
  'geoffrey-hinton',
  'Known as the "Godfather of AI", Geoffrey Hinton is a pioneering computer scientist whose work on neural networks laid the foundation for modern deep learning.',
  '## Early Life and Education

Geoffrey Everest Hinton was born on December 6, 1947, in London, England. He earned his BA in experimental psychology from Cambridge University in 1970 and his PhD in artificial intelligence from the University of Edinburgh in 1978.

## Contributions to AI

Hinton is best known for his work on artificial neural networks. His research on backpropagation, Boltzmann machines, and deep belief networks has been instrumental in the development of modern deep learning.

### Key Achievements

- Co-invented the backpropagation algorithm
- Developed Boltzmann machines and deep belief networks
- Created the dropout regularization technique
- Led the team that won ImageNet 2012 with AlexNet

## Recent Work

After decades at the University of Toronto and Google Brain, Hinton left Google in 2023 to speak freely about AI risks. He has become a prominent voice warning about the existential risks posed by advanced AI systems.

## Legacy

Hinton''s students and collaborators include many of today''s AI leaders, including Yann LeCun, Ilya Sutskever, and Ruslan Salakhutdinov. His influence on the field of AI cannot be overstated.',
  'pioneers',
  'published',
  true,
  1,
  ARRAY['deep learning', 'neural networks', 'backpropagation', 'Turing Award'],
  '{"specialty": "Deep Learning & Neural Networks", "country": "UK/Canada", "birth_year": 1947, "affiliations": ["University of Toronto", "Google Brain", "Vector Institute"], "awards": ["Turing Award 2018", "IJCAI Research Excellence Award", "IEEE Computational Intelligence Pioneer Award"]}'::jsonb
),

-- Yann LeCun
(
  'Yann LeCun',
  'yann-lecun',
  'Chief AI Scientist at Meta and pioneer of convolutional neural networks, Yann LeCun''s work has revolutionized computer vision and pattern recognition.',
  '## Background

Yann LeCun was born in 1960 in Soisy-sous-Montmorency, France. He received a PhD in Computer Science from Université Pierre et Marie Curie in 1987.

## Convolutional Neural Networks

LeCun is best known for developing convolutional neural networks (CNNs), which have become the standard architecture for computer vision tasks. His work on the LeNet architecture in the late 1980s and early 1990s demonstrated the practical potential of deep learning.

### Key Contributions

- Developed LeNet-5, one of the first CNNs
- Pioneered the use of CNNs for document recognition
- Created the MNIST dataset
- Advocated for energy-based learning models

## Current Work at Meta

As Chief AI Scientist at Meta (formerly Facebook), LeCun leads AI research efforts and has been vocal about his vision for AI development, including self-supervised learning and world models.

## Philosophy on AI

LeCun has been a prominent voice advocating for open AI research and has engaged in public debates about AI safety and development approaches.',
  'pioneers',
  'published',
  true,
  2,
  ARRAY['CNN', 'computer vision', 'deep learning', 'Meta AI'],
  '{"specialty": "Convolutional Neural Networks", "country": "France/USA", "birth_year": 1960, "affiliations": ["Meta AI", "NYU", "Bell Labs"], "awards": ["Turing Award 2018", "IEEE Neural Networks Pioneer Award", "AAAI Fellow"]}'::jsonb
),

-- Fei-Fei Li
(
  'Fei-Fei Li',
  'fei-fei-li',
  'Co-director of Stanford''s Human-Centered AI Institute and creator of ImageNet, Fei-Fei Li has shaped how machines learn to see and understand images.',
  '## Background

Fei-Fei Li was born in Beijing, China, and moved to the United States when she was 16. She earned her PhD in electrical engineering from Caltech in 2005.

## ImageNet and Computer Vision

Li''s most influential contribution is ImageNet, a large-scale dataset of labeled images that has been instrumental in advancing computer vision. The ImageNet Large Scale Visual Recognition Challenge (ILSVRC) became a benchmark for measuring progress in image classification.

### Impact of ImageNet

- Catalyzed the deep learning revolution
- Demonstrated the importance of large-scale data
- Led to breakthroughs like AlexNet
- Transformed computer vision research

## Human-Centered AI

Li is a strong advocate for developing AI that benefits humanity. She co-founded Stanford''s Human-Centered AI Institute and emphasizes the importance of ethics, diversity, and social impact in AI development.

## Entrepreneurship

Li co-founded World Labs, a company focused on developing AI that understands the 3D world.',
  'pioneers',
  'published',
  true,
  3,
  ARRAY['ImageNet', 'computer vision', 'AI ethics', 'Stanford'],
  '{"specialty": "Computer Vision & AI Ethics", "country": "China/USA", "birth_year": 1976, "affiliations": ["Stanford University", "Google Cloud", "World Labs"], "awards": ["ACM Fellow", "National Academy of Engineering Member", "Time 100 Most Influential People"]}'::jsonb
),

-- Demis Hassabis
(
  'Demis Hassabis',
  'demis-hassabis',
  'CEO and co-founder of DeepMind, Demis Hassabis has led the development of AlphaGo, AlphaFold, and other groundbreaking AI systems.',
  '## Background

Demis Hassabis was born in London in 1976. A child prodigy in chess, he later studied computer science at Cambridge and earned a PhD in cognitive neuroscience from UCL.

## DeepMind

Hassabis co-founded DeepMind in 2010 with the mission of solving intelligence. The company was acquired by Google in 2014 for approximately $500 million.

### Major Achievements at DeepMind

- **AlphaGo**: First AI to defeat a world champion Go player
- **AlphaFold**: Solved the protein folding problem
- **AlphaCode**: AI that can compete in programming competitions
- **Gemini**: Advanced multimodal AI model

## Scientific Impact

AlphaFold has been particularly transformative for biology, predicting the structure of nearly all known proteins. This achievement was named Method of the Year by Nature Methods in 2021.

## Recognition

Hassabis has received numerous accolades, including a knighthood from King Charles III and the Nobel Prize in Chemistry 2024 for AlphaFold.',
  'pioneers',
  'published',
  true,
  4,
  ARRAY['DeepMind', 'AlphaGo', 'AlphaFold', 'reinforcement learning'],
  '{"specialty": "Artificial General Intelligence", "country": "UK", "birth_year": 1976, "affiliations": ["DeepMind", "Google"], "awards": ["Nobel Prize in Chemistry 2024", "Knight Bachelor 2024", "Breakthrough Prize 2023"]}'::jsonb
);

-- AI Events
INSERT INTO knowledgebase_entries (
  title, slug, excerpt, content, topic_type, status, is_featured, featured_order, tags, metadata
) VALUES

-- NeurIPS
(
  'NeurIPS - Neural Information Processing Systems',
  'neurips',
  'The premier international conference on machine learning and neural computation, attracting thousands of researchers and practitioners annually.',
  '## About NeurIPS

The Conference on Neural Information Processing Systems (NeurIPS) is one of the most prestigious conferences in artificial intelligence and machine learning. Originally called NIPS, the conference was renamed in 2018.

## History

The first NIPS conference was held in 1987 in Denver, Colorado. Since then, it has grown from a small academic gathering to the largest AI conference in the world, with over 15,000 attendees.

## Format

NeurIPS features:
- Main conference presentations
- Workshops and tutorials
- Industry expo
- Poster sessions
- Invited talks from leading researchers

## Key Topics

- Deep learning
- Reinforcement learning
- Computer vision
- Natural language processing
- AI ethics and safety
- Neuroscience and AI

## Impact

Many groundbreaking papers have been presented at NeurIPS, including seminal works on attention mechanisms, generative models, and reinforcement learning algorithms.',
  'events',
  'published',
  true,
  1,
  ARRAY['machine learning', 'conference', 'research', 'academic'],
  '{"start_date": "2025-12-08", "end_date": "2025-12-14", "location": "San Diego, USA", "venue": "San Diego Convention Center", "website": "https://neurips.cc", "is_virtual": false}'::jsonb
),

-- ICML
(
  'ICML - International Conference on Machine Learning',
  'icml',
  'A leading academic conference in machine learning, known for rigorous peer review and cutting-edge research presentations.',
  '## About ICML

The International Conference on Machine Learning (ICML) is one of the leading international conferences for machine learning research. It is sponsored by the International Machine Learning Society (IMLS).

## History

ICML has been held annually since 1988. The conference rotates between venues in North America, Europe, and other regions.

## Key Features

- Rigorous double-blind peer review
- Tutorials on emerging topics
- Workshops on specialized areas
- Invited talks from field leaders
- Industry day with practical applications

## Topics Covered

- Supervised and unsupervised learning
- Deep learning architectures
- Optimization methods
- Learning theory
- Applications in various domains

## Recent Trends

Recent ICML conferences have seen increasing interest in large language models, AI safety, and sustainable AI.',
  'events',
  'published',
  true,
  2,
  ARRAY['machine learning', 'conference', 'research', 'IMLS'],
  '{"start_date": "2025-07-21", "end_date": "2025-07-27", "location": "Vienna, Austria", "venue": "Austria Center Vienna", "website": "https://icml.cc", "is_virtual": false}'::jsonb
),

-- AI Impact Summit India
(
  'AI Impact Summit India',
  'ai-impact-summit-india',
  'India''s premier AI conference bringing together global leaders, researchers, and practitioners to discuss AI''s transformative impact on society and business.',
  '## About AI Impact Summit India

The AI Impact Summit India is a premier event focused on the practical applications and societal impact of artificial intelligence in the Indian context and globally.

## Mission

To bridge the gap between AI research and real-world implementation, while addressing the unique challenges and opportunities in emerging markets.

## Key Themes

- AI for social good
- Enterprise AI adoption
- AI policy and governance
- Startup ecosystem
- Skills development and education
- Responsible AI deployment

## Features

- Keynotes from global AI leaders
- Panel discussions on policy
- Startup showcase
- Hands-on workshops
- Networking opportunities
- Government partnerships

## Significance

As India emerges as a major player in the global AI landscape, this summit provides a platform for dialogue on how AI can drive inclusive growth and development.',
  'events',
  'published',
  true,
  3,
  ARRAY['India', 'AI policy', 'social impact', 'enterprise AI'],
  '{"start_date": "2025-09-15", "end_date": "2025-09-17", "location": "Bangalore, India", "venue": "Bangalore International Exhibition Centre", "website": "https://aiimpactsummit.in", "is_virtual": false}'::jsonb
);

-- AI Companies
INSERT INTO knowledgebase_entries (
  title, slug, excerpt, content, topic_type, status, is_featured, featured_order, tags, metadata
) VALUES

-- OpenAI
(
  'OpenAI',
  'openai',
  'The creator of ChatGPT and GPT-4, OpenAI is one of the world''s leading AI research companies focused on ensuring artificial general intelligence benefits humanity.',
  '## About OpenAI

OpenAI is an AI research and deployment company headquartered in San Francisco. Founded in 2015, it has become one of the most influential organizations in AI.

## Mission

OpenAI''s stated mission is to ensure that artificial general intelligence (AGI) benefits all of humanity.

## Key Products

### ChatGPT
A conversational AI that can engage in dialogue, answer questions, and assist with various tasks. It reached 100 million users faster than any other application in history.

### GPT-4
A large multimodal model that can process both text and images, demonstrating human-level performance on many professional and academic benchmarks.

### DALL-E
An AI system that can create realistic images and art from natural language descriptions.

### Sora
A text-to-video generation model capable of creating realistic videos from text prompts.

## History

- 2015: Founded by Sam Altman, Elon Musk, and others
- 2019: Transitioned from non-profit to "capped-profit"
- 2022: Released ChatGPT
- 2023: Released GPT-4
- 2024: Released Sora and other models

## Funding and Valuation

OpenAI has received significant investment from Microsoft and others, with a valuation exceeding $80 billion.',
  'companies',
  'published',
  true,
  1,
  ARRAY['ChatGPT', 'GPT-4', 'AGI', 'LLM'],
  '{"founded_year": 2015, "headquarters": "San Francisco, CA", "website": "https://openai.com", "employees": "1000+", "funding": "$13B+", "ceo": "Sam Altman", "products": ["ChatGPT", "GPT-4", "DALL-E", "Sora", "Codex"]}'::jsonb
),

-- Anthropic
(
  'Anthropic',
  'anthropic',
  'An AI safety company founded by former OpenAI researchers, known for Claude and its focus on building reliable, interpretable, and steerable AI systems.',
  '## About Anthropic

Anthropic is an AI safety company founded in 2021 by former OpenAI researchers, including Dario and Daniela Amodei. The company focuses on building AI systems that are safe, beneficial, and understandable.

## Mission

Anthropic''s mission is to build reliable, interpretable, and steerable AI systems while advancing the science of AI safety.

## Key Products

### Claude
Anthropic''s flagship AI assistant, known for its helpful, harmless, and honest approach. Claude is designed to be a conversational AI that can assist with a wide range of tasks.

### Claude Code
A specialized version of Claude for software development tasks, available as a CLI tool.

## Research Focus

- Constitutional AI
- Interpretability
- AI alignment
- Scalable oversight
- Red teaming and safety evaluation

## Safety Approach

Anthropic developed Constitutional AI (CAI), a method for training AI systems using a set of principles, allowing the AI to learn to be helpful while avoiding harmful outputs.

## Funding and Growth

Anthropic has raised significant funding from investors including Google and Amazon, with a valuation of $18+ billion.',
  'companies',
  'published',
  true,
  2,
  ARRAY['Claude', 'AI safety', 'Constitutional AI', 'alignment'],
  '{"founded_year": 2021, "headquarters": "San Francisco, CA", "website": "https://anthropic.com", "employees": "500+", "funding": "$7B+", "ceo": "Dario Amodei", "products": ["Claude", "Claude Code", "Claude API"]}'::jsonb
),

-- DeepMind
(
  'DeepMind',
  'deepmind',
  'A leading AI research laboratory owned by Alphabet, responsible for breakthrough achievements including AlphaGo, AlphaFold, and Gemini.',
  '## About DeepMind

DeepMind is a British artificial intelligence research laboratory founded in 2010 and acquired by Google (now Alphabet) in 2014. It is one of the world''s leading AI research organizations.

## Mission

DeepMind''s mission is to solve intelligence and then use that to solve everything else.

## Major Achievements

### AlphaGo
In 2016, AlphaGo became the first AI to defeat a world champion at the game of Go, a milestone many thought was decades away.

### AlphaFold
Solved the 50-year-old protein folding problem, predicting protein structures with atomic-level accuracy. This breakthrough has revolutionized biology and drug discovery.

### Gemini
DeepMind''s most advanced AI model, capable of multimodal reasoning across text, images, video, and code.

## Research Areas

- Deep reinforcement learning
- Neuroscience-inspired AI
- Language models
- AI for science
- AI safety and ethics

## Impact on Science

DeepMind has published extensively in top scientific journals, including Nature and Science, and has made many of its tools available to researchers worldwide.',
  'companies',
  'published',
  true,
  3,
  ARRAY['AlphaGo', 'AlphaFold', 'Gemini', 'reinforcement learning'],
  '{"founded_year": 2010, "headquarters": "London, UK", "website": "https://deepmind.com", "employees": "2000+", "funding": "Owned by Alphabet", "ceo": "Demis Hassabis", "products": ["AlphaGo", "AlphaFold", "Gemini", "AlphaCode"]}'::jsonb
);

-- AI Research Papers
INSERT INTO knowledgebase_entries (
  title, slug, excerpt, content, topic_type, status, is_featured, featured_order, tags, metadata
) VALUES

-- Attention Is All You Need
(
  'Attention Is All You Need',
  'attention-is-all-you-need',
  'The seminal 2017 paper that introduced the Transformer architecture, which has become the foundation for modern large language models including GPT and BERT.',
  '## Overview

"Attention Is All You Need" is a landmark paper published in 2017 by researchers at Google Brain and Google Research. The paper introduced the Transformer architecture, which has revolutionized natural language processing and beyond.

## Key Contributions

### The Transformer Architecture
The paper proposed a new architecture based entirely on attention mechanisms, dispensing with recurrence and convolutions entirely. This allowed for significantly more parallelization during training.

### Self-Attention
The self-attention mechanism allows the model to look at other positions in the input sequence when encoding a token, capturing dependencies regardless of their distance.

### Multi-Head Attention
The paper introduced multi-head attention, which allows the model to attend to information from different representation subspaces.

## Impact

The Transformer has become the dominant architecture for:
- Large language models (GPT, BERT, LLaMA)
- Machine translation
- Text generation
- Code generation
- Vision (ViT)

## Citation Count

As of 2024, the paper has been cited over 100,000 times, making it one of the most influential papers in machine learning history.

## Quote

"We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely."',
  'research',
  'published',
  true,
  1,
  ARRAY['Transformer', 'attention', 'NLP', 'Google'],
  '{"authors": ["Ashish Vaswani", "Noam Shazeer", "Niki Parmar", "Jakob Uszkoreit", "Llion Jones", "Aidan N. Gomez", "Łukasz Kaiser", "Illia Polosukhin"], "publication_date": "2017-06-12", "journal": "NeurIPS 2017", "doi": "10.48550/arXiv.1706.03762", "citations": 120000, "abstract": "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely."}'::jsonb
),

-- ImageNet Classification with Deep CNNs (AlexNet)
(
  'ImageNet Classification with Deep Convolutional Neural Networks',
  'imagenet-classification-alexnet',
  'The AlexNet paper that won ImageNet 2012 and sparked the deep learning revolution in computer vision.',
  '## Overview

This paper, commonly known as the "AlexNet paper," presented a deep convolutional neural network that won the ImageNet Large Scale Visual Recognition Challenge (ILSVRC) 2012 by a significant margin.

## Key Contributions

### Deep Architecture
AlexNet was one of the first deep CNNs to achieve success at scale, using 8 layers (5 convolutional, 3 fully-connected).

### ReLU Activation
The paper popularized the use of Rectified Linear Units (ReLU) instead of tanh or sigmoid, enabling faster training.

### Dropout
Introduced dropout as a regularization technique to prevent overfitting in deep networks.

### GPU Training
Demonstrated the use of GPUs for training deep networks, splitting the model across two GTX 580 GPUs.

## Results

AlexNet achieved a top-5 error rate of 15.3%, compared to 26.2% for the second-place entry, demonstrating a dramatic improvement.

## Impact

This paper is widely credited with starting the deep learning revolution in computer vision and AI more broadly. It showed that deep learning could achieve state-of-the-art results on large-scale tasks.

## Legacy

The techniques introduced in AlexNet—ReLU, dropout, data augmentation, GPU training—became standard practice in deep learning.',
  'research',
  'published',
  true,
  2,
  ARRAY['AlexNet', 'CNN', 'ImageNet', 'deep learning'],
  '{"authors": ["Alex Krizhevsky", "Ilya Sutskever", "Geoffrey E. Hinton"], "publication_date": "2012-12-03", "journal": "NeurIPS 2012", "doi": "10.1145/3065386", "citations": 120000, "abstract": "We trained a large, deep convolutional neural network to classify the 1.2 million high-resolution images in the ImageNet LSVRC-2010 contest into the 1000 different classes."}'::jsonb
),

-- BERT
(
  'BERT: Pre-training of Deep Bidirectional Transformers',
  'bert-pretraining',
  'Google''s BERT introduced bidirectional pre-training and fine-tuning paradigm that became the standard approach for NLP tasks.',
  '## Overview

BERT (Bidirectional Encoder Representations from Transformers) was published by Google AI in 2018. It introduced a new approach to pre-training language representations that achieved state-of-the-art results on a wide range of NLP tasks.

## Key Innovations

### Bidirectional Pre-training
Unlike previous models that were unidirectional, BERT is designed to pre-train deep bidirectional representations by jointly conditioning on both left and right context.

### Masked Language Modeling
BERT introduced masked language modeling (MLM), where some input tokens are masked and the model learns to predict them based on context.

### Next Sentence Prediction
BERT also uses next sentence prediction (NSP) to capture relationships between sentences.

## Pre-train, Fine-tune Paradigm

BERT established the now-standard paradigm of pre-training on large unlabeled corpora and fine-tuning on task-specific labeled data.

## Impact

BERT achieved state-of-the-art results on 11 NLP tasks when released, including:
- Question answering (SQuAD)
- Named entity recognition
- Sentiment analysis
- Text classification

## Legacy

BERT spawned a family of models including RoBERTa, ALBERT, DistilBERT, and many others. The pre-train and fine-tune paradigm it established remains central to NLP today.',
  'research',
  'published',
  true,
  3,
  ARRAY['BERT', 'NLP', 'pre-training', 'Google'],
  '{"authors": ["Jacob Devlin", "Ming-Wei Chang", "Kenton Lee", "Kristina Toutanova"], "publication_date": "2018-10-11", "journal": "NAACL 2019", "doi": "10.48550/arXiv.1810.04805", "citations": 90000, "abstract": "We introduce a new language representation model called BERT, which stands for Bidirectional Encoder Representations from Transformers. Unlike recent language representation models, BERT is designed to pre-train deep bidirectional representations from unlabeled text by jointly conditioning on both left and right context in all layers."}'::jsonb
);
