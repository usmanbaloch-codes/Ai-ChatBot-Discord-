// src/commands/status.js - Status command handler
import { EmbedBuilder } from 'discord.js';
import { getServerSettings, getDB } from '../memory/database.js';
import { getPersonality } from '../ai/personalities.js';
import { getMoodData } from '../systems/moodSystem.js';
import { getSleepStatus } from '../systems/sleepMode.js';
import { getServerTopFriends } from '../memory/relationshipManager.js';
import { getConfig } from '../utils/helpers.js';

const config = getConfig();

export async function handleStatusCommand(interaction) {
  const guildId = interaction.guild.id;
  const settings = getServerSettings(guildId);
  const personality = getPersonality(settings.personality);
  const moodData = getMoodData(settings.mood);
  const sleepStatus = getSleepStatus();
  const topFriends = getServerTopFriends(guildId);

  const db = getDB();
  const messageCount = db.prepare(
    'SELECT COUNT(*) as count FROM short_term_memory WHERE guild_id = ?'
  ).get(guildId);

  const memoryCount = db.prepare(
    'SELECT COUNT(*) as count FROM long_term_memory WHERE guild_id = ?'
  ).get(guildId);

  const embed = new EmbedBuilder()
    .setTitle(`✨ ${config.bot.name}'s Status`)
    .setThumbnail(interaction.client.user.displayAvatarURL())
    .setColor(0x9B59B6)
    .addFields(
      { name: '🎭 Personality', value: personality.name, inline: true },
      { name: '😊 Mood', value: moodData.label, inline: true },
      { name: '🔊 Talk Level', value: `${settings.talk_level}/10`, inline: true },
      { name: '💬 Passive Chat', value: settings.passive_chat ? '✅ On' : '❌ Off', inline: true },
      { name: '🎲 Reply Chance', value: `${Math.round((settings.passive_chance || 0.08) * 100)}%`, inline: true },
      { name: '😴 Sleep Status', value: sleepStatus.message, inline: true },
      { name: '💾 Messages Stored', value: `${messageCount.count}`, inline: true },
      { name: '🧠 Long-term Memories', value: `${memoryCount.count}`, inline: true },
      { name: '🌐 Servers', value: `${interaction.client.guilds.cache.size}`, inline: true }
    );

  if (topFriends.length > 0) {
    const friendsList = topFriends.slice(0, 5).map((f, i) =>
      `${i + 1}. **${f.username}** (❤️ ${f.friendship_level})`
    ).join('\n');
    embed.addFields({ name: '💕 Top Friends', value: friendsList });
  }

  embed.setFooter({
    text: `AI: ${process.env.AI_PROVIDER || 'claude'} | Uptime: ${formatUptime(interaction.client.uptime)}`
  });

  await interaction.reply({ embeds: [embed] });
}

function formatUptime(ms) {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
}
