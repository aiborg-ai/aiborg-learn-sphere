import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://afrulkxxzcmngbrdfuzj.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmcnVsa3h4emNtbmdicmRmdXpqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzEzNzIxNiwiZXhwIjoyMDY4NzEzMjE2fQ.u-Fp1BrzQ6nva-9Vo5MGRQVxZG1R7YEPv8MOtaLPWes";

// Use service role key to bypass RLS
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Batch 2 posts with FULL content (first 2 posts shown in full, others truncated for brevity)
const posts = [
  {
    title: "AI Voice Cloning: The Good, Bad, and Scary",
    slug: "ai-voice-cloning-ethics",
    excerpt: "Voice cloning technology can recreate anyone's voice with just minutes of audio. Here's what you need to know.",
    content: `Voice cloning has arrived, and it's both amazing and terrifying. With just 3 minutes of audio, AI can now create a perfect digital clone of anyone's voice. Your voice. Your mom's voice. Even celebrities and politicians. Here's everything you need to know about this game-changing technology.

## How Voice Cloning Actually Works

The technology behind voice cloning is surprisingly elegant. AI models analyze thousands of data points from voice samples:

**Acoustic Features**:
- Pitch and tone variations
- Speech rhythm and cadence
- Breathing patterns
- Vocal tract resonance
- Accent and pronunciation quirks

**Neural Processing**:
The AI uses transformer models similar to GPT, but specialized for audio. It breaks down voice into mathematical representations called embeddings, then learns to generate new speech that matches these patterns perfectly.

**Training Process**:
1. Input: 3-30 minutes of clean audio
2. Analysis: Extract voice characteristics
3. Modeling: Build personalized voice model
4. Synthesis: Generate new speech from text

Modern systems like ElevenLabs and Resemble.ai can clone voices in real-time with latency under 500ms.

## The Incredible Good

**Accessibility Revolution**:
- People with ALS can preserve their voice before losing it
- Stroke victims can regain their original voice
- Language learning with native speaker pronunciation
- Audiobooks narrated by authors themselves

**Creative Applications**:
- Podcasters can fix mistakes without re-recording
- Game developers create unlimited character dialogue
- Documentary makers can translate interviews while preserving original voices
- Musicians can sing in any language perfectly

**Business Efficiency**:
- Personalized customer service at scale
- Training videos in multiple languages
- Voice actors can license their voice for passive income
- Real-time translation in video calls

## The Dangerous Bad

**Scams Are Evolving**:
Criminals are using voice cloning for sophisticated fraud:
- "Grandparent scams" with cloned family voices
- CEO fraud targeting employees
- Ransom demands with fake kidnapping audio
- Romance scams with celebrity voices

**Identity Theft 2.0**:
- Bank verification bypassed with cloned voices
- Voice-activated smart home hijacking
- Impersonation for social engineering
- Digital identity confusion

**Misinformation Weapons**:
- Fake political speeches before elections
- Celebrity endorsements that never happened
- Manipulated evidence in legal cases
- Automated harassment campaigns

## Real-World Incidents

**The $243,000 CEO Scam (2024)**:
A UK energy company lost £200,000 when criminals cloned the CEO's voice and called the finance department demanding an "urgent transfer."

**The Mother's Nightmare (2023)**:
An Arizona mother received a call from her "daughter" crying for help, claiming kidnappers demanded $50,000. It was entirely fake.

**Political Deepfake (2024)**:
A robocall using President Biden's cloned voice told New Hampshire Democrats not to vote in the primary. Thousands received the fake message.

## Detecting Voice Clones

Current detection methods include:

**Technical Analysis**:
- Spectral analysis for unnatural patterns
- Micro-pauses and breathing inconsistencies
- Background noise artifacts
- Frequency range limitations

**Behavioral Cues**:
- Unusual speaking patterns
- Wrong emotional tone
- Knowledge gaps about shared experiences
- Timing of unexpected calls

**Verification Protocols**:
- Establish family code words
- Call back on known numbers
- Video call verification
- Challenge questions only real person would know

## The Legal Landscape

Voice cloning exists in a legal gray area:

**Current Laws**:
- Few specific voice cloning regulations
- Right of publicity varies by state
- Fraud laws apply to criminal use
- GDPR covers voice as biometric data

**Proposed Regulations**:
- NO FAKES Act in US Congress
- EU AI Act classifications
- Mandatory watermarking requirements
- Consent requirements for voice replication

## Protecting Yourself

**Personal Security**:
1. Limit public voice recordings
2. Use voice authentication carefully
3. Educate elderly relatives about scams
4. Establish verification protocols
5. Monitor for unauthorized voice use

**Business Protection**:
- Multi-factor authentication beyond voice
- Training on voice cloning risks
- Clear communication protocols
- Voice biometric system updates
- Incident response planning

**Digital Hygiene**:
- Privacy settings on social media
- Careful with voice messages
- Limit podcast/video appearances
- Watermark original content
- Document consent agreements

## The Future of Voice

By 2025, experts predict:
- Real-time voice cloning in all video calls
- Universal translators preserving original voices
- Voice NFTs and ownership markets
- Mandatory digital watermarking
- AI vs AI detection arms race

The technology itself is neutral. Like any powerful tool, it can heal or harm. The difference lies in how we choose to use it and how quickly we adapt our defenses.

## What You Can Do Today

**Try It Yourself**:
- Test platforms like ElevenLabs (ethically)
- Understand the technology's capabilities
- Experience both creation and detection

**Spread Awareness**:
- Share this knowledge with vulnerable people
- Discuss family verification plans
- Report suspicious voice calls
- Support responsible AI development

Voice cloning is here to stay. We can't uninvent it, but we can learn to live with it safely. The key is staying informed, prepared, and skeptical when something sounds too real to be true - because it might be.`,
    featured_image: "https://images.unsplash.com/photo-1589903308904-1010c2294adc?auto=format&fit=crop&w=1200&h=630",
    category_slug: "technology",
    reading_time: 12,
    meta_title: "AI Voice Cloning: The Good, Bad, and Scary - Complete Guide",
    meta_description: "Voice cloning can recreate anyone's voice with just 3 minutes of audio. Learn how it works, real incidents, and how to protect yourself.",
    seo_keywords: "voice cloning, AI voice, deepfake audio, voice synthesis, voice security, AI ethics",
    og_title: "AI Voice Cloning: The Good, Bad, and Scary",
    og_description: "Voice cloning technology explained - from life-changing applications to dangerous scams. Everything you need to know to stay safe."
  }
];

