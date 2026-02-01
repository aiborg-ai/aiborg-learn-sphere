-- Additional AI-First Companies Seed Data
-- Companies built with AI as their core product/service

INSERT INTO knowledgebase_entries (
  title, slug, excerpt, content, topic_type, status, is_featured, featured_order, tags, metadata
) VALUES

-- AI Coding & Development
(
  'Cursor',
  'cursor-ai',
  'An AI-first code editor built on VS Code, featuring AI-powered code completion, chat, and code generation that understands your entire codebase.',
  '## About Cursor

Cursor is an AI-first code editor that reimagines software development with AI at its core. Built on VS Code, it provides seamless AI integration for coding tasks.

## Key Features

### AI Code Completion
- Context-aware suggestions from your entire codebase
- Multi-line completions that understand your coding patterns
- Tab to accept, natural flow integration

### AI Chat
- Ask questions about your codebase
- Get explanations of complex code
- Debug issues with AI assistance

### Composer
- Generate entire features from natural language
- Multi-file edits in one command
- Understands project structure

## Use Cases

- **Rapid Prototyping**: Build features 10x faster
- **Code Review**: AI-assisted code improvements
- **Learning**: Understand unfamiliar codebases
- **Debugging**: Quickly identify and fix issues

## Pricing

- Free tier with limited completions
- Pro tier for unlimited AI features
- Business tier for teams',
  'companies',
  'published',
  false,
  0,
  ARRAY['code editor', 'AI coding', 'developer tools', 'VS Code'],
  '{"founded_year": 2022, "headquarters": "San Francisco, CA", "website": "https://cursor.com", "employees": "50+", "funding": "$60M+", "category": "AI Coding", "use_case": "AI-powered code editor for developers"}'::jsonb
),

(
  'Replit',
  'replit',
  'A collaborative browser-based IDE with AI features including Ghostwriter for code completion and generation, making coding accessible to everyone.',
  '## About Replit

Replit is a browser-based IDE that makes software development accessible to everyone. With AI-powered features, users can code, collaborate, and deploy from anywhere.

## Key Features

### Ghostwriter AI
- Real-time code suggestions
- Code generation from prompts
- Explain code functionality
- Transform and refactor code

### Collaborative Development
- Real-time multiplayer coding
- Share and fork projects instantly
- Built-in deployment

### AI Agent
- Build applications by describing them
- Automatic debugging and fixes
- Full-stack application generation

## Use Cases

- **Education**: Learn to code with AI assistance
- **Prototyping**: Quickly build and deploy ideas
- **Collaboration**: Team coding in real-time
- **Hackathons**: Rapid development environment

## Impact

Over 25 million developers use Replit, making it one of the largest coding communities.',
  'companies',
  'published',
  false,
  0,
  ARRAY['IDE', 'collaborative coding', 'AI coding', 'education'],
  '{"founded_year": 2016, "headquarters": "San Francisco, CA", "website": "https://replit.com", "employees": "200+", "funding": "$200M+", "ceo": "Amjad Masad", "category": "AI Coding", "use_case": "Browser-based IDE with AI assistance"}'::jsonb
),

(
  'GitHub Copilot',
  'github-copilot',
  'AI pair programmer by GitHub and OpenAI that suggests code and entire functions in real-time, trained on billions of lines of public code.',
  '## About GitHub Copilot

GitHub Copilot is an AI pair programmer that helps developers write code faster with AI-powered suggestions. Developed by GitHub in collaboration with OpenAI.

## Key Features

### Code Suggestions
- Real-time code completions
- Whole function suggestions
- Context-aware recommendations
- Multiple language support

### Chat Interface
- Ask coding questions
- Get explanations
- Debug with AI assistance
- Generate documentation

### Enterprise Features
- Organization-wide deployment
- Usage analytics
- Policy controls
- IP indemnification

## Integration

Works with:
- Visual Studio Code
- Visual Studio
- Neovim
- JetBrains IDEs

## Impact

- 55% faster task completion
- 46% of code written by AI
- Used by millions of developers worldwide',
  'companies',
  'published',
  false,
  0,
  ARRAY['GitHub', 'code completion', 'AI pair programming', 'OpenAI'],
  '{"founded_year": 2021, "headquarters": "San Francisco, CA", "website": "https://github.com/features/copilot", "parent_company": "Microsoft/GitHub", "category": "AI Coding", "use_case": "AI pair programming assistant"}'::jsonb
),

