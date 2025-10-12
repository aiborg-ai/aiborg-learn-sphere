# Ollama Integration Guide

This document explains how the aiborg Learn Sphere platform integrates with Ollama for local
AI-powered features.

## Overview

The platform uses Ollama to power two main AI features:

1. **AI Chatbot** (`AIChatbot.tsx`) - A conversational assistant that helps users discover courses
   and answer questions
2. **AI Study Assistant** (`AIStudyAssistant.tsx`) - A personalized study companion for enrolled
   students

## Prerequisites

### Install Ollama

1. **Download and install Ollama:**

   ```bash
   # Linux (via curl)
   curl -fsSL https://ollama.com/install.sh | sh

   # macOS
   brew install ollama

   # Or download from: https://ollama.com/download
   ```

2. **Verify installation:**

   ```bash
   ollama --version
   ```

3. **Pull the required models:**

   ```bash
   # Main chat model (recommended)
   ollama pull llama3.1:8b

   # Alternative models (optional)
   ollama pull mistral:7b
   ollama pull phi3.5:3.8b

   # Embedding model (for future features)
   ollama pull nomic-embed-text:latest
   ```

4. **Start Ollama service:**

   ```bash
   # Ollama runs as a service on installation, but you can also run:
   ollama serve
   ```

5. **Verify Ollama is running:**

   ```bash
   # Check available models
   ollama list

   # Test with a simple prompt
   ollama run llama3.1:8b "Hello, how are you?"
   ```

## Configuration

### Environment Variables

Add the following to your `.env.local` file:

```env
# Ollama Configuration
VITE_OLLAMA_HOST=http://localhost:11434
VITE_OLLAMA_MODEL=llama3.1:8b
```

**Configuration Options:**

- `VITE_OLLAMA_HOST`: The URL where Ollama is running (default: `http://localhost:11434`)
- `VITE_OLLAMA_MODEL`: The model to use for chat (default: `llama3.1:8b`)

### Available Models

You can use any model installed in your Ollama instance:

| Model            | Size   | Best For                   | Memory Required |
| ---------------- | ------ | -------------------------- | --------------- |
| `llama3.1:8b`    | 4.9 GB | General chat, recommended  | 8 GB RAM        |
| `mistral:7b`     | 4.4 GB | Fast responses, efficient  | 6 GB RAM        |
| `phi3.5:3.8b`    | 2.2 GB | Low resource usage         | 4 GB RAM        |
| `tinyllama:1.1b` | 637 MB | Very fast, basic responses | 2 GB RAM        |

To change models, update `VITE_OLLAMA_MODEL` in your `.env.local` file.

## Architecture

### Service Layer

The integration is implemented in `/src/services/ollamaService.ts`:

**Key Functions:**

- `chat(messages, options)` - Send a chat message and get a response
- `chatStream(messages, options)` - Stream responses (for future UI improvements)
- `checkOllamaHealth()` - Verify Ollama is running and accessible
- `listModels()` - Get available models
- `generateEmbeddings(text)` - Create embeddings (for semantic search)

**System Prompts:**

- `createChatbotSystemPrompt(audience, coursesData)` - Customizes chatbot behavior per audience
- `createStudyAssistantSystemPrompt()` - Configures study assistant with learning guidelines

### Component Integration

Both AI components follow this pattern:

1. **Health Check**: Verify Ollama is available before making requests
2. **Context Building**: Prepare conversation history and system prompts
3. **API Call**: Send request to Ollama via the service layer
4. **Error Handling**: Fallback to static responses if Ollama is unavailable
5. **State Management**: Track availability to avoid repeated health checks

### Audience-Based Personalization

The chatbot adapts its tone and content based on the selected audience:

- **Primary** (ages 7-11): Simple, fun language with emojis
- **Secondary** (ages 11-18): Relatable, career-focused
- **Professional**: Technical, ROI-focused
- **Business**: Strategic, transformation-oriented

## Usage

### Development

1. **Ensure Ollama is running:**

   ```bash
   # Check status
   systemctl status ollama  # Linux
   # or
   brew services list  # macOS
   ```

2. **Start the development server:**

   ```bash
   npm run dev
   ```

3. **Test the AI features:**
   - Click the chat bubble in the bottom-right corner (AI Chatbot)
   - Log in and click the brain icon (AI Study Assistant - requires authentication)

### Testing Ollama Connection

You can verify the integration is working:

```typescript
import { checkOllamaHealth, listModels } from '@/services/ollamaService';

// Check health
const isHealthy = await checkOllamaHealth();
console.log('Ollama is healthy:', isHealthy);

// List available models
const models = await listModels();
console.log('Available models:', models);
```

## Troubleshooting

### "Ollama is not available" Error

