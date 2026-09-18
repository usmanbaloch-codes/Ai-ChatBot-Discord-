// src/memory/shortTermMemory.js - Short-term conversation context
import { getRecentMessages, addShortTermMemory } from './database.js';
import { getConfig } from '../utils/helpers.js';

const config = getConfig();

export function buildConversationContext(channelId, limit = null) {
  const maxMessages = limit || config.behavior.maxContextMessages || 25;
  const messages = getRecentMessages(channelId, maxMessages);

  return messages.map(msg => ({
    role: msg.is_bot ? 'assistant' : 'user',
    name: msg.username.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 20),
    content: `[${msg.username}]: ${msg.content}`,
    timestamp: msg.timestamp,
    userId: msg.user_id
  }));
}

export function rememberMessage(guildId, channelId, userId, username, content, isBot = false) {
  addShortTermMemory(guildId, channelId, userId, username, content, isBot);
}

export function getActiveUsers(channelId, limit = 10) {
  const messages = getRecentMessages(channelId, 50);
  const users = new Map();

  for (const msg of messages) {
    if (!msg.is_bot && !users.has(msg.user_id)) {
      users.set(msg.user_id, {
        userId: msg.user_id,
        username: msg.username,
        messageCount: 0
      });
    }
    if (users.has(msg.user_id)) {
      users.get(msg.user_id).messageCount++;
    }
  }

  return Array.from(users.values())
    .sort((a, b) => b.messageCount - a.messageCount)
    .slice(0, limit);
}

export function getConversationSummary(channelId, limit = 10) {
  const messages = getRecentMessages(channelId, limit);
  return messages.map(m => `${m.username}: ${m.content}`).join('\n');
}
