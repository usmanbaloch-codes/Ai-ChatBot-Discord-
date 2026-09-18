// src/systems/cooldownManager.js - Rate limiting and anti-spam
import { isCooldownActive, setCooldown } from '../memory/database.js';
import { getConfig } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';

const config = getConfig();

const userMessageCounts = new Map();
const RATE_WINDOW = 60000;
const MAX_MESSAGES_PER_WINDOW = 5;

export function isRateLimited(userId) {
  const now = Date.now();
  const userKey = `rate_${userId}`;

  if (!userMessageCounts.has(userKey)) {
    userMessageCounts.set(userKey, []);
  }

  const timestamps = userMessageCounts.get(userKey);
  const recent = timestamps.filter(t => now - t < RATE_WINDOW);
  userMessageCounts.set(userKey, recent);

  if (recent.length >= MAX_MESSAGES_PER_WINDOW) {
    logger.debug(`⏱️ Rate limited user: ${userId}`);
    return true;
  }

  return false;
}

export function recordInteraction(userId) {
  const userKey = `rate_${userId}`;

  if (!userMessageCounts.has(userKey)) {
    userMessageCounts.set(userKey, []);
  }

  userMessageCounts.get(userKey).push(Date.now());
}

export function isMentionCooldown(channelId) {
  const cooldownKey = `mention_${channelId}`;
  return isCooldownActive(cooldownKey, config.behavior.mentionCooldown || 3000);
}

export function setMentionCooldown(channelId) {
  const cooldownKey = `mention_${channelId}`;
  setCooldown(cooldownKey);
}

export function cleanupRateLimits() {
  const now = Date.now();

  for (const [key, timestamps] of userMessageCounts.entries()) {
    const recent = timestamps.filter(t => now - t < RATE_WINDOW);
    if (recent.length === 0) {
      userMessageCounts.delete(key);
    } else {
      userMessageCounts.set(key, recent);
    }
  }
}

setInterval(cleanupRateLimits, 300000);
