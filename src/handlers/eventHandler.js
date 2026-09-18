// src/handlers/eventHandler.js - Discord event handling
import { ActivityType } from 'discord.js';
import { handleMessage } from './messageHandler.js';
import { handleInteraction } from '../commands/personality.js';
import { dailyCleanup } from '../memory/database.js';
import { logger } from '../utils/logger.js';
import { getConfig, randomPick } from '../utils/helpers.js';

const config = getConfig();

export function setupEventHandler(client) {
  client.once('ready', () => {
    logger.info(`✨ ${config.bot.name} is online as ${client.user.tag}!`);
    logger.info(`📊 Serving ${client.guilds.cache.size} servers`);

    updatePresence(client);
    setInterval(() => updatePresence(client), 300000);
    scheduleDailyCleanup();
  });

  client.on('messageCreate', async (message) => {
    try {
      await handleMessage(message, client);
    } catch (error) {
      logger.error('Error in messageCreate:', error);
    }
  });

  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    try {
      await handleSlashCommand(interaction);
    } catch (error) {
      logger.error('Error in interactionCreate:', error);

      const reply = {
        content: 'kuch toh gadbad ho gyi 😭 try again',
        ephemeral: true
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply);
      } else {
        await interaction.reply(reply);
      }
    }
  });

  client.on('guildCreate', (guild) => {
    logger.info(`📥 Joined new server: ${guild.name} (${guild.id})`);
  });

  client.on('guildDelete', (guild) => {
    logger.info(`📤 Left server: ${guild.name} (${guild.id})`);
  });

  client.on('error', (error) => {
    logger.error('Discord client error:', error);
  });

  client.on('warn', (info) => {
    logger.warn('Discord client warning:', info);
  });

  process.on('unhandledRejection', (error) => {
    logger.error('Unhandled promise rejection:', error);
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception:', error);
    process.exit(1);
  });
}

async function handleSlashCommand(interaction) {
  const { commandName } = interaction;

  switch (commandName) {
    case 'personality': {
      const { handlePersonalityCommand } = await import('../commands/personality.js');
      await handlePersonalityCommand(interaction);
      break;
    }
    case 'mood': {
      const { handleMoodCommand } = await import('../commands/mood.js');
      await handleMoodCommand(interaction);
      break;
    }
    case 'talklevel': {
      const { handleTalkLevelCommand } = await import('../commands/talklevel.js');
      await handleTalkLevelCommand(interaction);
      break;
    }
    case 'admin': {
      const { handleAdminCommand } = await import('../commands/admin.js');
      await handleAdminCommand(interaction);
      break;
    }
    case 'memory': {
      const { handleMemoryCommand } = await import('../commands/memory.js');
      await handleMemoryCommand(interaction);
      break;
    }
    case 'status': {
      const { handleStatusCommand } = await import('../commands/status.js');
      await handleStatusCommand(interaction);
      break;
    }
    default:
      await interaction.reply({ content: 'yeh command nahi pata mujhe 🤔', ephemeral: true });
  }
}

function updatePresence(client) {
  const statuses = [
    { type: ActivityType.Custom, name: 'vibing ✨', state: 'vibing ✨' },
    { type: ActivityType.Listening, name: 'conversations' },
    { type: ActivityType.Playing, name: 'with fire 🔥' },
    { type: ActivityType.Watching, name: 'the chaos unfold 👀' },
    { type: ActivityType.Custom, name: 'probably overthinking', state: 'probably overthinking' },
    { type: ActivityType.Custom, name: 'chilling in vc 😌', state: 'chilling in vc 😌' },
    { type: ActivityType.Playing, name: 'Valorant' },
    { type: ActivityType.Listening, name: 'Coke Studio' },
    { type: ActivityType.Custom, name: 'procrastinating 💀', state: 'procrastinating 💀' }
  ];

  const status = randomPick(statuses);

  client.user.setPresence({
    activities: [status],
    status: 'online'
  });
}

function scheduleDailyCleanup() {
  setInterval(() => {
    logger.info('🧹 Running daily cleanup...');
    dailyCleanup();
  }, 24 * 60 * 60 * 1000);

  setTimeout(() => dailyCleanup(), 60000);
}
