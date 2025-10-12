/**
 * Test script for Ollama integration
 * Run with: npx tsx scripts/test-ollama.ts
 */

// Mock import.meta for Node.js environment
(globalThis as any).import.meta = { env: { DEV: true } };

import {
  chat,
  checkOllamaHealth,
  listModels,
  createChatbotSystemPrompt,
} from '../src/services/ollamaService';

async function testOllamaIntegration() {
  console.log('🧪 Testing Ollama Integration...\n');

  // Test 1: Health Check
  console.log('1️⃣  Testing health check...');
  const isHealthy = await checkOllamaHealth();
  console.log(`   ✓ Ollama is ${isHealthy ? 'healthy ✅' : 'not responding ❌'}\n`);

  if (!isHealthy) {
    console.error('❌ Ollama is not available. Make sure it is running with: ollama serve');
    process.exit(1);
  }

  // Test 2: List Models
  console.log('2️⃣  Testing list models...');
  try {
    const models = await listModels();
    console.log(`   ✓ Found ${models.length} models:`);
    models.slice(0, 5).forEach(model => {
      console.log(`     - ${model.name} (${(model.size / 1024 / 1024 / 1024).toFixed(2)} GB)`);
    });
    if (models.length > 5) {
      console.log(`     ... and ${models.length - 5} more`);
    }
    console.log('');
  } catch (error) {
    console.error('   ❌ Failed to list models:', error);
    process.exit(1);
  }

  // Test 3: Simple Chat
  console.log('3️⃣  Testing simple chat...');
  try {
    const response = await chat(
      [
        {
          role: 'system',
          content: 'You are a helpful assistant. Keep responses brief.',
        },
        {
          role: 'user',
          content: 'Say hello in 5 words or less.',
        },
      ],
      { temperature: 0.7 }
    );
    console.log(`   ✓ Response: "${response}"\n`);
  } catch (error) {
    console.error('   ❌ Failed to chat:', error);
    process.exit(1);
  }

  // Test 4: Chatbot with System Prompt
  console.log('4️⃣  Testing chatbot system prompt...');
  try {
    const coursesData = [
      {
        title: 'AI Fundamentals for Professionals',
        price: '£89',
        duration: '8 weeks',
        level: 'Intermediate',
        audience: 'professional',
        description: 'Learn AI basics for your career',
        category: 'AI Fundamentals',
      },
    ];

    const systemPrompt = createChatbotSystemPrompt('professional', coursesData);
    console.log(`   ✓ System prompt created (${systemPrompt.length} characters)`);

    const response = await chat(
      [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: 'What AI courses do you recommend for professionals?',
        },
      ],
      { temperature: 0.7 }
    );
    console.log(`   ✓ Response: "${response.substring(0, 100)}..."\n`);
  } catch (error) {
    console.error('   ❌ Failed to test chatbot:', error);
    process.exit(1);
  }

  // Test 5: Conversation Context
  console.log('5️⃣  Testing conversation with context...');
  try {
    const messages = [
      {
        role: 'system' as const,
        content: 'You are a helpful AI assistant. Keep responses brief and friendly.',
      },
      {
        role: 'user' as const,
        content: 'My name is Alice.',
      },
      {
        role: 'assistant' as const,
        content: 'Nice to meet you, Alice! How can I help you today?',
      },
      {
        role: 'user' as const,
        content: 'What is my name?',
      },
    ];

    const response = await chat(messages, { temperature: 0.7 });
    console.log(`   ✓ Response: "${response}"`);
    console.log(
      `   ${response.toLowerCase().includes('alice') ? '✅ Context preserved!' : '❌ Context not preserved'}\n`
    );
  } catch (error) {
    console.error('   ❌ Failed to test context:', error);
    process.exit(1);
  }

  console.log('🎉 All tests passed! Ollama integration is working correctly.\n');
  console.log('📝 Next steps:');
  console.log('   1. Start your dev server: npm run dev');
  console.log('   2. Open the app and click the chat bubble');
  console.log('   3. Try asking questions about courses');
  console.log('');
}

// Run tests
testOllamaIntegration().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
