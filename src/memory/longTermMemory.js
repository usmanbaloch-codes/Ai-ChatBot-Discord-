// src/memory/longTermMemory.js - Long-term memory management
import {
  addLongTermMemory,
  getLongTermMemories,
  getRelationship
} from './database.js';
import { logger } from '../utils/logger.js';

export const MEMORY_TYPES = {
  FACT: 'fact',
  JOKE: 'joke',
  NICKNAME: 'nickname',
  EVENT: 'event',
  PREFERENCE: 'preference',
  TOPIC: 'topic'
};

export function rememberLongTerm(guildId, userId, type, content, importance = 5) {
  try {
    addLongTermMemory(guildId, userId, type, content, importance);
    logger.debug(`📝 Long-term memory stored: [${type}] ${content}`);
  } catch (err) {
    logger.error('Failed to store long-term memory:', err);
  }
}

export function getRelevantMemories(guildId, userId) {
  const memories = getLongTermMemories(guildId, userId, 15);
  const relationship = getRelationship(guildId, userId);

  return {
    memories: memories.map(m => ({
      type: m.memory_type,
      content: m.content,
      importance: m.importance
    })),
    relationship: relationship ? {
      friendshipLevel: relationship.friendship_level,
      interactionCount: relationship.interaction_count,
      nickname: relationship.nickname,
      notes: relationship.notes
    } : null
  };
}

export function buildMemoryContext(guildId, userId, username) {
  const { memories, relationship } = getRelevantMemories(guildId, userId);

  let context = '';

  if (relationship) {
    context += `\n[RELATIONSHIP WITH ${username}]\n`;
    context += `Friendship Level: ${relationship.friendshipLevel}/100\n`;
    context += `Interactions: ${relationship.interactionCount}\n`;
    if (relationship.nickname) {
      context += `You call them: "${relationship.nickname}"\n`;
    }

    if (relationship.friendshipLevel >= 50) {
      context += `Status: Close friend - be warm, use inside jokes\n`;
    } else if (relationship.friendshipLevel >= 20) {
      context += `Status: Getting friendly - be casual and open\n`;
    } else if (relationship.friendshipLevel <= -5) {
      context += `Status: Not on good terms - be more distant\n`;
    } else {
      context += `Status: Acquaintance - be friendly but natural\n`;
    }
  }

  if (memories.length > 0) {
    context += `\n[THINGS YOU REMEMBER]\n`;
    for (const mem of memories) {
      context += `- [${mem.type}] ${mem.content}\n`;
    }
  }

  return context;
}
