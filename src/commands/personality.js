// src/commands/personality.js - Personality command handler
import { EmbedBuilder } from 'discord.js';
import { getServerSettings, updateServerSettings } from '../memory/database.js';
import { getPersonality, getPersonalityList } from '../ai/personalities.js';
import { logger } from '../utils/logger.js';
import { getConfig } from '../utils/helpers.js';

const config = getConfig();

export async function handlePersonalityCommand(interaction) {
  const guildId = interaction.guild.id;
  const personalityKey = interaction.options.getString('type');

  const personality = getPersonality(personalityKey);

  updateServerSettings(guildId, { personality: personalityKey });

  const embed = new EmbedBuilder()
    .setTitle(`🎭 Personality Changed!`)
    .setDescription(`${config.bot.name} is now: **${personality.name}**`)
    .addFields(
      { name: 'Description', value: personality.description },
      { name: 'Energy', value: personality.energy, inline: true },
      { name: 'Formality', value: personality.formality, inline: true },
      { name: 'Urdu Mix', value: `${Math.round(personality.urduRatio * 100)}%`, inline: true }
    )
    .setColor(0x9B59B6)
    .setFooter({ text: 'personality will apply to all messages in this server' });

  await interaction.reply({ embeds: [embed] });

  logger.info(`🎭 Personality changed to ${personalityKey} in ${interaction.guild.name}`);
}
