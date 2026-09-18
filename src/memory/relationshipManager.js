// src/memory/relationshipManager.js - Friendship/relationship tracking
import {
  updateRelationship,
  getRelationship,
  setNickname as dbSetNickname,
  getTopFriends
} from './database.js';
import { logger } from '../utils/logger.js';

export function recordInteraction(guildId, userId, username, sentiment = 'neutral') {
  let delta = 1;

  switch (sentiment) {
    case 'very_positive':
      delta = 3;
      break;
    case 'positive':
      delta = 2;
      break;
    case 'neutral':
      delta = 1;
      break;
    case 'negative':
      delta = -1;
      break;
    case 'very_negative':
      delta = -3;
      break;
  }

  updateRelationship(guildId, userId, username, delta);
}

export function getFriendshipDescription(guildId, userId) {
  const rel = getRelationship(guildId, userId);
  if (!rel) return 'stranger';

  const level = rel.friendship_level;
  if (level >= 80) return 'bestie';
  if (level >= 60) return 'close_friend';
  if (level >= 40) return 'friend';
  if (level >= 20) return 'acquaintance';
  if (level >= 5) return 'new_face';
  if (level <= -5) return 'disliked';
  return 'stranger';
}

export function setUserNickname(guildId, userId, nickname) {
  dbSetNickname(guildId, userId, nickname);
}

export function getServerTopFriends(guildId) {
  return getTopFriends(guildId, 10);
}
