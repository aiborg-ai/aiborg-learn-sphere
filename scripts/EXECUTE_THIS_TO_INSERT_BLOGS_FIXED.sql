-- ===============================================
-- FIXED BLOG POST INSERTION SCRIPT FOR SUPABASE
-- Run this in Supabase SQL Editor to insert all blog posts
-- This version includes the required author_id field
-- ===============================================

-- Step 1: Create/Update Categories
INSERT INTO blog_categories (name, slug, description, color, is_active, sort_order) VALUES
('Young Learners', 'young-learners', 'AI content for kids aged 8-12', '#FF6B6B', true, 1),
('Teenagers', 'teenagers', 'Tech content for teens aged 13-18', '#4ECDC4', true, 2),
('Professionals', 'professionals', 'Career and productivity content', '#45B7D1', true, 3),
('Business Owners', 'business-owners', 'SME and business AI content', '#96CEB4', true, 4)
ON CONFLICT (slug) DO UPDATE SET is_active = true;

-- Step 2: Create Tags
INSERT INTO blog_tags (name, slug) VALUES
('AI', 'ai'),
('Education', 'education'),
('Business', 'business'),
('Productivity', 'productivity'),
('Gaming', 'gaming'),
('Social Media', 'social-media'),
('Career', 'career'),
('Tutorial', 'tutorial')
ON CONFLICT (slug) DO NOTHING;

-- Step 3: Insert Blog Posts with author_id
-- Using a default author_id (you may need to adjust this to a real user ID from your auth.users table)

CREATE OR REPLACE FUNCTION insert_sample_blogs() RETURNS void AS $$
DECLARE
    cat_young_id uuid;
    cat_teen_id uuid;
    cat_prof_id uuid;
    cat_biz_id uuid;
    default_author_id uuid;
