#!/usr/bin/env python3
"""
Content Generator for Blog Articles
Creates comprehensive, audience-appropriate content for each article
"""

import json
import random
from typing import Dict, List

# Content templates by audience
YOUNG_LEARNERS_TEMPLATES = {
    'intro': [
        "Have you ever wondered {question}? Today, we're going on an amazing adventure to discover {topic}!",
        "Imagine {scenario}. That's exactly what we're exploring today with {topic}!",
        "Get ready for an exciting journey into {topic}! You're about to learn something super cool.",
        "Did you know that {fact}? Let's dive into the fascinating world of {topic}!",
        "Hi there, young explorer! Today we're discovering {topic} and it's going to blow your mind!"
    ],
    'sections': [
        'What Is {topic}?',
        'How Does It Work?',
        'Why Is This Important?',
        'Cool Things You Can Do',
        'Fun Facts You Should Know',
        'Try This At Home!',
        'What\'s Next?'
    ],
    'outro': [
        "Remember, AI is a tool to help make life more fun and interesting, not to replace the amazing things that make YOU special!",
        "You're part of the first generation growing up with AI. How exciting is that?",
        "Keep exploring, keep learning, and who knows - maybe you'll be the one inventing the next big AI breakthrough!",
        "The future of AI needs creative kids like you. Stay curious!"
    ]
}

TEENAGERS_TEMPLATES = {
    'intro': [
        "Let's be real: {topic} is everywhere, and it's changing how we {activity}. Here's what you actually need to know.",
        "{statistic}. Whether you're aware of it or not, {topic} is already part of your daily life. Let's break it down.",
        "No cap, {topic} is one of the most important things for Gen Z to understand right now. Here's why.",
        "You've probably used {topic} today without even realizing it. Let's dive deep into what's really going on.",
        "Forget what you think you know about {topic}. The reality is way more interesting (and useful) than you might think."
    ],
    'sections': [
        'The Real Deal: What Is {topic}?',
        'Why You Should Actually Care',
        'How It Affects Your Life',
        'Practical Ways to Use This',
        'The Pros and Cons',
        'Common Myths Debunked',
        'What This Means for Your Future',
        'How to Get Started'
    ],
    'outro': [
        "Bottom line: understanding {topic} isn't just nice to have - it's essential for navigating the digital world you're growing up in.",
        "The future belongs to people who understand and can work with AI. Might as well get ahead of the curve.",
        "Don't just be a passive consumer of AI - learn to use it, understand it, and maybe even help build it.",
        "Knowledge is power, especially when it comes to technology that's literally shaping your generation's future."
    ]
}

PROFESSIONALS_TEMPLATES = {
    'intro': [
        "In today's rapidly evolving workplace, {topic} has emerged as a critical capability for professionals seeking to maintain competitive advantage.",
        "{statistic} according to recent industry research. Understanding {topic} is no longer optional - it's a professional imperative.",
        "The integration of {topic} into professional workflows represents a paradigm shift in how we approach {area}.",
        "As organizations accelerate digital transformation, {topic} has become a cornerstone of operational efficiency and strategic advantage.",
        "Professionals who master {topic} are seeing measurable improvements in productivity, decision-making, and career trajectory."
    ],
    'sections': [
        'Executive Summary',
        'The Business Case for {topic}',
        'Implementation Framework',
        'Key Benefits and ROI',
        'Common Challenges and Solutions',
        'Best Practices from Industry Leaders',
        'Tools and Technologies',
        'Measuring Success',
        'Future Trends and Predictions',
        'Action Steps for Implementation'
    ],
    'outro': [
        "The professionals who thrive in the AI era will be those who continuously adapt, learn, and leverage these tools strategically.",
        "Investing time in understanding and implementing {topic} today will yield significant dividends in your career tomorrow.",
        "The question isn't whether to adopt {topic}, but how quickly you can integrate it into your professional practice.",
        "Success in the modern workplace requires balancing human insight with technological capability - {topic} is key to achieving that balance."
    ]
}