**Problem:** The application can't connect to Ollama.

**Solutions:**

1. **Check if Ollama is running:**

   ```bash
   curl http://localhost:11434/api/tags
   ```

2. **Start Ollama service:**

   ```bash
   # Linux
   systemctl start ollama

   # macOS
   brew services start ollama

   # Manual start
   ollama serve
   ```

3. **Check firewall settings:** Ensure port 11434 is not blocked.

4. **Verify environment variables:** Check that `VITE_OLLAMA_HOST` is set correctly in `.env.local`.

### Slow Response Times

**Problem:** AI responses take too long.

**Solutions:**

1. **Use a smaller model:**

   ```env
   VITE_OLLAMA_MODEL=phi3.5:3.8b
   ```

2. **Increase system resources:**
   - Close unnecessary applications
   - Ensure sufficient RAM is available
   - Consider using GPU acceleration if available

3. **Optimize context:**
   - Limit conversation history length
   - Reduce system prompt size

### Model Not Found

**Problem:** Error about model not being available.

**Solutions:**

1. **Pull the model:**

   ```bash
   ollama pull llama3.1:8b
   ```

2. **Verify model name:**

   ```bash
   ollama list
   ```

3. **Update environment variable:** Use exact model name from `ollama list`.

### CORS Issues (Remote Ollama)

**Problem:** CORS errors when connecting to remote Ollama instance.

**Solutions:**

1. **Set OLLAMA_ORIGINS environment variable:**

   ```bash
   export OLLAMA_ORIGINS="http://localhost:8080"
   ollama serve
   ```

2. **Use systemd override (Linux):**

   ```bash
   sudo systemctl edit ollama
   ```

   Add:

   ```ini
   [Service]
   Environment="OLLAMA_ORIGINS=http://localhost:8080"
   ```

## Production Considerations

### Cloud Deployment

For production deployments, consider:

1. **Self-Hosted Ollama:**
   - Deploy Ollama on a dedicated server
   - Use environment variables to configure the host
   - Implement authentication/API keys

2. **Fallback to Cloud APIs:**
   - Keep Supabase Edge Functions as fallback
   - Implement feature flags to toggle between Ollama and cloud APIs
   - Monitor Ollama health and switch automatically

3. **Cost Optimization:**
   - Local Ollama: Free, but requires infrastructure
   - Cloud APIs: Pay per token, but no infrastructure management
   - Hybrid: Use Ollama for development, cloud for production

### Security

1. **Network Security:**
   - Keep Ollama on internal network or VPN
   - Use authentication if exposing externally
   - Implement rate limiting

2. **Input Validation:**
   - Sanitize user inputs before sending to Ollama
   - Implement content filtering
   - Set response length limits

3. **Data Privacy:**
   - Ollama runs locally - no data sent to external services
   - User conversations stay on your infrastructure
   - Comply with data protection regulations (GDPR, etc.)

## Performance Optimization

### Model Selection

Choose models based on your use case:

- **High Quality**: `llama3.1:8b` or `mistral:7b`
- **Balanced**: `phi3.5:3.8b`
- **Fast/Low Resource**: `tinyllama:1.1b`

### Context Management

- Limit conversation history to last 10-15 messages
- Summarize older context instead of sending full history
- Use embeddings for retrieving relevant context

### Caching

Consider implementing:

- Response caching for common questions
- Embedding caching for documents
- Session-based context caching

## Future Enhancements

Potential improvements to consider:

1. **Streaming Responses**: Use `chatStream()` for real-time typing effect
2. **Multi-Modal**: Support image inputs with vision-capable models
3. **RAG (Retrieval Augmented Generation)**: Use embeddings to search course materials
4. **Model Fine-Tuning**: Create custom models trained on your content
5. **A/B Testing**: Compare different models and prompts
6. **Analytics**: Track model performance, response quality, user satisfaction

## Resources

- [Ollama Documentation](https://github.com/ollama/ollama)
- [Ollama API Reference](https://github.com/ollama/ollama/blob/main/docs/api.md)
- [Ollama.js Library](https://github.com/ollama/ollama-js)
- [Model Library](https://ollama.com/library)

## Support

For issues or questions:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review Ollama logs: `journalctl -u ollama -f` (Linux)
3. Check browser console for client-side errors
4. Review application logs for service-layer errors

## Summary

You now have Ollama fully integrated into your application! The AI Chatbot and Study Assistant will
use your local Ollama instance for generating responses, providing:

- **Privacy**: All data stays on your infrastructure
- **Cost Savings**: No API fees for AI interactions
- **Customization**: Use any model from Ollama's library
- **Performance**: Low latency for local deployments
- **Control**: Full control over model selection and configuration