-- AI Image Generation
(
  'Midjourney',
  'midjourney',
  'An independent AI art generator known for its distinctive artistic style and high-quality image generation from text prompts.',
  '## About Midjourney

Midjourney is an independent research lab that produces an AI program of the same name, generating images from textual descriptions. Known for its distinctive, artistic aesthetic.

## Key Features

### Image Generation
- Text-to-image creation
- Style consistency
- High resolution outputs
- Artistic interpretation

### Unique Aesthetic
- Painterly quality
- Dramatic lighting
- Rich color palettes
- Fantasy and sci-fi excellence

### Community
- Discord-based interface
- Active creator community
- Showcase galleries
- Collaborative features

## Use Cases

- **Concept Art**: Game and film visualization
- **Marketing**: Unique visual content
- **Illustration**: Book and editorial art
- **Design**: Creative exploration

## Versions

Midjourney has evolved through multiple versions, with each improving quality, coherence, and capabilities.',
  'companies',
  'published',
  true,
  5,
  ARRAY['image generation', 'AI art', 'text-to-image', 'creative AI'],
  '{"founded_year": 2021, "headquarters": "San Francisco, CA", "website": "https://midjourney.com", "founder": "David Holz", "category": "AI Image Generation", "use_case": "AI-powered artistic image generation"}'::jsonb
),

(
  'Stability AI',
  'stability-ai',
  'The company behind Stable Diffusion, an open-source AI image generation model that democratized AI art creation.',
  '## About Stability AI

Stability AI is the company behind Stable Diffusion, one of the most popular open-source AI image generation models. They champion open, accessible AI.

## Key Products

### Stable Diffusion
- Open-source image generation
- Runs locally on consumer hardware
- Highly customizable
- Active community of fine-tuned models

### Stable Video
- Text-to-video generation
- Image-to-video animation
- Video editing capabilities

### Stable Audio
- Text-to-music generation
- Sound effect creation

## Open Source Philosophy

Unlike competitors, Stability AI releases models openly, enabling:
- Local deployment
- Custom fine-tuning
- Commercial use
- Research advancement

## Impact

Stable Diffusion has been downloaded millions of times and spawned an ecosystem of tools, interfaces, and fine-tuned models.',
  'companies',
  'published',
  false,
  0,
  ARRAY['Stable Diffusion', 'open source', 'image generation', 'generative AI'],
  '{"founded_year": 2020, "headquarters": "London, UK", "website": "https://stability.ai", "employees": "200+", "funding": "$100M+", "category": "AI Image Generation", "use_case": "Open-source AI image and media generation"}'::jsonb
),

-- AI Video Generation
(
  'Runway',
  'runway-ml',
  'A creative AI company pioneering AI video generation with tools like Gen-2 and Gen-3, enabling filmmakers to create with AI.',
  '## About Runway

Runway is an applied AI research company building the next generation of creative tools. Their video generation models are used by filmmakers, artists, and creators worldwide.

## Key Products

### Gen-3 Alpha
- State-of-the-art video generation
- Text-to-video creation
- Image-to-video animation
- Cinematic quality outputs

### Creative Suite
- Video editing with AI
- Green screen removal
- Object removal and inpainting
- Style transfer

### Motion Brush
- Selective animation
- Control movement in images
- Fine-grained editing

## Use Cases

- **Film Production**: Visual effects and previsualization
- **Advertising**: Quick video content creation
- **Social Media**: Engaging video content
- **Art**: Experimental video art

## Industry Impact

Runway has been used in Oscar-winning productions and is reshaping how video content is created.',
  'companies',
  'published',
  true,
  6,
  ARRAY['video generation', 'AI video', 'creative tools', 'filmmaking'],
  '{"founded_year": 2018, "headquarters": "New York, NY", "website": "https://runway.ml", "employees": "100+", "funding": "$230M+", "category": "AI Video Generation", "use_case": "AI-powered video generation and editing"}'::jsonb
),

