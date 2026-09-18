// src/ai/engine.js - Free AI providers (Groq, Gemini, Ollama)
import { buildSystemPrompt, buildMessages } from './prompts.js';
import { buildConversationContext } from '../memory/shortTermMemory.js';
import { getServerSettings } from '../memory/database.js';
import { logger } from '../utils/logger.js';
import { getConfig, truncate, randomPick } from '../utils/helpers.js';

const config = getConfig();

// ==============================
// Initialize AI Clients
// ==============================

let groqClient = null;
let geminiClient = null;
let ollamaClient = null;

async function initializeClients() {
  const provider = process.env.AI_PROVIDER || 'groq';

  if (provider === 'groq' && process.env.GROQ_API_KEY) {
    const { default: Groq } = await import('groq-sdk');
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
    logger.info('🤖 Groq AI initialized (FREE) ✅');

  } else if (provider === 'gemini' && process.env.GEMINI_API_KEY) {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    logger.info('🤖 Google Gemini initialized (FREE) ✅');

  } else if (provider === 'ollama') {
    const { Ollama } = await import('ollama');
    ollamaClient = new Ollama({
      host: process.env.OLLAMA_URL || 'http://localhost:11434'
    });
    logger.info('🤖 Ollama initialized (LOCAL FREE) ✅');

  } else {
    logger.warn('⚠️ No AI provider configured properly!');
    logger.warn('Set AI_PROVIDER in .env to: groq, gemini, or ollama');
  }
}

// Initialize on startup
initializeClients().catch(err => logger.error('AI init error:', err));

// ==============================
// Main Response Generator
// ==============================

export async function generateResponse(options = {}) {
  const {
    message,
    content,
    isPassive = false
  } = options;

  try {
    const guildId = message.guild?.id;
    const channelId = message.channel.id;
    const userId = message.author.id;
    const username = message.member?.displayName || message.author.username;

    // Get server settings
    const settings = guildId ? getServerSettings(guildId) : {
      personality: 'chill_pakistani',
      mood: 'normal'
    };

    // Build system prompt
    const systemPrompt = buildSystemPrompt({
      personalityKey: settings.personality,
      mood: settings.mood,
      guildName: message.guild?.name || 'DM',
      channelName: message.channel.name || 'dm',
      guildId,
      userId,
      username
    });

    // Build conversation history
    const conversationHistory = buildConversationContext(
      channelId,
      config.behavior.maxContextMessages || 15
    );

    // Current message formatted
    const currentMessage = `[${username}]: ${content}`;

    // Build full messages array
    const messages = buildMessages(systemPrompt, conversationHistory, currentMessage);

    // Add passive hint
    if (isPassive) {
      messages[0].content += `\n\n[NOTE: You are jumping into conversation naturally without being mentioned. Keep it very short and casual. 1-2 sentences max. Just react naturally.]`;
    }

    // Route to correct provider
    const provider = process.env.AI_PROVIDER || 'groq';
    let response;

    if (provider === 'groq' && groqClient) {
      response = await callGroq(systemPrompt, messages);

    } else if (provider === 'gemini' && geminiClient) {
      response = await callGemini(systemPrompt, messages, currentMessage);

    } else if (provider === 'ollama' && ollamaClient) {
      response = await callOllama(systemPrompt, messages);

    } else {
      // No provider available - use smart fallback
      response = getSmartFallback(content);
    }

    // Clean and return
    return cleanResponse(response);

  } catch (error) {
    logger.error('AI generation error:', error.message);
    return getSmartFallback(content);
  }
}

// ==============================
// Groq API Call (FREE - Fastest)
// ==============================

async function callGroq(systemPrompt, messages) {
  const model = 'llama-3.3-70b-versatile';
  const formattedMessages = formatMessagesForOpenAIStyle(systemPrompt, messages);

  const response = await groqClient.chat.completions.create({
    model: model,
    messages: formattedMessages,
    max_tokens: 300,
    temperature: 0.9,
    top_p: 0.95,
    stream: false
  });

  return response.choices[0].message.content;
}

// ==============================
// Google Gemini API Call (FREE)
// ==============================

