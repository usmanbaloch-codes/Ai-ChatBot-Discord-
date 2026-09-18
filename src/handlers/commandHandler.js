// src/handlers/commandHandler.js - Slash command registration
import {
  ChannelType,
  PermissionFlagsBits,
  REST,
  Routes,
  SlashCommandBuilder
} from 'discord.js';
import { getPersonalityList } from '../ai/personalities.js';
import { getAvailableMoods } from '../systems/moodSystem.js';
import { logger } from '../utils/logger.js';

function buildCommands() {
  const personalityChoices = getPersonalityList()
    .slice(0, 25)
    .map(p => ({ name: p.name, value: p.key }));

  const moodChoices = getAvailableMoods()
    .slice(0, 25)
    .map(m => ({ name: m.label, value: m.key }));

  return [
    new SlashCommandBuilder()
      .setName('personality')
      .setDescription('Change Nadia\'s personality')
      .addStringOption(option =>
        option
          .setName('type')
          .setDescription('Choose a personality')
          .setRequired(true)
          .addChoices(...personalityChoices)
      ),

    new SlashCommandBuilder()
      .setName('mood')
      .setDescription('View or change Nadia\'s mood')
      .addStringOption(option =>
        option
          .setName('set')
          .setDescription('Set a new mood')
          .setRequired(false)
          .addChoices(...moodChoices)
      ),

    new SlashCommandBuilder()
      .setName('talklevel')
      .setDescription('Set how talkative Nadia is')
      .addIntegerOption(option =>
        option
          .setName('level')
          .setDescription('Talk level from 1 to 10')
          .setRequired(true)
          .setMinValue(1)
          .setMaxValue(10)
      ),

    new SlashCommandBuilder()
      .setName('admin')
      .setDescription('Admin controls for Nadia')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
      .addSubcommand(sub =>
        sub
          .setName('passive')
          .setDescription('Enable or disable passive chat')
          .addBooleanOption(option =>
            option
              .setName('enabled')
              .setDescription('Whether passive chat is enabled')
              .setRequired(true)
          )
      )
      .addSubcommand(sub =>
        sub
          .setName('channel')
          .setDescription('Enable or disable Nadia in a channel')
          .addChannelOption(option =>
            option
              .setName('target')
              .setDescription('Channel to configure')
              .setRequired(true)
              .addChannelTypes(
                ChannelType.GuildText,
                ChannelType.GuildAnnouncement,
                ChannelType.PublicThread,
                ChannelType.PrivateThread,
                ChannelType.AnnouncementThread
              )
          )
          .addBooleanOption(option =>
            option
              .setName('enabled')
              .setDescription('Whether Nadia is enabled there')
              .setRequired(true)
          )
      )
      .addSubcommand(sub =>
        sub
          .setName('reset')
          .setDescription('Clear Nadia\'s stored memory for this server')
      )
      .addSubcommand(sub =>
        sub
          .setName('passivechance')
          .setDescription('Set passive reply probability')
          .addNumberOption(option =>
            option
              .setName('chance')
              .setDescription('Value from 0 to 1, e.g. 0.08 = 8%')
              .setRequired(true)
              .setMinValue(0)
              .setMaxValue(1)
          )
      ),

    new SlashCommandBuilder()
      .setName('memory')
      .setDescription('Manage Nadia\'s memory')
      .addSubcommand(sub =>
        sub
          .setName('view')
          .setDescription('See what Nadia remembers about you')
      )
      .addSubcommand(sub =>
        sub
          .setName('clear')
          .setDescription('Clear short-term memory for this channel')
      )
      .addSubcommand(sub =>
        sub
          .setName('nickname')
          .setDescription('Set what Nadia should call you')
          .addStringOption(option =>
            option
              .setName('name')
              .setDescription('Nickname')
              .setRequired(true)
              .setMaxLength(32)
          )
      ),

    new SlashCommandBuilder()
      .setName('status')
      .setDescription('Show Nadia\'s current status and settings')
  ].map(command => command.toJSON());
}

export async function registerCommands() {
  const token = process.env.DISCORD_TOKEN;
  const clientId = process.env.DISCORD_CLIENT_ID;

  if (!token) {
    throw new Error('DISCORD_TOKEN is missing from .env');
  }

  if (!clientId) {
    throw new Error('DISCORD_CLIENT_ID is missing from .env');
  }

  const commands = buildCommands();
  const rest = new REST({ version: '10' }).setToken(token);

  logger.info(`📝 Registering ${commands.length} slash commands...`);
  await rest.put(
    Routes.applicationCommands(clientId),
    { body: commands }
  );

  logger.info('✅ Slash commands registered globally');
}