(
  'Pika',
  'pika-labs',
  'An AI video generation startup creating tools that turn ideas into videos, making video creation as easy as typing a prompt.',
  '## About Pika

Pika is building the next generation of video creation tools powered by AI. Their mission is to make video creation accessible to everyone.

## Key Features

### Text-to-Video
- Generate videos from text descriptions
- Multiple aspect ratios
- Consistent character generation

### Image-to-Video
- Animate static images
- Add motion and life to photos
- Control movement direction

### Video-to-Video
- Modify existing videos
- Style transfer
- Object replacement

## Pika 1.0

The latest version features:
- Improved motion quality
- Longer video generation
- Better text understanding
- Enhanced editing capabilities

## Use Cases

- Content creation
- Social media marketing
- Storytelling
- Concept visualization',
  'companies',
  'published',
  false,
  0,
  ARRAY['video generation', 'AI video', 'text-to-video', 'startup'],
  '{"founded_year": 2023, "headquarters": "Palo Alto, CA", "website": "https://pika.art", "funding": "$55M+", "category": "AI Video Generation", "use_case": "AI video generation from text and images"}'::jsonb
),

-- AI Voice & Audio
(
  'ElevenLabs',
  'elevenlabs',
  'Leading AI voice technology company offering realistic text-to-speech, voice cloning, and dubbing services used in entertainment and enterprise.',
  '## About ElevenLabs

ElevenLabs is a voice AI company that develops natural-sounding speech synthesis and voice cloning technology. Their voices are nearly indistinguishable from human speech.

## Key Products

### Text-to-Speech
- Ultra-realistic voices
- 29+ languages supported
- Emotional expression control
- Multiple voice styles

### Voice Cloning
- Clone any voice with minutes of audio
- Professional voice actor replicas
- Custom voice creation

### Dubbing
- Automatic video dubbing
- Preserve original voice characteristics
- Multi-language support

### Voice Library
- Thousands of pre-made voices
- Community voice sharing
- Licensed celebrity voices

## Use Cases

- **Audiobooks**: Publishers use ElevenLabs for narration
- **Gaming**: Character voices and dialogue
- **Content Creation**: YouTube, podcasts, social media
- **Accessibility**: Text-to-speech for visually impaired

## Ethics

ElevenLabs has implemented safeguards against misuse and voice cloning without consent.',
  'companies',
  'published',
  true,
  7,
  ARRAY['text-to-speech', 'voice cloning', 'AI audio', 'dubbing'],
  '{"founded_year": 2022, "headquarters": "New York, NY", "website": "https://elevenlabs.io", "employees": "100+", "funding": "$100M+", "category": "AI Voice & Audio", "use_case": "AI voice synthesis and cloning"}'::jsonb
),

(
  'Descript',
  'descript',
  'An AI-powered audio and video editor where editing media is as easy as editing a document, featuring Overdub voice synthesis.',
  '## About Descript

Descript is revolutionizing media editing by making it as simple as editing a text document. Their AI features automate tedious editing tasks.

## Key Features

### Transcript-Based Editing
- Edit audio/video by editing text
- Delete words to remove from media
- Rearrange content by moving text

### Overdub
- AI voice cloning
- Fix mistakes by typing corrections
- Generate new audio in your voice

### Studio Sound
- One-click audio enhancement
- Remove background noise
- Professional sound quality

### AI Features
- Filler word removal
- Eye contact correction
- Green screen replacement
- Automatic transcription

## Use Cases

- **Podcasting**: Easy episode editing
- **Video Production**: Quick content creation
- **Corporate Training**: Professional videos at scale
- **Social Media**: Clip creation and repurposing

## Integration

Works with Premiere Pro, Final Cut, and other professional tools.',
  'companies',
  'published',
  false,
  0,
  ARRAY['video editing', 'audio editing', 'transcription', 'podcasting'],
  '{"founded_year": 2017, "headquarters": "San Francisco, CA", "website": "https://descript.com", "employees": "200+", "funding": "$100M+", "category": "AI Audio & Video Editing", "use_case": "AI-powered media editing"}'::jsonb
),

-- AI Search & Knowledge
(
  'Perplexity AI',
  'perplexity-ai',
  'An AI-powered answer engine that provides direct answers with citations, combining the best of search engines and AI assistants.',
  '## About Perplexity AI

Perplexity is an AI-powered answer engine that delivers accurate, up-to-date information with sources. It combines web search with AI understanding.

## Key Features

### Answer Engine
- Direct answers to questions
- Citations and sources
- Real-time web search
- Conversational follow-ups

### Pro Search
- Multi-step reasoning
- Deeper research
- Academic sources
- Complex question handling

### Collections
- Organize research
- Collaborative spaces
- Knowledge management

### Focus Modes
- Academic papers
- YouTube videos
- Reddit discussions
- News articles

## Use Cases

- **Research**: Academic and professional research
- **Fact-Checking**: Verify information with sources
- **Learning**: Explore topics in depth
- **Decision Making**: Gather comprehensive information

## Differentiators

Unlike ChatGPT, Perplexity always cites sources and searches the web in real-time.',
  'companies',
  'published',
  true,
  8,
  ARRAY['AI search', 'answer engine', 'research', 'knowledge'],
  '{"founded_year": 2022, "headquarters": "San Francisco, CA", "website": "https://perplexity.ai", "employees": "50+", "funding": "$165M+", "ceo": "Aravind Srinivas", "category": "AI Search", "use_case": "AI-powered answer engine with citations"}'::jsonb
),

