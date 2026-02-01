-- Summit Resources Seed Data
-- Sample resources for India AI Impact Summit 2026 - Seven Chakras Resource Hub
-- Run after: 20260130_summit_resource_hub.sql migration

-- ============================================
-- THEME 1: Safe & Trusted AI
-- ============================================

INSERT INTO public.summit_resources (slug, title, description, url, theme_id, resource_type, source, status, is_featured, featured_order, tags, metadata)
SELECT
  'niti-aayog-responsible-ai-framework',
  'NITI Aayog Responsible AI Framework',
  'India''s comprehensive framework for responsible AI development, covering principles of safety, transparency, accountability, and fairness. Essential reading for organizations implementing AI systems in India.',
  'https://www.niti.gov.in/responsible-ai',
  id,
  'official-doc',
  'NITI Aayog',
  'published',
  true,
  1,
  ARRAY['governance', 'policy', 'ethics', 'india'],
  '{"year": 2024, "pages": 45, "language": "English"}'::jsonb
FROM public.summit_themes WHERE slug = 'safe-trusted-ai';

INSERT INTO public.summit_resources (slug, title, description, url, theme_id, resource_type, source, status, is_featured, featured_order, tags, metadata)
SELECT
  'eu-ai-act-comprehensive-guide',
  'EU AI Act: A Comprehensive Guide',
  'Detailed analysis of the European Union''s AI Act and its implications for global AI governance. Includes risk classification framework and compliance requirements.',
  'https://artificialintelligenceact.eu/',
  id,
  'article',
  'European Commission',
  'published',
  false,
  0,
  ARRAY['regulation', 'europe', 'compliance', 'risk-management'],
  '{"year": 2024, "readTime": "25 min"}'::jsonb
FROM public.summit_themes WHERE slug = 'safe-trusted-ai';

INSERT INTO public.summit_resources (slug, title, description, url, theme_id, resource_type, source, status, is_featured, featured_order, tags, metadata)
SELECT
  'anthropic-constitutional-ai-paper',
  'Constitutional AI: Harmlessness from AI Feedback',
  'Groundbreaking research paper from Anthropic on training AI systems to be helpful, harmless, and honest using constitutional principles and AI feedback.',
  'https://arxiv.org/abs/2212.08073',
  id,
  'paper',
  'Anthropic',
  'published',
  true,
  2,
  ARRAY['research', 'safety', 'alignment', 'llm'],
  '{"year": 2022, "citations": 500}'::jsonb
FROM public.summit_themes WHERE slug = 'safe-trusted-ai';

INSERT INTO public.summit_resources (slug, title, description, url, theme_id, resource_type, source, status, is_featured, featured_order, tags, metadata)
SELECT
  'ai-safety-fundamentals-course',
  'AI Safety Fundamentals Course',
  'Free online course covering the fundamentals of AI safety, including alignment problem, interpretability, robustness, and governance. Ideal for researchers and practitioners.',
  'https://aisafetyfundamentals.com/',
  id,
  'tool',
  'AI Safety Fundamentals',
  'published',
  false,
  0,
  ARRAY['course', 'education', 'alignment', 'free'],
  '{"duration": "8 weeks", "level": "Intermediate"}'::jsonb
FROM public.summit_themes WHERE slug = 'safe-trusted-ai';

-- ============================================
-- THEME 2: Human Capital
-- ============================================

INSERT INTO public.summit_resources (slug, title, description, url, theme_id, resource_type, source, status, is_featured, featured_order, tags, metadata)
SELECT
  'india-ai-skill-gap-report-2025',
  'India AI Skill Gap Report 2025',
  'Comprehensive analysis of AI skill gaps in India''s workforce, with recommendations for education reform, industry partnerships, and government initiatives to build AI talent pipeline.',
  'https://nasscom.in/ai-skills-report-2025',
  id,
  'report',
  'NASSCOM',
  'published',
  true,
  3,
  ARRAY['skills', 'workforce', 'india', 'education'],
  '{"year": 2025, "pages": 120, "survey_size": 5000}'::jsonb
FROM public.summit_themes WHERE slug = 'human-capital';

INSERT INTO public.summit_resources (slug, title, description, url, theme_id, resource_type, source, status, is_featured, featured_order, tags, metadata)
SELECT
  'mit-intro-deep-learning-course',
  'MIT Introduction to Deep Learning',
  'World-renowned introductory course on deep learning from MIT. Covers neural networks, CNNs, RNNs, transformers, and practical applications with hands-on labs.',
  'https://introtodeeplearning.com/',
  id,
  'video',
  'MIT',
  'published',
  false,
  0,
  ARRAY['course', 'deep-learning', 'free', 'beginner'],
  '{"duration": "12 hours", "level": "Beginner", "year": 2024}'::jsonb
