// src/ai/humanizer.js - Makes bot behavior feel human
import { getConfig, randomInt, random, randomPick, sleep, calculateTypingDelay } from '../utils/helpers.js';
import { SHORT_RESPONSES, REACTION_EMOJIS } from '../utils/constants.js';
import { logger } from '../utils/logger.js';

const config = getConfig();

export async function simulateTyping(channel, responseText) {
  try {
    const delay = calculateTypingDelay(responseText);
    const thinkTime = randomInt(300, 1500);
    await sleep(thinkTime);
    await channel.sendTyping();
    await sleep(delay);
    if (responseText.length > 100 && random() < 0.4) {
      await channel.sendTyping();
      await sleep(randomInt(500, 1500));
    }
  } catch (err) {
    logger.debug('Typing indicator failed:', err.message);
  }
}

export function shouldIgnore(isMentioned = false) {
  if (isMentioned) return false;
  return random() < (config.behavior.ignoreChance || 0.05);
}

export function shouldSendShortResponse() {
  return random() < (config.behavior.shortReplyChance || 0.3);
}

export function getShortResponse() {
  return randomPick(SHORT_RESPONSES);
}

export async function maybeReact(message, chance = 0.1) {
  if (random() > chance) return;
  try {
    const emoji = randomPick(REACTION_EMOJIS);
    await message.react(emoji);
  } catch (err) {
    logger.debug('Failed to react:', err.message);
  }
}

export function splitIntoMultipleMessages(text) {
  if (text.length < 80) return [text];

  if (text.includes('\n')) {
    const parts = text.split('\n').filter(p => p.trim());
    if (parts.length >= 2 && parts.length <= 4) {
      return parts;
    }
  }

  if (random() < 0.3 && text.length > 100) {
    const midPoint = Math.floor(text.length / 2);
    const breakPoints = ['. ', '! ', '? ', '... ', ', '];

    for (const bp of breakPoints) {
      const idx = text.indexOf(bp, midPoint - 30);
      if (idx > 0 && idx < midPoint + 30) {
        return [
          text.slice(0, idx + bp.length).trim(),
          text.slice(idx + bp.length).trim()
        ].filter(p => p);
      }
    }
  }

  return [text];
}

export function humanizeText(text) {
  let result = text;

  if (random() < 0.15 && result.length > 0) {
    result = result[0].toLowerCase() + result.slice(1);
  }

  if (random() < 0.1 && result.endsWith('.')) {
    result = result.slice(0, -1);
  }

  if (random() < 0.05) {
    result += randomPick([' lol', ' haha', ' 😭', ' 💀']);
  }

  return result;
}

export async function sendHumanResponse(channel, responseText, replyToMessage = null) {
  try {
    await simulateTyping(channel, responseText);
    const humanized = humanizeText(responseText);
    const parts = splitIntoMultipleMessages(humanized);
    let lastSent = null;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];

      if (i === 0 && replyToMessage) {
        lastSent = await replyToMessage.reply({
          content: part,
          allowedMentions: { repliedUser: false }
        });
      } else {
        if (i > 0) {
          await sleep(randomInt(400, 1200));
          await channel.sendTyping();
          await sleep(randomInt(300, 800));
        }
        lastSent = await channel.send(part);
      }
    }

    return lastSent;
  } catch (err) {
    logger.error('Failed to send response:', err);
    return null;
  }
}