-- AI Agents & Automation
(
  'Cognition (Devin)',
  'cognition-devin',
  'Creator of Devin, the first AI software engineer capable of autonomously completing complex engineering tasks.',
  '## About Cognition

Cognition is building AI teammates that can reason and collaborate on complex tasks. Their first product, Devin, is an AI software engineer.

## Devin - AI Software Engineer

### Capabilities
- Learns unfamiliar technologies
- Builds and deploys applications
- Debugs and fixes issues
- Plans multi-step tasks

### Autonomy
- Works independently on tasks
- Uses its own development environment
- Makes decisions and course-corrects
- Reports progress and asks clarifying questions

### Real-World Performance
- Passed engineering interviews at leading AI companies
- Completed real tasks on Upwork
- Solved bugs in open-source projects

## Use Cases

- **Development Support**: Handle routine engineering tasks
- **Prototyping**: Quickly build proof-of-concepts
- **Bug Fixing**: Automated issue resolution
- **Code Migration**: Update codebases to new frameworks

## Vision

Cognition aims to build AI teammates that can work alongside humans on complex reasoning tasks.',
  'companies',
  'published',
  true,
  9,
  ARRAY['AI agent', 'software engineer', 'automation', 'coding'],
  '{"founded_year": 2023, "headquarters": "San Francisco, CA", "website": "https://cognition-labs.com", "funding": "$200M+", "category": "AI Agents", "use_case": "Autonomous AI software engineer"}'::jsonb
),

-- AI Writing & Content
(
  'Jasper',
  'jasper-ai',
  'An AI content platform for enterprise marketing teams, helping create on-brand content at scale across all channels.',
  '## About Jasper

Jasper is an AI copilot for enterprise marketing teams. It helps create on-brand content 10x faster across all marketing channels.

## Key Features

### Brand Voice
- Train AI on your brand guidelines
- Consistent tone across content
- Style guide enforcement
- Company knowledge integration

### Marketing Workflows
- Blog posts and articles
- Social media content
- Email campaigns
- Ad copy generation

### Enterprise Features
- Team collaboration
- Approval workflows
- Analytics and insights
- SSO and security

### AI Art
- Built-in image generation
- Marketing-focused visuals
- Brand-consistent imagery

## Use Cases

- **Content Marketing**: Scale blog and article production
- **Social Media**: Generate posts for multiple platforms
- **Advertising**: Create ad variations at scale
- **Email Marketing**: Personalized email content

## Customers

Used by over 100,000 businesses including major enterprises.',
  'companies',
  'published',
  false,
  0,
  ARRAY['AI writing', 'content marketing', 'enterprise AI', 'copywriting'],
  '{"founded_year": 2021, "headquarters": "Austin, TX", "website": "https://jasper.ai", "employees": "300+", "funding": "$125M+", "category": "AI Writing", "use_case": "Enterprise AI content creation"}'::jsonb
),

(
  'Copy.ai',
  'copy-ai',
  'An AI-powered copywriting tool that helps marketers and businesses create high-converting marketing copy in seconds.',
  '## About Copy.ai

Copy.ai is an AI copywriting platform that helps businesses create marketing content quickly. From social media posts to long-form content.

## Key Features

### Copy Templates
- 90+ content templates
- Sales copy generators
- Social media posts
- Product descriptions

### Workflows
- Multi-step content creation
- Automated content pipelines
- Batch generation

### Chat Interface
- Conversational content creation
- Iterate and refine
- Context-aware suggestions

## Use Cases

- **E-commerce**: Product descriptions at scale
- **Marketing**: Ad copy and landing pages
- **Social Media**: Engaging posts and captions
- **Sales**: Email sequences and outreach

## Free Tier

Generous free plan makes it accessible for small businesses and individuals.',
  'companies',
  'published',
  false,
  0,
  ARRAY['copywriting', 'AI writing', 'marketing', 'content'],
  '{"founded_year": 2020, "headquarters": "Memphis, TN", "website": "https://copy.ai", "employees": "100+", "funding": "$14M+", "category": "AI Writing", "use_case": "AI copywriting for marketing"}'::jsonb
),