FROM public.summit_themes WHERE slug = 'human-capital';

INSERT INTO public.summit_resources (slug, title, description, url, theme_id, resource_type, source, status, is_featured, featured_order, tags, metadata)
SELECT
  'google-ai-essentials-certification',
  'Google AI Essentials Certification',
  'Professional certification program covering AI fundamentals, prompt engineering, and responsible AI practices. Designed for professionals transitioning into AI roles.',
  'https://grow.google/ai-essentials/',
  id,
  'tool',
  'Google',
  'published',
  false,
  0,
  ARRAY['certification', 'professional', 'google', 'beginner'],
  '{"duration": "10 hours", "cost": "Free", "certificate": true}'::jsonb
FROM public.summit_themes WHERE slug = 'human-capital';

INSERT INTO public.summit_resources (slug, title, description, url, theme_id, resource_type, source, status, is_featured, featured_order, tags, metadata)
SELECT
  'future-of-jobs-report-wef-2025',
  'Future of Jobs Report 2025',
  'World Economic Forum''s analysis of how AI and automation are reshaping the global job market, with insights on emerging roles and skills needed for the AI economy.',
  'https://www.weforum.org/publications/the-future-of-jobs-report-2025',
  id,
  'report',
  'World Economic Forum',
  'published',
  false,
  0,
  ARRAY['jobs', 'future-of-work', 'automation', 'global'],
  '{"year": 2025, "countries": 45, "employers_surveyed": 800}'::jsonb
FROM public.summit_themes WHERE slug = 'human-capital';

-- ============================================
-- THEME 3: Science
-- ============================================

INSERT INTO public.summit_resources (slug, title, description, url, theme_id, resource_type, source, status, is_featured, featured_order, tags, metadata)
SELECT
  'attention-is-all-you-need',
  'Attention Is All You Need',
  'The landmark paper that introduced the Transformer architecture, revolutionizing natural language processing and laying the foundation for GPT, BERT, and modern LLMs.',
  'https://arxiv.org/abs/1706.03762',
  id,
  'paper',
  'Google Research',
  'published',
  true,
  4,
  ARRAY['transformer', 'nlp', 'deep-learning', 'landmark'],
  '{"year": 2017, "citations": 100000}'::jsonb
FROM public.summit_themes WHERE slug = 'science';

INSERT INTO public.summit_resources (slug, title, description, url, theme_id, resource_type, source, status, is_featured, featured_order, tags, metadata)
SELECT
  'alphafold-protein-structure-database',
  'AlphaFold Protein Structure Database',
  'DeepMind''s revolutionary AI system for protein structure prediction. Access to 200+ million protein structures, transforming biological research and drug discovery.',
  'https://alphafold.ebi.ac.uk/',
  id,
  'dataset',
  'DeepMind / EMBL-EBI',
  'published',
  true,
  5,
  ARRAY['biology', 'proteins', 'drug-discovery', 'breakthrough'],
  '{"proteins": 200000000, "accuracy": "atomic-level", "year": 2022}'::jsonb
FROM public.summit_themes WHERE slug = 'science';

INSERT INTO public.summit_resources (slug, title, description, url, theme_id, resource_type, source, status, is_featured, featured_order, tags, metadata)
SELECT
  'gpt4-technical-report',
  'GPT-4 Technical Report',
  'OpenAI''s technical report on GPT-4, detailing capabilities, limitations, and safety measures of the multimodal large language model.',
  'https://arxiv.org/abs/2303.08774',
  id,
  'paper',
  'OpenAI',
  'published',
  false,
  0,
  ARRAY['llm', 'gpt', 'multimodal', 'openai'],
  '{"year": 2023, "modalities": ["text", "image"]}'::jsonb
FROM public.summit_themes WHERE slug = 'science';

INSERT INTO public.summit_resources (slug, title, description, url, theme_id, resource_type, source, status, is_featured, featured_order, tags, metadata)
SELECT
  'papers-with-code-sota',
  'Papers With Code - State of the Art',
  'Comprehensive platform tracking state-of-the-art AI research with benchmarks, datasets, and implementations. Essential resource for researchers staying current.',
  'https://paperswithcode.com/',
  id,
  'tool',
  'Papers With Code',
  'published',
  false,
  0,
  ARRAY['research', 'benchmarks', 'code', 'open-source'],
  '{"papers": 150000, "datasets": 6000, "methods": 50000}'::jsonb
