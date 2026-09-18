// src/systems/sleepMode.js - Sleep/wake cycle
import { getConfig, randomPick } from '../utils/helpers.js';
import { SLEEPY_RESPONSES } from '../utils/constants.js';
import { logger } from '../utils/logger.js';

const config = getConfig();

export function isSleeping() {
  if (!config.sleep.enabled) return false;

  const now = new Date();
  const pkTime = new Date(now.toLocaleString('en-US', { timeZone: config.sleep.timezone || 'Asia/Karachi' }));
  const hour = pkTime.getHours();

  const sleepHour = config.sleep.sleepHour || 2;
  const wakeHour = config.sleep.wakeHour || 8;

  if (sleepHour < wakeHour) {
    return hour >= sleepHour && hour < wakeHour;
  } else {
    return hour >= sleepHour || hour < wakeHour;
  }
}

export function isSleepy() {
  if (!config.sleep.enabled) return false;

  const now = new Date();
  const pkTime = new Date(now.toLocaleString('en-US', { timeZone: config.sleep.timezone || 'Asia/Karachi' }));
  const hour = pkTime.getHours();

  const sleepHour = config.sleep.sleepHour || 2;
  const preSleeHour = (sleepHour - 1 + 24) % 24;

  return hour === preSleeHour;
}

export function getSleepyResponse() {
  return randomPick(SLEEPY_RESPONSES);
}

export function getSleepStatus() {
  if (isSleeping()) {
    return { status: 'sleeping', message: 'zzz 😴 (will wake up later)' };
  }
  if (isSleepy()) {
    return { status: 'sleepy', message: 'getting sleepy 🥱' };
  }
  return { status: 'awake', message: 'wide awake ✨' };
}