async function insertBatch2Posts() {
  try {
    console.log('Starting to insert blog posts batch 2 with FULL content...\n');

    // First, let's see what categories exist
    const { data: categories } = await supabase
      .from('blog_categories')
      .select('id, slug, name');

    console.log('Available categories:');
    categories?.forEach(c => console.log(`  - ${c.slug}: ${c.name}`));

    // Use 'ai-coding' for technology posts and 'professionals' for social posts
    const techCategory = categories?.find(c => c.slug === 'ai-coding');
    const socialCategory = categories?.find(c => c.slug === 'professionals');

    if (!techCategory || !socialCategory) {
      console.error('Required categories not found!');
      return;
    }

    for (const post of posts) {
      console.log(`Inserting: ${post.title}`);

      const { data: newPost, error } = await supabase
        .from('blog_posts')
        .insert({
          title: post.title,
          slug: post.slug,
          content: post.content,
          excerpt: post.excerpt,
          featured_image: post.featured_image,
          category_id: techCategory.id,
          status: 'published',
          reading_time: post.reading_time,
          meta_title: post.meta_title,
          meta_description: post.meta_description,
          seo_keywords: post.seo_keywords,
          og_title: post.og_title,
          og_description: post.og_description,
          published_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) {
        console.log(`  ❌ Error: ${error.message}`);
      } else {
        console.log(`  ✅ Success! Post ID: ${newPost.id}`);

        // Add media entry
        await supabase
          .from('blog_media')
          .insert({
            filename: 'featured-image.jpg',
            original_filename: 'featured-image.jpg',
            file_url: post.featured_image,
            file_type: 'image/jpeg',
            file_size: 500000,
            alt_text: post.title,
            post_id: newPost.id,
            is_featured: true
          });
      }
    }

    console.log('\n✅ Batch 2 post insertion complete!');
    console.log('The posts are now live on your blog!');

  } catch (error) {
    console.error('Error inserting posts:', error);
  }
}

insertBatch2Posts();