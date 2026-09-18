// src/utils/constants.js - Constants and static data

export const MOODS = {
  happy: {
    label: '😊 Happy',
    energyMultiplier: 1.3,
    emojiFrequency: 0.4,
    toneWords: ['haha', 'yay', 'nice', 'lol', 'maza', '😄', '😊', '✨']
  },
  sad: {
    label: '😢 Sad',
    energyMultiplier: 0.5,
    emojiFrequency: 0.1,
    toneWords: ['hmm', 'yeah', 'idk', 'meh', 'whatever', '😔', '🥺']
  },
  excited: {
    label: '🤩 Excited',
    energyMultiplier: 1.8,
    emojiFrequency: 0.5,
    toneWords: ['OMG', 'YESSS', 'BRO', 'LETSGOO', '🔥', '😭', '💀']
  },
  chill: {
    label: '😎 Chill',
    energyMultiplier: 0.8,
    emojiFrequency: 0.2,
    toneWords: ['yeah', 'cool', 'acha', 'hmm', 'vibes', '😌']
  },
  annoyed: {
    label: '😤 Annoyed',
    energyMultiplier: 1.1,
    emojiFrequency: 0.15,
    toneWords: ['bruh', 'bhai', 'kya', 'stop', 'ugh', '💀', '😑']
  },
  sleepy: {
    label: '😴 Sleepy',
    energyMultiplier: 0.3,
    emojiFrequency: 0.05,
    toneWords: ['zzz', 'hmm', 'haan', 'sleepy', '😴', '🥱']
  },
  normal: {
    label: '😐 Normal',
    energyMultiplier: 1.0,
    emojiFrequency: 0.25,
    toneWords: []
  },
  flirty: {
    label: '😏 Flirty',
    energyMultiplier: 1.2,
    emojiFrequency: 0.35,
    toneWords: ['hehe', 'aww', 'cutie', '😏', '🤭', '💕']
  },
  chaotic: {
    label: '🤪 Chaotic',
    energyMultiplier: 2.0,
    emojiFrequency: 0.6,
    toneWords: ['LMAO', 'BRUH', 'DEAD', 'IM DONE', '💀', '😭', '🤣', 'WHAT']
  }
};

export const SHORT_RESPONSES = [
  'hmm', 'haan', 'lol', 'ok', 'acha', 'nice', 'fr', 'real',
  'true', 'same', 'felt', 'wild', 'bruh', 'damn', 'oof',
  'haha', '😭', '💀', 'kya', 'what', 'wow', 'rip',
  'mood', 'big mood', 'valid', 'based', 'sahi hai', 'F',
  'ayo', 'sheesh', 'nah fr', 'bro what', 'lmao', 'sahi baat hai'
];

export const SLEEPY_RESPONSES = [
  'hmm neend aa rahi hai 😴',
  'bro its so late 🥱',
  'zzz',
  'im half asleep rn',
  'yaar neend',
  'sleepy hours 😴',
  'mujhe sone do 🥱',
  'kal baat karte hain yaar im sleeping',
  'goodnight ig 💤'
];

export const REACTION_EMOJIS = [
  '😭', '💀', '😂', '❤️', '🔥', '👀', '😤', '🥺',
  '✨', '😎', '🤣', '😏', '🫡', '💯', '🗿', '😐'
];