BUSINESS_OWNERS_TEMPLATES = {
    'intro': [
        "For SME owners, {topic} represents both a significant opportunity and a strategic imperative in today's competitive landscape.",
        "{statistic} - and small to medium enterprises that fail to adapt risk being left behind. Here's your practical guide to {topic}.",
        "The ROI of implementing {topic} in small business operations is no longer theoretical - early adopters are seeing {metric} improvements.",
        "As a business owner, you're constantly balancing limited resources with unlimited opportunities. {topic} can tip that balance in your favor.",
        "Forget enterprise-level complexity. This is a practical, SME-focused approach to leveraging {topic} for real business outcomes."
    ],
    'sections': [
        'Executive Overview',
        'ROI and Business Impact',
        'Implementation Roadmap for SMEs',
        'Budget Considerations',
        'Resource Requirements',
        'Risk Assessment and Mitigation',
        'Vendor Selection Criteria',
        'Change Management Strategy',
        'Success Metrics and KPIs',
        'Case Studies: SMEs Getting Results',
        'Common Pitfalls to Avoid',
        'Scaling Considerations',
        'Next Steps and Action Plan'
    ],
    'outro': [
        "The SMEs that will dominate their markets in the next decade are making strategic AI investments today. Don't be left behind.",
        "Remember: you don't need a Fortune 500 budget to leverage AI. You need smart strategy, focused implementation, and a willingness to adapt.",
        "The best time to start was yesterday. The second best time is now. Begin with small wins, prove ROI, then scale strategically.",
        "Your competition is either already implementing {topic} or planning to. The question is: will you lead, follow, or be left behind?"
    ]
}

def generate_content_section(template: str, topic: str, context: Dict) -> str:
    """Generate a content section based on template"""
    # Replace placeholders
    content = template.replace('{topic}', topic)
    content = content.replace('{activity}', context.get('activity', 'interact with technology'))
    content = content.replace('{area}', context.get('area', 'business operations'))
    content = content.replace('{metric}', context.get('metric', '30-50%'))
    content = content.replace('{statistic}', context.get('statistic', 'Recent studies show'))
    content = content.replace('{question}', context.get('question', 'how this works'))
    content = content.replace('{scenario}', context.get('scenario', 'a world where technology helps everyone'))
    content = content.replace('{fact}', context.get('fact', 'technology is amazing'))

    return content

def generate_article_content(article: Dict) -> str:
    """Generate full article content based on article metadata"""
    title = article['title']
    audience = article['audience']
    category = article['category']

    # Select appropriate template
    if audience == 'Young Learners':
        templates = YOUNG_LEARNERS_TEMPLATES
        word_count_range = (800, 1500)
    elif audience == 'Teenagers':
        templates = TEENAGERS_TEMPLATES
        word_count_range = (1200, 2000)
    elif audience == 'Professionals':
        templates = PROFESSIONALS_TEMPLATES
        word_count_range = (1500, 2500)
    else:  # Business Owners
        templates = BUSINESS_OWNERS_TEMPLATES
        word_count_range = (1800, 3000)

    # Build article content
    content_parts = []

    # Introduction
    intro = random.choice(templates['intro'])
    intro = generate_content_section(intro, title, {
        'activity': 'learn and grow',
        'area': 'this field',
        'metric': '35%',
        'statistic': 'Industry data shows',
        'question': f'about {title.lower()}',
        'scenario': f'exploring {title.lower()}',
        'fact': f'{title} is fascinating'
    })
    content_parts.append(intro)
    content_parts.append('')

    # Main sections
    num_sections = random.randint(4, 7)
    section_templates = templates['sections'][:num_sections]

    for section_title in section_templates:
        section_heading = section_title.replace('{topic}', title)
        content_parts.append(f'## {section_heading}')
        content_parts.append('')

        # Generate section content
        if audience == 'Young Learners':
            paragraphs = generate_young_learners_section(section_heading, title)
        elif audience == 'Teenagers':
            paragraphs = generate_teenagers_section(section_heading, title)
        elif audience == 'Professionals':
            paragraphs = generate_professionals_section(section_heading, title)
        else:
            paragraphs = generate_business_section(section_heading, title)

        content_parts.extend(paragraphs)
        content_parts.append('')

    # Conclusion
    outro = random.choice(templates['outro'])
    outro = generate_content_section(outro, title, {})
    content_parts.append(outro)

    return '\\n'.join(content_parts)