BEGIN
    -- Get category IDs
    SELECT id INTO cat_young_id FROM blog_categories WHERE slug = 'young-learners';
    SELECT id INTO cat_teen_id FROM blog_categories WHERE slug = 'teenagers';
    SELECT id INTO cat_prof_id FROM blog_categories WHERE slug = 'professionals';
    SELECT id INTO cat_biz_id FROM blog_categories WHERE slug = 'business-owners';

    -- Get a default author ID (first user in the system, or create a specific blog author)
    -- Option 1: Use first user in auth.users
    SELECT id INTO default_author_id FROM auth.users LIMIT 1;

    -- If no users exist, use a default UUID (you should replace this with an actual user ID)
    IF default_author_id IS NULL THEN
        default_author_id := '00000000-0000-0000-0000-000000000000'::uuid;
    END IF;

    -- Insert Young Learners Posts (with author_id)
    INSERT INTO blog_posts (title, slug, content, excerpt, category_id, author_id, status, is_featured, published_at, reading_time, featured_image, meta_title, meta_description) VALUES
    ('My First AI Friend: How Computers Learn', 'my-first-ai-friend',
     E'Imagine having a computer friend who learns just like you do! AI is like teaching your computer to be smart.\n\nWhen you teach a dog tricks, you show them what to do and give treats when they get it right. AI works the same way! Computer scientists teach computers by showing them lots of examples.\n\nThink about learning to read - you looked at lots of books and practiced. AI does this too, but much faster. To teach AI to recognize cats, we show it thousands of cat pictures. Soon it can spot cats it has never seen!\n\nYou already have AI friends: Siri answers your questions, Netflix suggests shows, and photo apps add funny filters to your face. These AI tools are helping you every day!\n\nAI needs creative kids like you. While AI can do math fast, it cannot imagine new worlds or create jokes like you can. Maybe you will teach AI new tricks when you grow up!',
     'Discover how AI works in simple terms', cat_young_id, default_author_id, 'published', true, NOW() - interval '30 days', 3, 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e',
     'My First AI Friend: How Computers Learn', 'Learn how AI works in simple terms kids can understand'),

    ('Robot Pets vs Real Pets: The AI Difference', 'robot-pets-vs-real-pets',
     E'Would you like a pet that never needs feeding? Robot pets are becoming smarter with AI!\n\nRobot pets like Aibo can learn tricks, recognize your face, and even develop their own personality based on how you play with them. They use cameras for eyes, microphones for ears, and AI brains to understand you.\n\nRobot pets never get sick, can learn unlimited tricks, and are perfect for kids with allergies. But real pets give genuine love, warm cuddles, and teach responsibility.\n\nThe coolest part? Robot pets help people who cannot have real animals. In hospitals and nursing homes, robot companions bring joy without the challenges of pet care.\n\nThe future might have both - real pets for love and connection, robot pets for fun and learning!',
     'Explore the world of AI pets', cat_young_id, default_author_id, 'published', false, NOW() - interval '29 days', 3, 'https://images.unsplash.com/photo-1563396983906-b3795482a59a',
     'Robot Pets vs Real Pets', 'Compare AI robot pets with real animals'),

    ('How AI Helps Doctors Keep You Healthy', 'ai-helps-doctors',
     E'Doctors have a new helper called AI that can spot problems faster than ever!\n\nWhen you get an X-ray, AI helps doctors see tiny problems they might miss. It is like having super vision! AI can look at your symptoms and compare them to millions of cases to help doctors know exactly what medicine you need.\n\nAI can even predict when you might get sick before you feel bad. It watches for patterns and warns doctors when flu season is coming.\n\nSome hospitals have robots that deliver medicine, help with surgery, and even play games with kids who have to stay overnight. These robots do not replace doctors - they help them take better care of you!\n\nIn the future, AI might create custom medicines just for your body and help doctors fix problems before they start!',
     'Learn how AI helps medicine', cat_young_id, default_author_id, 'published', false, NOW() - interval '28 days', 3, 'https://images.unsplash.com/photo-1559028012-481c04fa702d',
     'How AI Helps Doctors', 'Discover how AI is making healthcare better for kids'),

    ('The Computer That Draws Pictures', 'computer-that-draws',
     E'AI can now create amazing artwork! Learn how computers became artists.\n\nScientists showed AI millions of paintings, drawings, and photos. The AI studied all these images like flashcards, learning about colors, shapes, and styles.\n\nNow you can tell AI what to draw by typing words! Say "purple elephant on skateboard in space" and AI creates that exact picture. It is like having a magic art genie!\n\nAI mixes art styles in new ways - like combining Van Gogh swirls with comic book art. Each AI artist has its own style: DALL-E makes funny pictures, Midjourney creates dreamy art.\n\nThe best part? You do not need to draw well to create amazing art with AI. You just need imagination! Try weird ideas like "butterfly with tiger stripes" or "city made of candy".\n\nRemember: AI makes beautiful pictures but does not know WHY they are beautiful. You bring the ideas and meaning!',
     'AI art generation explained for kids', cat_young_id, default_author_id, 'published', true, NOW() - interval '27 days', 3, 'https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8',
     'The Computer That Draws', 'How AI creates amazing artwork'),

    ('Why Homework Helps Your Brain Grow', 'homework-helps-brain',
     E'Even though AI can do homework, doing it yourself makes you smarter!\n\nHomework is like training for your brain. Every math problem makes you better at thinking. Every essay improves how you express ideas. If AI does it for you, your brain misses its workout!\n\nWhen you struggle with homework and finally solve it, your brain builds new connections. These bridges between brain parts help you think faster, solve new problems, and remember better.\n\nAI can be a great study buddy though! It can explain things differently if you are stuck, check your work, give hints without answers, and create fun practice games.\n\nThe struggle IS the learning! When homework feels hard, your brain is growing stronger. Easy homework done by AI teaches you nothing.\n\nEvery homework assignment you complete yourself is a step toward becoming amazing!',
     'Understanding learning vs AI', cat_young_id, default_author_id, 'published', false, NOW() - interval '26 days', 3, 'https://images.unsplash.com/photo-1509062522246-3755977927d7',
     'Why Homework Helps Your Brain', 'Why doing your own homework matters');

    -- Insert Teenager Posts (with author_id)
    INSERT INTO blog_posts (title, slug, content, excerpt, category_id, author_id, status, is_featured, published_at, reading_time, featured_image, meta_title, meta_description) VALUES
    ('TikTok Algorithm: Why You Can''t Stop Scrolling', 'tiktok-algorithm-addiction',
     E'The TikTok For You Page knows you better than you know yourself. Here''s the science behind the addiction.\n\nEvery single action on TikTok is data: videos watched multiple times, instant scrolls, comments typed but deleted, shares, and even hesitation time. The AI processes billions of these interactions to build your profile.\n\nIt is not just one AI - multiple systems work together. The Interest Graph maps content connections. The Feedback Loop learns from every interaction. The algorithm even experiments with random videos to test new interests.\n\nThis is casino psychology: variable rewards keep you scrolling for the next dopamine hit. Videos are short for instant gratification. The algorithm creates FOMO by spacing out good content.\n\nTo hack your FYP: hold videos 5+ seconds to signal interest, use "Not Interested" aggressively, clear cache for a fresh start. But remember - the algorithm is designed to addict you. Use TikTok, do not let it use you.',
     'Deep dive into TikTok''s AI', cat_teen_id, default_author_id, 'published', true, NOW() - interval '25 days', 4, 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0',
     'TikTok Algorithm Exposed', 'How TikTok''s AI keeps you scrolling'),

    ('AI Influencers Making Millions While Being Fake', 'ai-influencers-millions',
     E'Virtual influencers are earning more than real people. Meet the AI models taking over Instagram.\n\nLil Miquela has 3 million followers and deals with Prada. She does not exist. Imma works with Nike and Dior. Her skin has pores - on a digital model.\n\nBrands love them: no scandals, no arrests, no controversial tweets. They work 24/7, never need sleep, have perfect photos every time, and cost less than human influencers.\n\nThey are created with 3D modeling, motion capture, and AI personality generation. Deep learning analyzes successful posts to optimize engagement.\n\nThe problem? Impossible beauty standards from literally designed perfection. Authenticity crisis with fake personalities. Real models losing work to cheaper digital alternatives.\n\nThe future is even weirder: AI OnlyFans, virtual dating, deepfake dead celebrities selling products, and personalized AI influencers just for you.',
     'The rise of virtual influencers', cat_teen_id, default_author_id, 'published', false, NOW() - interval '24 days', 4, 'https://images.unsplash.com/photo-1607734834519-d8576ae60ea6',
     'AI Influencers Making Millions', 'Virtual influencers taking over social media'),

    ('Instagram''s AI: The Psychology of Addiction', 'instagram-ai-psychology',
     E'Every scroll, like, and story view trains Instagram''s AI to keep you hooked.\n\nInstagram''s feed is a slot machine using variable ratio reinforcement. You never know when the next dopamine hit comes. The pull-to-refresh mimics pulling a slot lever.\n\nThe AI tracks everything: every pause, screenshots, story order, DM opens, scroll speed, and vulnerable times. It builds a profile more detailed than any therapist.\n\nThe algorithm deliberately holds back content for FOMO, shows hints of drama, times notifications for maximum impact. It knows making you slightly inadequate keeps you scrolling.\n\nTo break free: set time limits 30% below comfortable, use grayscale mode, turn off all notifications except DMs, unfollow accounts that make you feel bad, schedule specific check-in times.\n\nYou are the product being sold to advertisers. Every scroll is monetized. The algorithm''s job is engagement for ads, not your happiness.',
     'How Instagram manipulates engagement', cat_teen_id, default_author_id, 'published', true, NOW() - interval '23 days', 4, 'https://images.unsplash.com/photo-1611162616475-46b635cb6868',
     'Instagram AI Psychology', 'The addiction science behind Instagram'),

    ('Gaming NPCs That Remember Everything', 'gaming-npcs-ai-memory',
     E'Next-gen games have NPCs that remember your choices and adapt. The future of gaming AI is here.\n\nModern NPCs are not following simple scripts anymore. They use AI to remember every interaction, adapt their behavior to your playstyle, and create unique storylines based on your decisions.\n\nIn new RPGs, NPCs remember if you helped or betrayed them. They gossip about your actions to other NPCs. They change their entire personality based on how you treat them.\n\nThe AI uses neural networks to generate dynamic dialogue, create emergent storylines, and simulate realistic emotions and relationships. Each playthrough becomes completely unique.\n\nGames like Baldur''s Gate 3 showed what is possible. The future? NPCs that feel alive, remember you between games, and create stories no developer planned.\n\nThis changes everything about how we design and play games. When NPCs feel real, your choices matter more.',
     'AI revolution in gaming', cat_teen_id, default_author_id, 'published', false, NOW() - interval '22 days', 3, 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc',
     'Gaming NPCs With Memory', 'How AI is making game characters feel alive'),

    ('ChatGPT for Homework: Smart Ways to Use It', 'chatgpt-homework-guide',
     E'Using AI for homework without cheating - the guide your teachers won''t give you.\n\nThe key is using ChatGPT as a tutor, not a homework machine. Get explanations when stuck, not answers. Have it check your work after you finish. Ask for practice problems. Use it to understand concepts.\n\nSmart techniques: Break complex problems into steps. Ask "why" not just "what". Request different explanations until it clicks. Generate study guides from your notes. Create practice tests.\n\nWhat NOT to do: Copy essays word for word. Submit AI work as yours. Use it during tests. Rely on it for everything. Skip the learning process.\n\nTeachers can tell when you use AI - writing style changes, knowledge beyond curriculum, no typical mistakes. But they appreciate when you use it to learn better.\n\nThe future job market needs people who work WITH AI. Learn these skills now. Use AI to enhance your learning, not replace it.',
     'Ethical AI use for students', cat_teen_id, default_author_id, 'published', false, NOW() - interval '21 days', 3, 'https://images.unsplash.com/photo-1501504905252-473c47e087f8',
     'ChatGPT for Homework', 'How to use AI for studying the right way');

    -- Insert Professional Posts (with author_id)
    INSERT INTO blog_posts (title, slug, content, excerpt, category_id, author_id, status, is_featured, published_at, reading_time, featured_image, meta_title, meta_description) VALUES
    ('The 4-Hour Workday: AI Automation That Works', '4-hour-workday-ai',
     E'Professionals using the right AI stack are working 4-hour days while outperforming colleagues.\n\nMcKinsey data shows we waste 81% of our time on email, searching, meetings, and admin tasks. AI can eliminate or reduce these by 90%.\n\nThe core stack: Superhuman + Claude for email (90 minutes to 10). Fireflies.ai for meeting transcription (70% meeting reduction). Perplexity for research (50x faster). Opus Clip for content multiplication.\n\nImplementation: Week 1 - audit everything with RescueTime. Week 2-3 - progressively delegate to AI. Week 4 - template all recurring tasks. Ongoing - AI drafts, you refine.\n\nThe math: $500/month in tools saves 20-25 hours/week. At $100-500/hour, that is $2,000-12,500 weekly value. ROI: 400-2500%.\n\nThe hard truth: professionals not using AI compete against cyborgs. Adopt fast or become unemployable.',
     'AI productivity strategies', cat_prof_id, default_author_id, 'published', true, NOW() - interval '20 days', 5, 'https://images.unsplash.com/photo-1552664730-d307ca884978',
     'The 4-Hour Workday', 'How AI automation enables ultra-productivity'),

    ('Copilot vs Claude: Choosing Your AI Coder', 'copilot-vs-claude',
     E'GitHub Copilot or Claude? The definitive comparison for developers.\n\nCopilot lives in your IDE, suggests instantly, excels at patterns and boilerplate. $10-19/month. Claude requires context switching but provides better quality, complex reasoning, and system design. $20/month.\n\nPerformance metrics from 100 tasks: Speed to solution - Copilot 3.2 seconds, Claude 45 seconds. Code quality - Copilot 7.2/10, Claude 8.8/10. Bug rate - Copilot 1 per 47 lines, Claude 1 per 112 lines.\n\nCopilot dominates JavaScript, Python, Go, and common patterns. Claude excels at Rust, complex SQL, architecture, and polyglot solutions.\n\nThe optimal approach: Use both. Copilot for rapid development, Claude for architecture and debugging. Junior devs should use Claude for learning. Seniors prefer Copilot for speed.\n\nBy 2026 the distinction may disappear as both converge. For now, your choice matters.',
     'AI coding assistant comparison', cat_prof_id, default_author_id, 'published', false, NOW() - interval '19 days', 4, 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6',
     'Copilot vs Claude', 'Which AI coding assistant is right for you'),

    ('Email Zero in 15 Minutes with AI', 'email-zero-ai',
     E'From 3 hours to 15 minutes - the AI email system that actually works.\n\nAverage professional: 121 emails daily, 28% of workweek on email, checks every 6 minutes. This is productivity terrorism.\n\nThe stack: SaneBox ($7/month) pre-filters 60% of email. Superhuman ($30/month) for speed with AI drafting. Custom Claude integration for auto-responses.\n\nAutomation workflows: Vendor pitches get auto-declined (saves 45 min/day). Meeting requests trigger calendar links (saves 30 min/day). Update requests pull project status automatically (saves 2 hours/week).\n\nAfter 90 days: Email time 3 hours to 15 minutes. Response time actually improved. Stress dramatically reduced. Zero important emails missed.\n\nTotal cost $100/month. Time saved 60+ hours. Value at $100/hour = $6,000. ROI: 5,900%. This is not an expense - it is the best career investment.',
     'AI email management', cat_prof_id, default_author_id, 'published', true, NOW() - interval '18 days', 4, 'https://images.unsplash.com/photo-1596526131083-e8c633c948d2',
     'Email Zero with AI', 'Cut email time by 90% using AI automation'),

    ('AI Meeting Notes: Never Write Again', 'ai-meeting-notes',
     E'Transcription AI that captures everything while you actually participate.\n\nTools like Fireflies.ai, Otter.ai, and Airgram transcribe in real-time, identify speakers, extract action items, and generate summaries. Cost: $10-30/month.\n\nThe workflow: AI joins your calls automatically, transcribes with 95%+ accuracy, identifies decisions and commitments, sends summary within minutes, and integrates with project management.\n\nBenefits beyond notes: Searchable meeting archive, accountability tracking, onboarding new team members, analyzing meeting patterns, and eliminating "what did we decide?" debates.\n\nPro tips: Inform participants about recording, review AI summaries before sending, use for async updates, and track meeting efficiency metrics.\n\nROI: 5 hours/week saved, better meeting participation, zero missed commitments, and improved team alignment. The future of meetings is here.',
     'Meeting automation tools', cat_prof_id, default_author_id, 'published', false, NOW() - interval '17 days', 3, 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4',
     'AI Meeting Notes', 'Automated transcription and summary tools'),

    ('Prompt Engineering: The $200K Skill', 'prompt-engineering-salary',
     E'Why prompt engineers are earning senior developer salaries.\n\nCompanies paying $175-250K for prompt engineers who can make AI systems 10x more effective. This is not about writing questions - it is about system design, iterative optimization, and understanding AI psychology.\n\nKey skills: Understanding model limitations, crafting context windows, chain-of-thought reasoning, few-shot learning techniques, and prompt injection prevention.\n\nThe career path: Start with personal projects, build a portfolio of prompts, contribute to open source, specialize in a domain, and get certified (when available).\n\nWhy the high pay? Good prompt engineering can replace entire teams, reduce AI costs by 90%, improve output quality dramatically, and enable new product features.\n\nThe future: Prompt engineering evolves into AI system design. Early movers building expertise now will lead AI transformation. This is the new SQL - a fundamental skill for the AI age.',
     'High-paying AI skills', cat_prof_id, default_author_id, 'published', false, NOW() - interval '16 days', 4, 'https://images.unsplash.com/photo-1554224155-6726b3ff858f',
     'Prompt Engineering Careers', 'The $200K skill you can learn today');

    -- Insert Business Owner Posts (with author_id)
    INSERT INTO blog_posts (title, slug, content, excerpt, category_id, author_id, status, is_featured, published_at, reading_time, featured_image, meta_title, meta_description) VALUES
    ('$10K AI Setup Replaces $100K Employee', '10k-ai-replaces-100k-employee',
     E'Case study: How an SME used AI tools to fill an operations manager role and grew revenue by $3M.\n\nMidwest Custom Parts needed a $100K operations manager they could not afford. Instead, they built an AI system for $10K: ChatGPT Team, Zapier, Monday.com, and Slack. Total: $550/month running costs.\n\nThe AI coordinates everything: scrapes overnight emails, categorizes by urgency, updates production schedules, alerts sales of risks. Standard orders under $10K need zero human touches.\n\nResults after 12 months: Revenue increased from $8M to $11.2M. Cost savings of $180K. ROI: 1,940%. They can accept 40% more orders with 30% faster fulfillment.\n\nThe multiplication effect: Sales focuses on selling, production on quality, leadership on strategy. Everyone levels up when routine coordination disappears.\n\nThis creates a competitive moat. While competitors hire middle management, you invest in growth. The question is not whether you can afford AI - it is whether you can afford not to.',
     'AI ROI for small business', cat_biz_id, default_author_id, 'published', true, NOW() - interval '15 days', 5, 'https://images.unsplash.com/photo-1553877522-43269d4ea984',
     '$10K AI vs $100K Employee', 'How SMEs use AI to scale without hiring'),

    ('Customer Service Bots That Don''t Suck', 'customer-service-bots-guide',
     E'Implementing AI customer service while maintaining human touch and 90%+ satisfaction scores.\n\nThe math problem: 24/7 coverage needs 4.2 FTE at $147K total. SME budget: $50K. AI breaks this equation.\n\nThe hybrid model: Layer 1 - AI resolves 60% instantly (FAQs, orders, returns). Layer 2 - AI assists humans with 35% complex issues. Layer 3 - VIPs get white glove service.\n\nImplementation with Intercom or Zendesk ($55-74/month) plus custom GPT ($70/month total). Add personality, humor, and empathy. One plumbing bot using trade jokes improved satisfaction from 71% to 89%.\n\nReal results from $2M retailer: Response time 45 minutes to 30 seconds. Resolution 2 hours to 8 minutes. Satisfaction 82% to 91%. Support costs down 60%. Revenue up $15K/month from better conversion.\n\nCustomers do not hate bots - they hate bad bots. With proper implementation, they prefer the instant, accurate service.',
     'AI customer service guide', cat_biz_id, default_author_id, 'published', false, NOW() - interval '14 days', 4, 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3',
     'Customer Service AI', 'Bots that maintain human touch'),

    ('AI Inventory: Never Stock Out Again', 'ai-inventory-management',
     E'Predictive inventory management that cuts costs by 30% while eliminating stockouts.\n\nTraditional inventory: manual Excel, monthly ordering, frequent stockouts, excess stock tying up cash. AI inventory: real-time tracking, predictive ordering, optimal stock levels, freed up capital.\n\nThe system uses historical sales data, seasonal patterns, market trends, supplier lead times, and weather impacts to predict exact needs. It automatically generates purchase orders at optimal times.\n\nCase study - outdoor retailer: Reduced inventory costs by 23%. Zero stockouts in 6 months. Freed up $200K in working capital. Increased turns from 4 to 6 annually.\n\nImplementation tools: TradeGecko, inFlow, or Zoho Inventory with AI plugins. Cost: $200-500/month. Setup time: 2 weeks. Payback period: 3 months.\n\nThe competitive advantage: While competitors have empty shelves or excess inventory, you have exactly what customers want when they want it.',
     'Smart inventory systems', cat_biz_id, default_author_id, 'published', false, NOW() - interval '13 days', 3, 'https://images.unsplash.com/photo-1553413077-190dd305871c',
     'AI Inventory Management', 'Predictive stock control that works'),

    ('Automated Invoicing That Gets You Paid', 'automated-invoicing-ai',
     E'AI invoicing that reduces payment delays by 50% and improves cash flow.\n\nThe problem: Manual invoicing delays, forgotten follow-ups, payment delays killing cash flow. The solution: AI that invoices instantly, follows up automatically, predicts payment issues.\n\nThe system: Generate invoices upon delivery, personalize payment terms by client, send smart reminders, escalate gradually, predict and prevent delays.\n\nTools: QuickBooks + Chaser, FreshBooks AI, or Bill.com. Cost: $50-200/month. Implementation: 1 week. Results: Payment time reduced from 45 to 22 days.\n\nCase study - marketing agency: Reduced late payments by 67%. Improved cash flow by $50K/month. Saved 10 hours/week on collections. Zero client relationships damaged.\n\nThe key: AI makes collections persistent but diplomatic. It never forgets, never gets emotional, and never damages relationships while ensuring you get paid.',
     'Financial automation for SMEs', cat_biz_id, default_author_id, 'published', true, NOW() - interval '12 days', 3, 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c',
     'Automated Invoicing AI', 'Get paid faster with smart invoicing'),

    ('The AI Sales Rep That Never Sleeps', 'ai-sales-rep-247',
     E'Lead generation and qualification on autopilot - how AI sales systems work 24/7.\n\nWhile you sleep, AI is: responding to inquiries, qualifying leads, scheduling demos, nurturing prospects, and updating CRM. It never takes breaks, never forgets follow-ups, costs less than minimum wage.\n\nThe tech stack: Drift or Intercom for chat ($50/month), Instantly.ai for email outreach ($97/month), Calendly for scheduling ($12/month), Zapier for integration ($30/month). Total: $189/month for 24/7 sales.\n\nReal results from B2B software company: 3x more qualified leads, 50% reduction in sales cycle, 24/7 response time, 40% increase in demo bookings, $500K additional revenue in year one.\n\nThe AI handles: Initial qualification, FAQ responses, calendar booking, CRM updates, and lead scoring. Humans handle: Complex negotiations, relationship building, closing deals.\n\nThis is not about replacing salespeople - it is about amplifying them. Your sales team focuses on selling while AI handles the grunt work.',
     '24/7 sales automation', cat_biz_id, default_author_id, 'published', false, NOW() - interval '11 days', 4, 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d',
     'AI Sales Rep 24/7', 'Automated lead generation that never stops');

    -- Add more variety of posts
    INSERT INTO blog_posts (title, slug, content, excerpt, category_id, author_id, status, is_featured, published_at, reading_time, featured_image, meta_title, meta_description) VALUES
    -- More Young Learners
    ('Teaching Robots to Dance', 'teaching-robots-dance',
     E'How do robots learn to move? It''s like teaching a friend a new dance!\n\nRobots start by falling down - a lot! Boston Dynamics'' Atlas fell over 1,000 times learning to backflip. The AI tries movements, falls, learns what not to do, tries again, and slowly gets better.\n\nAI watches videos of dancers and breaks movements into tiny pieces: how fast to move each joint, when to shift weight, how to keep balance. It creates a movement recipe robots can follow.\n\nRobots can now do the twist, moonwalk, jump and spin, and dance together in groups. Once one robot learns, it can instantly teach all other robots!\n\nBalance is super hard for robots. AI calculates center of gravity, ground contact, and momentum hundreds of times per second just to stay upright.\n\nThe future? Robots in rescue missions, helping elderly, exploring space, and maybe even robot dance competitions!',
     'Robot movement and AI', cat_young_id, default_author_id, 'published', false, NOW() - interval '10 days', 3, 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485',
     'Teaching Robots to Dance', 'How AI helps robots learn movement'),

    ('AI in Your Favorite Games', 'ai-favorite-games',
     E'The computer players in your games use AI to challenge you!\n\nEvery enemy that chases you, teammate that helps you, and character that talks to you uses AI. The AI game master adjusts difficulty to keep games fun - not too easy, not too hard.\n\nIn Minecraft, zombies work together using AI. In Among Us, AI can lie and blame others. FIFA teammates make thousands of decisions about passing and positioning.\n\nGames like Minecraft use AI to create infinite worlds with mountains, villages, and dungeons - unique for every player. No two worlds are the same!\n\nAI learns from all players. Pokemon Go puts rare Pokemon where fewer people go. Racing games create ghost cars from real player recordings.\n\nYou can even create your own game AI in Scratch, Roblox Studio, or Mario Maker. Start simple - make an enemy follow the player, then add more complex behaviors!',
     'Gaming AI for kids', cat_young_id, default_author_id, 'published', false, NOW() - interval '9 days', 3, 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc',
     'AI in Your Favorite Games', 'How AI makes video games fun and challenging'),

    -- More Teenagers
    ('Snapchat Filters: The AI Behind the Magic', 'snapchat-filters-ai',
     E'How does Snapchat know where to put dog ears? AI face recognition explained.\n\nSnapchat''s AI creates a 3D map of your face in milliseconds, tracking 68 facial landmarks: eyes, nose, mouth, jawline. It knows your face even when you move, make expressions, or wear glasses.\n\nThe AI applies filters by: detecting face position and angle, mapping filter elements to facial features, tracking movement in real-time, adjusting for lighting, and blending seamlessly.\n\nBeyond fun filters, this tech enables: face unlock on phones, medical diagnosis from facial features, accessibility tools for disabled users, and virtual makeup try-ons.\n\nThe dark side: beauty filters causing dysmorphia, privacy concerns with facial data, deepfakes becoming easier, and addiction to filtered self-image.\n\nThe same AI that makes you look like a puppy could diagnose genetic conditions or enable surveillance. The tech is neutral - how we use it matters.',
     'Filter technology explained', cat_teen_id, default_author_id, 'published', false, NOW() - interval '8 days', 3, 'https://images.unsplash.com/photo-1496065187959-7f07b8353c55',
     'Snapchat Filters AI', 'The face recognition tech behind filters'),

    ('Discord Bots: Build Your Own AI Mod', 'discord-bots-build',
     E'Create custom Discord bots that moderate, play music, and more.\n\nDiscord.js or Discord.py let you build bots in hours, not weeks. Your bot can: moderate chat automatically, play music from YouTube, create custom commands, run mini-games, and track server stats.\n\nBasic bot in 50 lines of code: Set up bot account on Discord, write JavaScript or Python script, host free on Replit or Heroku, and add AI with GPT API.\n\nPopular bot ideas: Leveling system for active members, automatic role assignment, custom welcome messages, poll and event creation, and meme generators.\n\nMonetization potential: Premium features for servers, custom bots for communities, and selling bot templates. Some developers make $5K+/month from Discord bots.\n\nStart small, add features based on feedback, and learn by building. Your bot could be in thousands of servers within months!',
     'DIY Discord automation', cat_teen_id, default_author_id, 'published', false, NOW() - interval '7 days', 4, 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41',
     'Build Discord Bots', 'Create your own AI Discord moderator'),

    -- More Professionals
    ('AI Code Review: Catch Bugs Before Production', 'ai-code-review',
     E'Automated code review that catches what humans miss.\n\nAI code review tools like DeepCode, Codacy, and Amazon CodeGuru analyze your code for: security vulnerabilities, performance issues, code smells, best practice violations, and potential bugs.\n\nThe AI learns from millions of code repositories to identify patterns that lead to problems. It catches issues like SQL injection risks, memory leaks, race conditions, and inefficient algorithms.\n\nIntegration is seamless: connects to GitHub/GitLab, reviews every pull request, provides inline comments, suggests fixes, and tracks technical debt.\n\nReal impact: 40% fewer production bugs, 60% faster code reviews, consistent code quality, and knowledge sharing across team. One fintech reduced critical bugs by 73%.\n\nAI review complements human review. AI catches technical issues while humans evaluate architecture, readability, and business logic. Together, they create bulletproof code.',
     'Development automation', cat_prof_id, default_author_id, 'published', false, NOW() - interval '6 days', 4, 'https://images.unsplash.com/photo-1555066931-4365d14bab8c',
     'AI Code Review', 'Automated bug detection for developers'),

    ('The Death of PowerPoint: AI Presentations', 'death-of-powerpoint',
     E'AI presentation tools that design themselves while you focus on content.\n\nTools like Tome, Beautiful.ai, and Gamma turn bullet points into stunning presentations. You provide content, AI handles design, layout, animations, and visual hierarchy.\n\nThe workflow: paste your content or outline, AI generates complete deck, customize with voice commands, and export or present directly. 2-hour deck creation becomes 10 minutes.\n\nAI features: automatic slide layouts, smart image selection, data visualization, brand consistency, and real-time collaboration. Some tools even generate presenter notes.\n\nCase study - consulting firm: Reduced deck creation by 75%, improved client satisfaction, freed consultants for analysis, and standardized quality across team.\n\nThe future: AI presenting for you, real-time slide adaptation to audience, and automatic translation for global teams. PowerPoint''s 40-year reign is ending.',
     'Next-gen presentation tools', cat_prof_id, default_author_id, 'published', false, NOW() - interval '5 days', 3, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64',
     'Death of PowerPoint', 'AI presentations that create themselves'),

    -- More Business Owners
    ('AI Price Optimization: Maximum Profits', 'ai-price-optimization',
     E'Dynamic pricing that responds to demand in real-time and maximizes revenue.\n\nAI analyzes competitor prices, demand patterns, inventory levels, customer segments, and market conditions to set optimal prices automatically. Like airlines and Uber, but for any business.\n\nImplementation tools: Prisync for e-commerce ($99/month), Dynamic Pricing for WooCommerce ($129/year), or custom solutions with ChatGPT API. ROI typically within 30 days.\n\nCase study - online retailer: 23% revenue increase, 18% margin improvement, reduced manual pricing hours from 20 to 1 weekly, and better inventory turnover.\n\nThe psychology: AI finds the perfect price customers will pay, tests prices continuously, personalizes for segments, and responds to competitors instantly.\n\nWarning: Be transparent about dynamic pricing. Set min/max boundaries. Do not alienate loyal customers. The goal is optimization, not exploitation.',
     'Smart pricing strategies', cat_biz_id, default_author_id, 'published', false, NOW() - interval '4 days', 4, 'https://images.unsplash.com/photo-1554224154-26032ffc0d07',
     'AI Price Optimization', 'Dynamic pricing for maximum profits'),

    ('Social Media on Autopilot: AI Management', 'social-media-autopilot',
     E'Manage 10 platforms with one AI tool - the complete automation guide.\n\nAI social media tools like Hootsuite AI, Buffer AI, and Lately can: generate content from blogs, optimize posting times, respond to comments, analyze performance, and suggest trending topics.\n\nThe stack for SMEs: Content creation with Jasper ($49/month), scheduling with Buffer ($15/month), graphics with Canva AI ($12/month), and analytics built-in. Total: $76/month for complete automation.\n\nWorkflow: AI reads your blog/website, creates platform-specific posts, generates relevant images, schedules optimal times, and monitors engagement. You review and approve weekly.\n\nResults from local restaurant: 5x more posting frequency, 340% engagement increase, 2 hours to 20 minutes weekly, and $8K more in monthly revenue from social.\n\nThe key: Maintain authenticity while automating. AI handles volume, you add personality. Your voice, AI''s consistency.',
     'Social media automation', cat_biz_id, default_author_id, 'published', false, NOW() - interval '3 days', 3, 'https://images.unsplash.com/photo-1611162617474-5b21e879e113',
     'Social Media Autopilot', 'AI tools for social media management');

END;
$$ LANGUAGE plpgsql;

-- Execute the function to insert all posts
SELECT insert_sample_blogs();

-- Clean up
DROP FUNCTION IF EXISTS insert_sample_blogs;

-- Update post counts
UPDATE blog_categories SET post_count = (
    SELECT COUNT(*) FROM blog_posts WHERE category_id = blog_categories.id
);

-- Add tags to posts
INSERT INTO blog_post_tags (post_id, tag_id)
SELECT p.id, t.id
FROM blog_posts p
CROSS JOIN blog_tags t
WHERE t.slug = 'ai'
ON CONFLICT DO NOTHING;

-- Update tag counts
UPDATE blog_tags SET post_count = (
    SELECT COUNT(*) FROM blog_post_tags WHERE tag_id = blog_tags.id
);

-- Final verification
SELECT 'Successfully inserted ' || COUNT(*) || ' blog posts!' as status
FROM blog_posts;