// src/systems/passiveChat.js - Passive conversation joining
import { getServerSettings, isCooldownActive, setCooldown, getChannelSettings } from '../memory/database.js';
import { random, getConfig } from '../utils/helpers.js';
import { isSleeping } from './sleepMode.js';
import { logger } from '../utils/logger.js';

const config = getConfig();

export function shouldPassivelyRespond(message) {
  const guildId = message.guild?.id;
  if (!guildId) return false;
  if (isSleeping()) return false;
  if (message.author.bot) return false;

  const settings = getServerSettings(guildId);
  if (!settings.passive_chat) return false;

  const channelSettings = getChannelSettings(message.channel.id);
  if (channelSettings && !channelSettings.passive_enabled) return false;

  const cooldownKey = `passive_${message.channel.id}`;
  const cooldownMs = config.behavior.passiveCooldown || 120000;
  if (isCooldownActive(cooldownKey, cooldownMs)) return false;

  const baseChance = settings.passive_chance || config.behavior.passiveReplyChance || 0.08;
  const talkLevel = settings.talk_level || 5;
  const adjustedChance = baseChance * (talkLevel / 5);
  let finalChance = adjustedChance;

  const content = message.content.toLowerCase();

  const triggerWords = [
    'nadia', 'who', 'koi', 'anyone', 'koi hai', 'guys',
    'bro', 'yaar', 'lol', 'lmao', '😭', '💀', 'what',
    'exam', 'game', 'movie', 'song', 'food', 'khana'
  ];

  for (const trigger of triggerWords) {
    if (content.includes(trigger)) {
      finalChance *= 1.5;
      break;
    }
  }

  finalChance = Math.min(finalChance, 0.3);
  const shouldRespond = random() < finalChance;

  if (shouldRespond) {
    setCooldown(cooldownKey);
    logger.debug(`💬 Passive response triggered in #${message.channel.name}`);
  }

  return shouldRespond;
}

export function isInterestingMessage(content) {
  if (content.length < 5) return false;
  if (content.startsWith('/') || content.startsWith('!')) return false;

  const emojiOnly = content.replace(/[\p{Emoji}\s]/gu, '').length === 0;
  if (emojiOnly) return random() < 0.1;

  if (content.includes('?') || content.includes('kya') || content.includes('kyun')) return true;
  if (content.length > 50) return true;

  return true;
}