def generate_young_learners_section(heading: str, topic: str) -> List[str]:
    """Generate age-appropriate content for young learners"""
    paragraphs = []

    # Paragraph 1: Simple explanation
    paragraphs.append(f'Imagine you have a super smart helper that never gets tired and can remember everything. That\'s kind of what we\'re talking about with {topic}! It\'s like having a magical friend who\'s always ready to help you learn and discover new things.')
    paragraphs.append('')

    # Paragraph 2: How it works (simplified)
    paragraphs.append(f'Here\'s the cool part: just like you learn by practicing and making mistakes, computers can learn too! They look at lots and lots of examples, find patterns, and get better over time. It\'s similar to how you got better at riding a bike or playing your favorite game - practice makes perfect!')
    paragraphs.append('')

    # Add bullet points
    paragraphs.append('**Fun things you can try:**')
    paragraphs.append('- Ask your voice assistant silly questions')
    paragraphs.append('- Try drawing something and see if AI can guess what it is')
    paragraphs.append('- Use photo filters and see how they recognize your face')
    paragraphs.append('- Play games with AI characters')
    paragraphs.append('')

    # Real-world connection
    paragraphs.append(f'You probably use {topic} every day without even knowing it! When you watch videos online and it suggests another one you might like, that\'s AI. When you use fun filters on photos, that\'s AI too. It\'s all around us, making things easier and more fun.')

    return paragraphs

def generate_teenagers_section(heading: str, topic: str) -> List[str]:
    """Generate engaging content for teenagers"""
    paragraphs = []

    # Paragraph 1: Hook with relatability
    paragraphs.append(f'If you\'ve ever wondered why your For You page knows you better than your best friend, or how that one meme account keeps showing up exactly when you need a laugh - that\'s {topic} at work. And honestly? It\'s both impressive and slightly creepy.')
    paragraphs.append('')

    # Paragraph 2: Technical explanation (accessible)
    paragraphs.append(f'Here\'s the thing most people don\'t get about {topic}: it\'s not magic, and it\'s not actually "thinking" like humans do. It\'s more like a really sophisticated pattern-matching system that\'s gotten ridiculously good at predicting what you want based on what millions of other people have done before you.')
    paragraphs.append('')

    # Add practical examples
    paragraphs.append('**Real-world applications:**')
    paragraphs.append('- Social media algorithms deciding what you see')
    paragraphs.append('- Streaming services recommending your next binge')
    paragraphs.append('- Gaming NPCs that adapt to your play style')
    paragraphs.append('- Auto-correct that actually learns your texting habits')
    paragraphs.append('')

    # Current trends
    paragraphs.append(f'Right now, {topic} is literally everywhere in Gen Z culture. TikTok creators are using AI to edit videos in seconds, students are (let\'s be honest) using it for homework help, and everyone\'s playing with AI art generators. The question isn\'t whether you\'ll use AI - it\'s whether you\'ll understand what you\'re using.')

    return paragraphs

def generate_professionals_section(heading: str, topic: str) -> List[str]:
    """Generate professional-level content"""
    paragraphs = []

    # Paragraph 1: Strategic context
    paragraphs.append(f'The integration of {topic} into professional workflows represents a fundamental shift in how knowledge workers approach productivity and decision-making. Organizations that have successfully implemented these capabilities are reporting significant improvements in operational efficiency, with some studies indicating productivity gains of 25-40% in specific use cases.')
    paragraphs.append('')

    # Paragraph 2: Implementation considerations
    paragraphs.append(f'From a practical standpoint, adopting {topic} requires careful consideration of both technological infrastructure and organizational culture. The most successful implementations share common characteristics: clear use case identification, stakeholder buy-in, and a commitment to iterative improvement rather than perfect-first-time deployment.')
    paragraphs.append('')

    # Framework or methodology
    paragraphs.append('**Implementation framework:**')
    paragraphs.append('1. **Assessment**: Evaluate current workflows and identify automation opportunities')
    paragraphs.append('2. **Pilot**: Start with small-scale implementation in controlled environment')
    paragraphs.append('3. **Measurement**: Establish KPIs and track progress meticulously')
    paragraphs.append('4. **Iteration**: Refine based on user feedback and performance data')
    paragraphs.append('5. **Scale**: Expand successful pilots across the organization')
    paragraphs.append('')

    # Industry insights
    paragraphs.append(f'Industry leaders are discovering that {topic} delivers maximum value when combined with human expertise rather than replacing it. The professionals seeing the greatest career advancement are those who position themselves as AI-augmented experts - leveraging technology to enhance their core competencies rather than viewing it as a threat to their role.')

    return paragraphs