-- AI Infrastructure & MLOps
(
  'Hugging Face',
  'hugging-face',
  'The GitHub of machine learning, hosting models, datasets, and spaces for the AI community, democratizing access to AI.',
  '## About Hugging Face

Hugging Face is the collaboration platform for the machine learning community. It hosts models, datasets, and applications, making AI accessible to everyone.

## Key Products

### Model Hub
- 500,000+ models hosted
- Easy model discovery
- One-click deployment
- Version control

### Datasets
- 100,000+ datasets
- Standardized formats
- Easy loading and processing

### Spaces
- Host ML demos
- Gradio and Streamlit apps
- Free GPU access

### Transformers Library
- State-of-the-art models
- Easy-to-use API
- Multiple framework support

## Use Cases

- **Research**: Share and discover models
- **Development**: Quickly prototype with pre-trained models
- **Deployment**: Host models and applications
- **Collaboration**: Team model development

## Community

Hugging Face has become the central hub for the open-source AI community.',
  'companies',
  'published',
  true,
  10,
  ARRAY['ML platform', 'open source', 'model hub', 'datasets'],
  '{"founded_year": 2016, "headquarters": "New York, NY", "website": "https://huggingface.co", "employees": "200+", "funding": "$395M+", "ceo": "Clément Delangue", "category": "AI Infrastructure", "use_case": "ML collaboration platform and model hub"}'::jsonb
),

(
  'Weights & Biases',
  'weights-and-biases',
  'The MLOps platform for tracking experiments, versioning models, and collaborating on machine learning projects.',
  '## About Weights & Biases

Weights & Biases (W&B) provides tools for ML practitioners to track, visualize, and share their machine learning experiments.

## Key Products

### Experiments
- Track every experiment automatically
- Visualize metrics in real-time
- Compare runs easily
- Reproduce results

### Artifacts
- Version datasets and models
- Track lineage
- Share across teams

### Tables
- Log and query predictions
- Analyze model behavior
- Debug failures

### Sweeps
- Automated hyperparameter tuning
- Distributed across machines
- Bayesian optimization

### Reports
- Shareable dashboards
- Document findings
- Collaborate on analysis

## Use Cases

- **Research**: Track experiments systematically
- **Production**: Monitor model performance
- **Collaboration**: Share work across teams
- **Debugging**: Understand model failures

## Customers

Used by OpenAI, NVIDIA, Toyota, and thousands of ML teams.',
  'companies',
  'published',
  false,
  0,
  ARRAY['MLOps', 'experiment tracking', 'model versioning', 'ML tools'],
  '{"founded_year": 2017, "headquarters": "San Francisco, CA", "website": "https://wandb.ai", "employees": "200+", "funding": "$200M+", "category": "AI Infrastructure", "use_case": "ML experiment tracking and MLOps"}'::jsonb
),

-- AI Healthcare
(
  'Tempus',
  'tempus-ai',
  'An AI-driven precision medicine company using machine learning to help doctors make data-driven treatment decisions for cancer patients.',
  '## About Tempus

Tempus is a technology company advancing precision medicine through AI and data science. They help clinicians make real-time, data-driven decisions.

## Key Areas

### Oncology
- Genomic profiling
- Treatment matching
- Clinical trial identification
- Outcome prediction

### Cardiology
- Risk stratification
- Treatment optimization
- Remote monitoring

### Data Platform
- One of largest clinical datasets
- Real-world evidence
- AI-driven insights

## Technology

### Genomic Sequencing
- DNA and RNA sequencing
- Comprehensive panels
- Rapid turnaround

### AI Analysis
- Pattern recognition in patient data
- Treatment response prediction
- Drug discovery insights

## Impact

- Serves thousands of physicians
- Millions of patient records
- Partnerships with major health systems

## Mission

Tempus believes every patient should be treated individually based on their unique biology.',
  'companies',
  'published',
  false,
  0,
  ARRAY['healthcare AI', 'precision medicine', 'genomics', 'oncology'],
  '{"founded_year": 2015, "headquarters": "Chicago, IL", "website": "https://tempus.com", "employees": "2000+", "funding": "$1B+", "ceo": "Eric Lefkofsky", "category": "AI Healthcare", "use_case": "AI-powered precision medicine"}'::jsonb
),

