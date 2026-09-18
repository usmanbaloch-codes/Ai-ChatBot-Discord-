// src/utils/helpers.js - Utility functions
import { readFileSync } from 'fs';

const config = JSON.parse(readFileSync('./config.json', 'utf-8'));

export function getConfig() {
  return config;
}

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function random() {
  return Math.random();
}

export function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function calculateTypingDelay(text) {
  const cpm = config.behavior.typingSpeedCPM || 450;
  const baseDelay = (text.length / cpm) * 60 * 1000;
  const variance = baseDelay * (0.7 + Math.random() * 0.6);
  const min = config.behavior.minReplyDelay || 800;
  const max = config.behavior.maxReplyDelay || 4500;

  return Math.max(min, Math.min(max, variance));
}

export function isChannelAllowed(channelId) {
  const { blacklist, whitelist, useWhitelist } = config.channels;

  if (blacklist.includes(channelId)) return false;
  if (useWhitelist && whitelist.length > 0) {
    return whitelist.includes(channelId);
  }
  return true;
}

export function truncate(text, maxLen = 2000) {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 3) + '...';
}

export function isBotMentioned(message, client) {
  if (message.mentions.has(client.user)) return true;

  const botName = config.bot.name.toLowerCase();
  const content = message.content.toLowerCase();

  if (content.includes(botName)) return true;
  if (content.includes('nadia')) return true;

  return false;
}

export function stripMention(content, clientId) {
  return content
    .replace(new RegExp(`<@!?${clientId}>`, 'g'), '')
    .replace(/nadia/gi, '')
    .trim();
}
