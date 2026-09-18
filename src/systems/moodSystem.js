// src/systems/moodSystem.js - Dynamic mood system
import { getServerSettings, updateServerSettings, getDB } from '../memory/database.js';
import { MOODS } from '../utils/constants.js';
import { random, randomPick } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';

export function getMood(guildId) {
  const settings = getServerSettings(guildId);
  return settings.mood || 'normal';
}

export function setMood(guildId, mood, reason = null) {
  if (!MOODS[mood]) {
    throw new Error(`Invalid mood: ${mood}. Valid moods: ${Object.keys(MOODS).join(', ')}`);
  }

  updateServerSettings(guildId, { mood });

  const db = getDB();
  db.prepare(`
    INSERT INTO mood_history (guild_id, mood, reason) VALUES (?, ?, ?)
  `).run(guildId, mood, reason);

  logger.info(`🎭 Mood changed to ${MOODS[mood].label} for guild ${guildId}: ${reason || 'no reason'}`);
}

export function maybeShiftMood(guildId, sentiment) {
  if (random() > 0.1) return;

  const currentMood = getMood(guildId);

  const moodShifts = {
    very_positive: ['happy', 'excited', 'flirty'],
    positive: ['happy', 'chill', 'normal'],
    neutral: ['normal', 'chill'],
    negative: ['annoyed', 'sad', 'normal'],
    very_negative: ['annoyed', 'sad']
  };

  const possibleMoods = moodShifts[sentiment] || ['normal'];
  const newMood = randomPick(possibleMoods);

  if (newMood !== currentMood) {
    setMood(guildId, newMood, `Natural shift from ${sentiment} conversation`);
  }
}

export function getMoodData(mood) {
  return MOODS[mood] || MOODS.normal;
}

export function getAvailableMoods() {
  return Object.entries(MOODS).map(([key, data]) => ({
    key,
    label: data.label
  }));
}
