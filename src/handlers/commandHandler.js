// src/handlers/messageHandler.js - Main message processing
import { generateResponse, analyzeMessageSentiment } from '../ai/engine.js';
import { sendHumanResponse, shouldIgnore, maybeReact } from '../ai/humanizer.js';
import { rememberMessage } from '../memory/shortTermMemory.js';
import { recordInteraction } from '../memory/relationshipManager.js';
import { rememberLongTerm, MEMORY_TYPES } from '../memory/longTermMemory.js';
import { shouldPassivelyRespond, isInterestingMessage } from '../systems/passiveChat.js';
import { isSleeping, isSleepy, getSleepyResponse } from '../systems/sleepMode.js';
import { maybeShiftMood } from '../systems/moodSystem.js';
import { detectTone, shouldAvoidMessage } from '../systems/toneDetector.js';
import { isRateLimited, recordInteraction as recordRateInteraction, isMentionCooldown, setMentionCooldown } from '../systems/cooldownManager.js';
import { isBotMentioned, stripMention, isChannelAllowed, getConfig, random } from '../utils/helpers.js';
import { getChannelSettings, addShortTermMemory } from '../memory/database.js';
import { logger } from '../utils/logger.js';

const config = getConfig();

export async function handleMessage(message, client) {
  try {
    if (message.author.id === client.user.id) return;
    if (message.author.bot) return;
    if (!message.guild) return;
    if (!isChannelAllowed(message.channel.id)) return;

    const channelSettings = getChannelSettings(message.channel.id);
    if (channelSettings && !channelSettings.enabled) return;

    const username = message.member?.displayName || message.author.username;
    rememberMessage(
      message.guild.id,
      message.channel.id,
      message.author.id,
      username,
      message.content,
      false
    );

    const mentioned = isBotMentioned(message, client);

    if (mentioned) {
      await handleMention(message, client, username);
    } else {
      await handlePassive(message, client, username);
    }

  } catch (error) {
    logger.error('Message handler error:', error);
  }
}

async function handleMention(message, client, username) {
  const guildId = message.guild.id;
  const channelId = message.channel.id;

  if (isMentionCooldown(channelId)) {
    logger.debug('Mention cooldown active, skipping');
    return;
  }

  if (isRateLimited(message.author.id)) {
    if (random() < 0.3) {
      await sendHumanResponse(message.channel, 'bro chill 😭 itna spam mat karo', message);
    }
    return;
  }

  recordRateInteraction(message.author.id);
  setMentionCooldown(channelId);

  if (shouldAvoidMessage(message.content)) {
    await sendHumanResponse(
      message.channel,
      'yaar this is something you should talk to someone you trust about. please take care of yourself ❤️',
      message
    );
    return;
  }

  if (isSleeping()) {
    if (random() < 0.7) return;
    const sleepyResponse = getSleepyResponse();
    await sendHumanResponse(message.channel, sleepyResponse, message);
    return;
  }

  if (isSleepy() && random() < 0.3) {
    const sleepyResponse = getSleepyResponse();
    await sendHumanResponse(message.channel, sleepyResponse, message);
    return;
  }

  const cleanContent = stripMention(message.content, client.user.id);

  if (!cleanContent || cleanContent.length === 0) {
    const emptyResponses = ['haan?', 'kya', 'hmm?', 'bolo', 'haan bolo', '?', 'what', 'ji?'];
    const response = emptyResponses[Math.floor(Math.random() * emptyResponses.length)];
    await sendHumanResponse(message.channel, response, message);
    return;
  }

  const sentiment = await analyzeMessageSentiment(cleanContent);
  recordInteraction(guildId, message.author.id, username, sentiment);
  maybeShiftMood(guildId, sentiment);

  const response = await generateResponse({
    message,
    content: cleanContent,
    isPassive: false
  });

  const sent = await sendHumanResponse(message.channel, response, message);

  if (sent) {
    rememberMessage(
      guildId,
      channelId,
      client.user.id,
      config.bot.name,
      response,
      true
    );
  }

  await maybeReact(message, 0.15);

  logger.chat(message.guild.name, username, `[MENTION] ${cleanContent}`);
  logger.chat(message.guild.name, config.bot.name, `[REPLY] ${response}`);
}

async function handlePassive(message, client, username) {
  if (!isInterestingMessage(message.content)) return;

  if (!shouldPassivelyRespond(message)) {
    await maybeReact(message, 0.03);
    return;
  }

  if (shouldIgnore(false)) return;
  if (isRateLimited(message.author.id)) return;
  if (shouldAvoidMessage(message.content)) return;

  recordRateInteraction(message.author.id);

  const response = await generateResponse({
    message,
    content: message.content,
    isPassive: true
  });

  const shouldReply = random() < 0.6;

  const sent = await sendHumanResponse(
    message.channel,
    response,
    shouldReply ? message : null
  );

  if (sent) {
    rememberMessage(
      message.guild.id,
      message.channel.id,
      client.user.id,
      config.bot.name,
      response,
      true
    );
  }

  logger.chat(message.guild.name, username, `[PASSIVE TRIGGER] ${message.content}`);
  logger.chat(message.guild.name, config.bot.name, `[PASSIVE REPLY] ${response}`);
}