def generate_business_section(heading: str, topic: str) -> List[str]:
    """Generate business-focused content"""
    paragraphs = []

    # Paragraph 1: Business case
    paragraphs.append(f'For SME owners operating with limited resources, {topic} represents a strategic lever to compete with larger organizations. The democratization of AI tools means that capabilities once available only to enterprises with million-dollar IT budgets are now accessible to businesses of any size - the key differentiator is implementation strategy, not budget.')
    paragraphs.append('')

    # Paragraph 2: ROI focus
    paragraphs.append(f'The return on investment for {topic} manifests across multiple dimensions: direct cost savings through automation, revenue growth via enhanced customer experience, and risk mitigation through improved decision-making. Early adopter SMEs are reporting payback periods of 6-18 months, with ongoing benefits compounding year over year.')
    paragraphs.append('')

    # Cost-benefit analysis
    paragraphs.append('**Cost-benefit breakdown:**')
    paragraphs.append('- **Initial investment**: $5,000-$50,000 depending on scope')
    paragraphs.append('- **Ongoing costs**: $500-$5,000/month for tools and maintenance')
    paragraphs.append('- **Time to value**: 3-6 months for initial ROI')
    paragraphs.append('- **Expected ROI**: 200-400% over 24 months')
    paragraphs.append('- **Payback period**: 6-18 months average')
    paragraphs.append('')

    # Implementation roadmap
    paragraphs.append(f'The smartest approach for SMEs is to start with high-impact, low-complexity use cases that deliver quick wins. Success breeds internal champions, which facilitates broader adoption. Common starting points include customer service automation, marketing campaign optimization, and basic process automation - areas where AI tools are mature, affordable, and deliver measurable results quickly.')
    paragraphs.append('')

    # Risk management
    paragraphs.append('**Risk mitigation strategies:**')
    paragraphs.append('- Start with pilot programs to validate assumptions')
    paragraphs.append('- Choose vendors with strong SME track records')
    paragraphs.append('- Maintain human oversight on critical decisions')
    paragraphs.append('- Build internal knowledge to reduce vendor dependency')
    paragraphs.append('- Plan for graceful degradation if systems fail')

    return paragraphs

def enhance_article_with_metadata(article: Dict, content: str) -> Dict:
    """Add generated content and additional metadata"""
    article_copy = article.copy()

    # Add content
    article_copy['content'] = content

    # Generate featured image based on category
    image_keywords = {
        'young-learners': ['children', 'learning', 'technology', 'education', 'kids'],
        'teenagers': ['teenager', 'student', 'technology', 'social', 'youth'],
        'professionals': ['professional', 'business', 'office', 'work', 'computer'],
        'business-owners': ['business', 'entrepreneur', 'strategy', 'office', 'meeting']
    }

    keyword = random.choice(image_keywords.get(article['category'], ['technology']))
    article_copy['featured_image'] = f'https://images.unsplash.com/photo-{random.randint(1500000000, 1700000000)}?auto=format&fit=crop&w=1200&h=630&q={keyword}'

    # Generate tags
    all_tags = ['AI', 'Technology', 'Innovation', 'Future', 'Learning', 'Digital Transformation',
                'Machine Learning', 'Automation', 'Productivity', 'Education']
    article_copy['tags'] = random.sample(all_tags, random.randint(3, 5))

    # Enhanced excerpt
    first_para = content.split('\\n\\n')[0]
    if len(first_para) > 200:
        article_copy['excerpt'] = first_para[:197] + '...'
    else:
        article_copy['excerpt'] = first_para

    # SEO keywords
    title_words = article['title'].lower().split()
    article_copy['seo_keywords'] = ', '.join([
        article['title'],
        ', '.join(article_copy['tags']),
        article['audience']
    ])

    return article_copy

if __name__ == '__main__':
    # Load manifest
    with open('/home/vik/aiborg_CC/aiborg-learn-sphere/scripts/article_manifest.json', 'r') as f:
        articles = json.load(f)

    print(f"Generating content for {len(articles)} articles...")
    print("This will take a few minutes...\n")

    # Generate content for all articles
    enhanced_articles = []
    for i, article in enumerate(articles, 1):
        if i % 50 == 0:
            print(f"  Progress: {i}/{len(articles)} articles...")

        content = generate_article_content(article)
        enhanced_article = enhance_article_with_metadata(article, content)
        enhanced_articles.append(enhanced_article)

    # Save enhanced manifest
    with open('/home/vik/aiborg_CC/aiborg-learn-sphere/scripts/articles_with_content.json', 'w') as f:
        json.dump(enhanced_articles, f, indent=2)

    print(f"\n✅ Successfully generated content for {len(enhanced_articles)} articles!")
    print(f"   Enhanced manifest saved to: scripts/articles_with_content.json")
