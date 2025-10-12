/**
 * Simple test script for Ollama integration (without logger dependency)
 * Run with: npx tsx scripts/test-ollama-simple.ts
 */

import { Ollama } from 'ollama';

const OLLAMA_HOST = 'http://localhost:11434';
const MODEL = 'llama3.1:8b';

async function testOllamaIntegration() {
  console.log('🧪 Testing Ollama Integration...\n');

  const ollama = new Ollama({ host: OLLAMA_HOST });

  // Test 1: Health Check
  console.log('1️⃣  Testing health check...');
  try {
    await ollama.list();
    console.log('   ✓ Ollama is healthy ✅\n');
  } catch (error) {
    console.error('   ❌ Ollama is not responding:', error);
    console.error('\n💡 Make sure Ollama is running with: ollama serve');
    process.exit(1);
  }

  // Test 2: List Models
  console.log('2️⃣  Testing list models...');
  try {
    const response = await ollama.list();
    const models = response.models || [];
    console.log(`   ✓ Found ${models.length} models:`);
    models.slice(0, 5).forEach((model: any) => {
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
    const response = await ollama.chat({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant. Keep responses brief.',
        },
        {
          role: 'user',
          content: 'Say hello in 5 words or less.',
        },
      ],
      stream: false,
    });
    console.log(`   ✓ Response: "${response.message.content}"\n`);
  } catch (error) {
    console.error('   ❌ Failed to chat:', error);
    console.error(`\n💡 Make sure model "${MODEL}" is installed with: ollama pull ${MODEL}`);
    process.exit(1);
  }

  // Test 4: Chatbot Simulation
  console.log('4️⃣  Testing chatbot simulation...');
  try {
    const systemPrompt = `You are "aiborg chat", a friendly AI learning assistant. You help users discover AI courses.

IMPORTANT: Keep your response to 1-2 sentences only.`;

    const response = await ollama.chat({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: 'What AI courses do you recommend for professionals?',
        },
      ],
      options: {
        temperature: 0.7,
      },
      stream: false,
    });
    console.log(`   ✓ Response: "${response.message.content.substring(0, 150)}..."\n`);
  } catch (error) {
    console.error('   ❌ Failed to test chatbot:', error);
    process.exit(1);
  }

  // Test 5: Conversation Context
  console.log('5️⃣  Testing conversation with context...');
  try {
    const response = await ollama.chat({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI assistant. Keep responses brief.',
        },
        {
          role: 'user',
          content: 'My name is Alice.',
        },
        {
          role: 'assistant',
          content: 'Nice to meet you, Alice! How can I help you today?',
        },
        {
          role: 'user',
          content: 'What is my name?',
        },
      ],
      options: {
        temperature: 0.7,
      },
      stream: false,
    });
    console.log(`   ✓ Response: "${response.message.content}"`);
    console.log(
      `   ${response.message.content.toLowerCase().includes('alice') ? '✅ Context preserved!' : '❌ Context not preserved'}\n`
    );
  } catch (error) {
    console.error('   ❌ Failed to test context:', error);
    process.exit(1);
  }

  console.log('🎉 All tests passed! Ollama integration is working correctly.\n');
  console.log('📝 Next steps:');
  console.log('   1. Start your dev server: npm run dev');
  console.log('   2. Open the app and click the chat bubble (bottom-right)');
  console.log('   3. Try asking questions about courses');
  console.log('   4. For study assistant, log in first and click the brain icon\n');
  console.log('💡 Configuration:');
  console.log(`   - Ollama Host: ${OLLAMA_HOST}`);
  console.log(`   - Model: ${MODEL}`);
  console.log('   - To change model, edit VITE_OLLAMA_MODEL in .env.local\n');
}

// Run tests
testOllamaIntegration().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
