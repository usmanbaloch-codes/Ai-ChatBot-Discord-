// src/commands/talklevel.js - Talk level command handler
import { EmbedBuilder } from 'discord.js';
import { getServerSettings, updateServerSettings } from '../memory/database.js';
import { getConfig } from '../utils/helpers.js';

const config = getConfig();

export async function handleTalkLevelCommand(interaction) {
  const guildId = interaction.guild.id;
  const level = interaction.options.getInteger('level');

  updateServerSettings(guildId, { talk_level: level });

  const descriptions = {
    1: '🤫 barely talking - almost silent',
    2: '😶 very quiet - rarely speaks up',
    3: '🤐 quiet - speaks when spoken to mostly',
    4: '😊 slightly reserved',
    5: '😄 normal - balanced participation',
    6: '😁 talkative - joins convos more often',
    7: '🗣️ chatty - loves to participate',
    8: '😆 very chatty - hard to keep quiet',
    9: '🤩 extremely talkative - always has something to say',
    10: '🤪 maximum chaos - never shuts up lol'
  };

  const embed = new EmbedBuilder()
    .setTitle(`🔊 Talk Level Set!`)
    .setDescription(`${config.bot.name}'s talk level: **${level}/10**\n${descriptions[level]}`)
    .setColor(0x3498DB)
    .setFooter({ text: 'this affects how often she jumps into conversations' });

  await interaction.reply({ embeds: [embed] });
}