FROM public.summit_themes WHERE slug = 'science';

-- ============================================
-- THEME 4: Resilience, Innovation & Efficiency
-- ============================================

INSERT INTO public.summit_resources (slug, title, description, url, theme_id, resource_type, source, status, is_featured, featured_order, tags, metadata)
SELECT
  'mckinsey-ai-enterprise-adoption',
  'The State of AI in 2025: Enterprise Adoption',
  'McKinsey''s annual survey on AI adoption in enterprises, covering ROI, implementation challenges, and success factors for AI transformation.',
  'https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai',
  id,
  'report',
  'McKinsey & Company',
  'published',
  true,
  6,
  ARRAY['enterprise', 'adoption', 'roi', 'strategy'],
  '{"year": 2025, "companies_surveyed": 1500, "industries": 12}'::jsonb
FROM public.summit_themes WHERE slug = 'resilience-innovation-efficiency';

INSERT INTO public.summit_resources (slug, title, description, url, theme_id, resource_type, source, status, is_featured, featured_order, tags, metadata)
SELECT
  'aws-generative-ai-case-studies',
  'AWS Generative AI Customer Success Stories',
  'Collection of case studies showcasing how enterprises are using generative AI on AWS to drive innovation, improve efficiency, and create new products.',
  'https://aws.amazon.com/ai/generative-ai/customers/',
  id,
  'case-study',
  'Amazon Web Services',
  'published',
  false,
  0,
  ARRAY['cloud', 'generative-ai', 'enterprise', 'aws'],
  '{"case_studies": 50}'::jsonb
FROM public.summit_themes WHERE slug = 'resilience-innovation-efficiency';

INSERT INTO public.summit_resources (slug, title, description, url, theme_id, resource_type, source, status, is_featured, featured_order, tags, metadata)
SELECT
  'langchain-framework',
  'LangChain: Building LLM Applications',
  'Popular open-source framework for building applications with large language models. Includes chains, agents, memory, and integrations with various LLM providers.',
  'https://www.langchain.com/',
  id,
  'tool',
  'LangChain',
  'published',
  false,
  0,
  ARRAY['framework', 'llm', 'development', 'open-source'],
  '{"github_stars": 75000, "language": "Python/JavaScript"}'::jsonb
FROM public.summit_themes WHERE slug = 'resilience-innovation-efficiency';

INSERT INTO public.summit_resources (slug, title, description, url, theme_id, resource_type, source, status, is_featured, featured_order, tags, metadata)
SELECT
  'tcs-ai-operations-transformation',
  'TCS AI-Powered Operations Transformation',
  'Case study on how Tata Consultancy Services helped a global manufacturer achieve 40% efficiency gains through AI-powered predictive maintenance and quality control.',
  'https://www.tcs.com/insights/case-studies/ai-manufacturing',
  id,
  'case-study',
  'Tata Consultancy Services',
  'published',
  false,
  0,
  ARRAY['manufacturing', 'operations', 'india', 'efficiency'],
  '{"efficiency_gain": "40%", "industry": "Manufacturing", "region": "Global"}'::jsonb
FROM public.summit_themes WHERE slug = 'resilience-innovation-efficiency';

-- ============================================
-- THEME 5: Inclusion for Social Empowerment
-- ============================================

INSERT INTO public.summit_resources (slug, title, description, url, theme_id, resource_type, source, status, is_featured, featured_order, tags, metadata)
SELECT
  'bhashini-ai-language-platform',
  'Bhashini: India''s AI Language Platform',
  'Government of India''s initiative to break language barriers using AI. Provides translation, speech recognition, and text-to-speech for 22 scheduled Indian languages.',
  'https://bhashini.gov.in/',
  id,
  'tool',
  'Ministry of Electronics and IT, India',
  'published',
  true,
  7,
  ARRAY['languages', 'india', 'government', 'accessibility'],
  '{"languages": 22, "users": "1M+"}'::jsonb
FROM public.summit_themes WHERE slug = 'inclusion-social-empowerment';

INSERT INTO public.summit_resources (slug, title, description, url, theme_id, resource_type, source, status, is_featured, featured_order, tags, metadata)
SELECT
  'ai-for-good-un-global-summit',
  'AI for Good Global Summit Proceedings',
  'Proceedings from the UN''s AI for Good summit, showcasing AI solutions addressing Sustainable Development Goals including poverty, health, education, and climate.',
  'https://aiforgood.itu.int/',
  id,
  'report',
  'United Nations ITU',
  'published',
  false,
  0,
  ARRAY['sdgs', 'social-good', 'un', 'global'],
  '{"year": 2024, "projects": 200, "countries": 150}'::jsonb
