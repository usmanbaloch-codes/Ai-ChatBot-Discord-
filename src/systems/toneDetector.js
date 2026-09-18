// src/systems/toneDetector.js - Detect message tone and context
import { logger } from '../utils/logger.js';

export function detectTone(content) {
  const lower = content.toLowerCase();

  const seriousIndicators = [
    'help me', 'please', 'urgent', 'emergency', 'depressed',
    'anxious', 'scared', 'worried', 'madad', 'please yaar',
    'serious', 'not joking', 'for real', 'im not kidding',
    'trigger warning', 'tw', 'suicide', 'self harm'
  ];

  for (const indicator of seriousIndicators) {
    if (lower.includes(indicator)) {
      return {
        tone: 'serious',
        shouldAvoid: lower.includes('suicide') || lower.includes('self harm'),
        sensitive: true
      };
    }
  }

  const angryIndicators = [
    'fuck', 'bc', 'mc', 'stfu', 'shut up', 'hate you',
    'chup', 'band kar', 'nikal', 'door ho', 'bhag'
  ];

  for (const indicator of angryIndicators) {
    if (lower.includes(indicator)) {
      return { tone: 'angry', shouldAvoid: false, sensitive: false };
    }
  }

  const sadIndicators = [
    'sad', 'crying', 'tears', 'depressed', 'lonely',
    'ro rahi', 'ro raha', 'dukhi', 'udaas', 'akela',
    '😢', '😭', '🥺', 'miss', 'yaad'
  ];

  for (const indicator of sadIndicators) {
    if (lower.includes(indicator)) {
      return { tone: 'sad', shouldAvoid: false, sensitive: false };
    }
  }

  const excitedIndicators = [
    'omg', 'oh my god', 'yesss', 'lets go', 'hype',
    'excited', 'finally', 'amazing', 'incredible',
    '🔥', '🎉', '🤩', 'LETS', 'YOOOO'
  ];

  for (const indicator of excitedIndicators) {
    if (lower.includes(indicator)) {
      return { tone: 'excited', shouldAvoid: false, sensitive: false };
    }
  }

  if (content.includes('?') || lower.includes('kya') || lower.includes('kyun') || lower.includes('kaise')) {
    return { tone: 'question', shouldAvoid: false, sensitive: false };
  }

  const humorIndicators = [
    'lol', 'lmao', 'rofl', 'haha', '😂', '🤣', '💀',
    'dead', 'im done', 'dying', 'bruh'
  ];

  for (const indicator of humorIndicators) {
    if (lower.includes(indicator)) {
      return { tone: 'humorous', shouldAvoid: false, sensitive: false };
    }
  }

  return { tone: 'neutral', shouldAvoid: false, sensitive: false };
}

export function shouldAvoidMessage(content) {
  const { shouldAvoid, sensitive } = detectTone(content);

  if (shouldAvoid) {
    logger.warn('⚠️ Sensitive content detected, avoiding response');
    return true;
  }

  return false;
}