-- AI Legal
(
  'Harvey',
  'harvey-ai',
  'An AI platform for legal professionals, helping lawyers draft documents, research cases, and analyze contracts more efficiently.',
  '## About Harvey

Harvey is building an AI assistant for legal professionals. Using advanced language models, Harvey helps lawyers work more efficiently on complex legal tasks.

## Key Features

### Legal Research
- Case law analysis
- Statute interpretation
- Precedent finding
- Legal memo drafting

### Contract Analysis
- Review and summarize contracts
- Identify key terms and risks
- Compare against standards
- Due diligence support

### Document Drafting
- Generate legal documents
- Maintain firm style
- Cite relevant authorities
- Version comparison

### Knowledge Management
- Firm knowledge base
- Precedent retrieval
- Best practice suggestions

## Use Cases

- **Litigation**: Research and brief writing
- **Transactions**: Contract review and drafting
- **Compliance**: Regulatory analysis
- **Due Diligence**: Document review at scale

## Customers

Used by elite law firms including Allen & Overy, A&O Shearman, and PwC.',
  'companies',
  'published',
  false,
  0,
  ARRAY['legal AI', 'contract analysis', 'legal research', 'law firm'],
  '{"founded_year": 2022, "headquarters": "San Francisco, CA", "website": "https://harvey.ai", "funding": "$100M+", "category": "AI Legal", "use_case": "AI assistant for legal professionals"}'::jsonb
),

-- AI Customer Service
(
  'Intercom Fin',
  'intercom-fin',
  'An AI-powered customer service agent that resolves customer issues instantly using conversational AI and company knowledge.',
  '## About Intercom Fin

Fin is Intercom''s AI agent that provides instant, accurate answers to customer questions. It combines GPT-4 level intelligence with your company''s knowledge.

## Key Features

### AI Resolution
- 50%+ issues resolved by AI
- Instant responses 24/7
- Natural conversations
- Escalation to humans when needed

### Knowledge Integration
- Learns from help center
- Ingests internal docs
- Keeps answers up-to-date
- No training required

### Omnichannel
- Website chat
- Mobile apps
- Email
- Social media

### Analytics
- Resolution tracking
- Customer satisfaction
- Knowledge gaps identification
- Performance insights

## Use Cases

- **Support Teams**: Handle volume efficiently
- **E-commerce**: Order tracking and returns
- **SaaS**: Product questions and troubleshooting
- **Scale**: 24/7 support without staffing

## Results

Companies using Fin see 50%+ reduction in support volume handled by humans.',
  'companies',
  'published',
  false,
  0,
  ARRAY['customer service AI', 'chatbot', 'support automation', 'conversational AI'],
  '{"founded_year": 2011, "headquarters": "San Francisco, CA", "website": "https://intercom.com/fin", "parent_company": "Intercom", "category": "AI Customer Service", "use_case": "AI-powered customer support agent"}'::jsonb
),

-- AI Data & Analytics
(
  'Scale AI',
  'scale-ai',
  'A data infrastructure company providing high-quality training data for AI applications through a combination of human labelers and AI.',
  '## About Scale AI

Scale AI provides the data infrastructure for AI. They help companies build AI applications by providing high-quality labeled data and data management tools.

## Key Services

### Data Labeling
- Image annotation
- Text labeling
- Audio transcription
- Video annotation
- 3D point cloud labeling

### Data Quality
- Human-in-the-loop validation
- Quality assurance
- Consistency checks
- Edge case handling

### AI Platform
- Automated data labeling
- Active learning
- Model evaluation
- Data curation

## Industries Served

- **Autonomous Vehicles**: Sensor data labeling
- **E-commerce**: Product categorization
- **Healthcare**: Medical image annotation
- **Government**: Defense applications

## Impact

Scale has labeled billions of data points and works with OpenAI, Meta, and government agencies.',
  'companies',
  'published',
  false,
  0,
  ARRAY['data labeling', 'training data', 'AI infrastructure', 'MLOps'],
  '{"founded_year": 2016, "headquarters": "San Francisco, CA", "website": "https://scale.com", "employees": "500+", "funding": "$600M+", "ceo": "Alexandr Wang", "category": "AI Data Infrastructure", "use_case": "AI training data and labeling"}'::jsonb
)

ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  content = EXCLUDED.content,
  tags = EXCLUDED.tags,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();