FROM public.summit_themes WHERE slug = 'inclusion-social-empowerment';

INSERT INTO public.summit_resources (slug, title, description, url, theme_id, resource_type, source, status, is_featured, featured_order, tags, metadata)
SELECT
  'microsoft-ai-accessibility',
  'Microsoft AI for Accessibility',
  'Microsoft''s program providing AI tools and grants for projects that improve accessibility for people with disabilities, including vision, hearing, and mobility solutions.',
  'https://www.microsoft.com/en-us/ai/ai-for-accessibility',
  id,
  'tool',
  'Microsoft',
  'published',
  false,
  0,
  ARRAY['accessibility', 'disability', 'grants', 'microsoft'],
  '{"grants_awarded": 150}'::jsonb
FROM public.summit_themes WHERE slug = 'inclusion-social-empowerment';

INSERT INTO public.summit_resources (slug, title, description, url, theme_id, resource_type, source, status, is_featured, featured_order, tags, metadata)
SELECT
  'wadhwani-ai-healthcare-india',
  'Wadhwani AI: Healthcare Solutions for India',
  'Non-profit developing AI solutions for healthcare in India, including TB screening, maternal health monitoring, and newborn care for underserved communities.',
  'https://www.wadhwaniai.org/',
  id,
  'case-study',
  'Wadhwani AI',
  'published',
  false,
  0,
  ARRAY['healthcare', 'india', 'non-profit', 'underserved'],
  '{"reach": "10M+ lives"}'::jsonb
FROM public.summit_themes WHERE slug = 'inclusion-social-empowerment';

-- ============================================
-- THEME 6: Democratizing AI Resources
-- ============================================

INSERT INTO public.summit_resources (slug, title, description, url, theme_id, resource_type, source, status, is_featured, featured_order, tags, metadata)
SELECT
  'hugging-face-open-source-hub',
  'Hugging Face: The AI Community Hub',
  'The largest open-source platform for AI models, datasets, and applications. Home to 500K+ models including Llama, Mistral, and community-created resources.',
  'https://huggingface.co/',
  id,
  'tool',
  'Hugging Face',
  'published',
  true,
  8,
  ARRAY['open-source', 'models', 'community', 'hub'],
  '{"models": 500000, "datasets": 100000, "spaces": 200000}'::jsonb
FROM public.summit_themes WHERE slug = 'democratizing-ai-resources';

INSERT INTO public.summit_resources (slug, title, description, url, theme_id, resource_type, source, status, is_featured, featured_order, tags, metadata)
SELECT
  'meta-llama-3-open-weights',
  'Llama 3: Open Foundation Models',
  'Meta''s open-weight large language models available for research and commercial use. Includes 8B and 70B parameter versions with state-of-the-art performance.',
  'https://llama.meta.com/',
  id,
  'tool',
  'Meta AI',
  'published',
  true,
  9,
  ARRAY['llm', 'open-source', 'meta', 'foundation-model'],
  '{"license": "Llama 3 Community License"}'::jsonb
FROM public.summit_themes WHERE slug = 'democratizing-ai-resources';

INSERT INTO public.summit_resources (slug, title, description, url, theme_id, resource_type, source, status, is_featured, featured_order, tags, metadata)
SELECT
  'kaggle-datasets-competitions',
  'Kaggle: Data Science Community',
  'World''s largest data science community with free datasets, competitions, and learning resources. Platform for practicing ML skills and collaborating with peers.',
  'https://www.kaggle.com/',
  id,
  'dataset',
  'Google / Kaggle',
  'published',
  false,
  0,
  ARRAY['datasets', 'competitions', 'community', 'learning'],
  '{"datasets": 50000, "competitions": 1000, "users": "15M+"}'::jsonb
FROM public.summit_themes WHERE slug = 'democratizing-ai-resources';

INSERT INTO public.summit_resources (slug, title, description, url, theme_id, resource_type, source, status, is_featured, featured_order, tags, metadata)
SELECT
  'ollama-local-llm-runner',
  'Ollama: Run LLMs Locally',
  'Open-source tool for running large language models locally on your machine. Supports Llama, Mistral, Gemma, and other open models with easy setup.',
  'https://ollama.ai/',
  id,
  'tool',
  'Ollama',
  'published',
  false,
  0,
  ARRAY['local', 'privacy', 'open-source', 'llm'],
  '{"models": 50}'::jsonb