async function callGemini(systemPrompt, messages, currentMessage) {
  const model = geminiClient.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: systemPrompt,
    generationConfig: {
      maxOutputTokens: 300,
      temperature: 0.9,
      topP: 0.95
    }
  });

  const history = [];

  for (const msg of messages.slice(1, -1)) {
    if (msg.role === 'user') {
      history.push({
        role: 'user',
        parts: [{ text: msg.content }]
      });
    } else if (msg.role === 'assistant') {
      history.push({
        role: 'model',
        parts: [{ text: msg.content }]
      });
    }
  }

  const chat = model.startChat({ history });
  const result = await chat.sendMessage(currentMessage);
  return result.response.text();
}

// ==============================
// Ollama API Call (100% Local)
// ==============================

async function callOllama(systemPrompt, messages) {
  const model = process.env.OLLAMA_MODEL || 'llama3.2';
  const formattedMessages = formatMessagesForOpenAIStyle(systemPrompt, messages);

  const response = await ollamaClient.chat({
    model: model,
    messages: formattedMessages,
    options: {
      temperature: 0.9,
      top_p: 0.95,
      num_predict: 200
    }
  });

  return response.message.content;
}

// ==============================
// Helper Functions
// ==============================

function formatMessagesForOpenAIStyle(systemPrompt, messages) {
  const formatted = [
    { role: 'system', content: systemPrompt }
  ];

  for (const msg of messages.slice(1)) {
    formatted.push({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    });
  }

  return formatted;
}

function getSmartFallback(content) {
  const lower = content.toLowerCase();

  if (lower.includes('?')) {
    return randomPick(['idk tbh', 'hmm good question', 'nahi pata yaar', 'shayad?', 'maybe lol']);
  }

  if (lower.includes('haha') || lower.includes('lol') || lower.includes('😂')) {
    return randomPick(['😭', 'lmao', 'bro 💀', 'hahahaha', 'im dead']);
  }

  if (lower.includes('sad') || lower.includes('😢') || lower.includes('udaas')) {
    return randomPick(['aww yaar 🥺', 'arey nahi', 'it\'s okay ❤️', 'what happened?']);
  }

  return randomPick([
    'hmm', 'lol', 'fr', 'same', 'acha', 'haan', 'wait what',
    'bro 💀', 'real', 'sahi hai', 'okay but', '😭', 'wild ngl'
  ]);
}

function cleanResponse(text) {
  if (!text) return 'hmm';

  let cleaned = text;
  cleaned = cleaned.replace(/^\[?nadia\]?\s*:\s*/i, '');
  cleaned = cleaned.replace(/^(nadia|assistant|ai)\s*:\s*/i, '');
  cleaned = cleaned.replace(/#{1,6}\s/g, '');
  cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, '$1');
  cleaned = cleaned.replace(/\*(.*?)\*/g, '$1');
  cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
  cleaned = cleaned.replace(/`(.*?)`/g, '$1');
  cleaned = cleaned.replace(/^[-*•]\s/gm, '');
  cleaned = cleaned.replace(/\n{3,}/g, '\n');
  cleaned = truncate(cleaned, 350);

  return cleaned.trim() || 'hmm';
}

// ==============================
// Sentiment Analysis (unchanged)
// ==============================

export async function analyzeMessageSentiment(content) {
  const positiveWords = [
    'love', 'great', 'nice', 'amazing', 'haha', 'lol', 'thanks',
    'shukriya', 'maza', 'best', 'awesome', 'acha', 'sahi', '❤️', '😊'
  ];
  const negativeWords = [
    'hate', 'bad', 'stupid', 'worst', 'bura', 'ganda', 'annoying',
    '😡', 'shut up', 'bc', 'mc', 'trash'
  ];

  const lower = content.toLowerCase();
  let score = 0;

  for (const word of positiveWords) {
    if (lower.includes(word)) score++;
  }
  for (const word of negativeWords) {
    if (lower.includes(word)) score--;
  }

  if (score >= 2) return 'very_positive';
  if (score >= 1) return 'positive';
  if (score <= -2) return 'very_negative';
  if (score <= -1) return 'negative';
  return 'neutral';
}