FROM public.summit_themes WHERE slug = 'democratizing-ai-resources';

-- ============================================
-- THEME 7: Economic Growth & Social Good
-- ============================================

INSERT INTO public.summit_resources (slug, title, description, url, theme_id, resource_type, source, status, is_featured, featured_order, tags, metadata)
SELECT
  'india-ai-mission-billion-dollar',
  'India AI Mission: $1.2B Investment Plan',
  'Government of India''s comprehensive AI mission with $1.2 billion investment for compute infrastructure, AI applications, and indigenous AI development.',
  'https://indiaai.gov.in/mission',
  id,
  'official-doc',
  'Government of India',
  'published',
  true,
  10,
  ARRAY['india', 'government', 'investment', 'infrastructure'],
  '{"investment": "$1.2B", "duration": "5 years"}'::jsonb
FROM public.summit_themes WHERE slug = 'economic-growth-social-good';

INSERT INTO public.summit_resources (slug, title, description, url, theme_id, resource_type, source, status, is_featured, featured_order, tags, metadata)
SELECT
  'stanford-hai-ai-index-2025',
  'Stanford HAI AI Index Report 2025',
  'Comprehensive annual report measuring AI progress across research, industry, policy, and societal impact. The definitive source for AI trends and statistics.',
  'https://aiindex.stanford.edu/',
  id,
  'report',
  'Stanford HAI',
  'published',
  true,
  11,
  ARRAY['trends', 'statistics', 'research', 'global'],
  '{"year": 2025, "chapters": 9, "datapoints": 1000}'::jsonb
FROM public.summit_themes WHERE slug = 'economic-growth-social-good';

INSERT INTO public.summit_resources (slug, title, description, url, theme_id, resource_type, source, status, is_featured, featured_order, tags, metadata)
SELECT
  'accenture-ai-economic-impact',
  'How AI Boosts Industry Profits and Innovation',
  'Accenture research on AI''s economic impact, projecting AI could add $14 trillion to the global economy by 2035 across 16 industries.',
  'https://www.accenture.com/ai-economic-impact',
  id,
  'report',
  'Accenture',
  'published',
  false,
  0,
  ARRAY['economics', 'industry', 'growth', 'forecast'],
  '{"projected_value": "$14T", "year": 2035, "industries": 16}'::jsonb
FROM public.summit_themes WHERE slug = 'economic-growth-social-good';

INSERT INTO public.summit_resources (slug, title, description, url, theme_id, resource_type, source, status, is_featured, featured_order, tags, metadata)
SELECT
  'google-ai-climate-solutions',
  'Google AI for Climate Action',
  'Google''s initiatives using AI to combat climate change, including flood forecasting, wildfire detection, sustainable aviation fuel optimization, and energy-efficient data centers.',
  'https://sustainability.google/ai/',
  id,
  'case-study',
  'Google',
  'published',
  false,
  0,
  ARRAY['climate', 'sustainability', 'environment', 'google'],
  '{"coverage": "80 countries"}'::jsonb
FROM public.summit_themes WHERE slug = 'economic-growth-social-good';

INSERT INTO public.summit_resources (slug, title, description, url, theme_id, resource_type, source, status, is_featured, featured_order, tags, metadata)
SELECT
  'infosys-ai-sustainability-report',
  'Infosys AI for Sustainable Business',
  'Case study on how Infosys leverages AI for sustainability goals, achieving carbon neutrality and helping clients reduce environmental footprint through intelligent automation.',
  'https://www.infosys.com/sustainability/',
  id,
  'case-study',
  'Infosys',
  'published',
  false,
  0,
  ARRAY['sustainability', 'india', 'enterprise', 'carbon-neutral'],
  '{"carbon_status": "Carbon Neutral since 2020", "clients_helped": 500}'::jsonb
FROM public.summit_themes WHERE slug = 'economic-growth-social-good';

-- ============================================
-- Update resource counts for each theme
-- ============================================

UPDATE public.summit_themes SET resource_count = (
  SELECT COUNT(*) FROM public.summit_resources
  WHERE theme_id = summit_themes.id AND status = 'published'
);

-- Verify the insert
DO $$
DECLARE
  resource_count INTEGER;
  theme_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO resource_count FROM public.summit_resources;
  SELECT COUNT(*) INTO theme_count FROM public.summit_themes;
  RAISE NOTICE 'Summit seed complete: % resources across % themes', resource_count, theme_count;
END $$;
