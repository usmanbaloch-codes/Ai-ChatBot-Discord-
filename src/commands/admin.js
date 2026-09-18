// src/commands/admin.js - Admin command handler
import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import {
  updateServerSettings,
  getServerSettings,
  setChannelEnabled,
  clearChannelMemory,
  getDB
} from '../memory/database.js';
import { logger } from '../utils/logger.js';
import { getConfig } from '../utils/helpers.js';

const config = getConfig();

export async function handleAdminCommand(interaction) {
  if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
    await interaction.reply({
      content: 'bro tere paas permission nahi hai 💀',
      ephemeral: true
    });
    return;
  }

  const subcommand = interaction.options.getSubcommand();
  const guildId = interaction.guild.id;

  switch (subcommand) {
    case 'passive': {
      const enabled = interaction.options.getBoolean('enabled');
      updateServerSettings(guildId, { passive_chat: enabled ? 1 : 0 });

      const embed = new EmbedBuilder()
        .setTitle('💬 Passive Chat')
        .setDescription(`Passive chatting is now **${enabled ? 'ENABLED ✅' : 'DISABLED ❌'}**`)
        .setColor(enabled ? 0x2ECC71 : 0xE74C3C);

      await interaction.reply({ embeds: [embed] });
      break;
    }

    case 'channel': {
      const channel = interaction.options.getChannel('target');
      const enabled = interaction.options.getBoolean('enabled');

      setChannelEnabled(channel.id, guildId, enabled);

      const embed = new EmbedBuilder()
        .setTitle('📺 Channel Settings')
        .setDescription(`${config.bot.name} is now **${enabled ? 'ENABLED ✅' : 'DISABLED ❌'}** in <#${channel.id}>`)
        .setColor(enabled ? 0x2ECC71 : 0xE74C3C);

      await interaction.reply({ embeds: [embed] });
      break;
    }

    case 'reset': {
      const db = getDB();

      db.prepare('DELETE FROM short_term_memory WHERE guild_id = ?').run(guildId);
      db.prepare('DELETE FROM long_term_memory WHERE guild_id = ?').run(guildId);
      db.prepare('DELETE FROM relationships WHERE guild_id = ?').run(guildId);
      db.prepare('DELETE FROM mood_history WHERE guild_id = ?').run(guildId);

      const embed = new EmbedBuilder()
        .setTitle('🗑️ Memory Reset')
        .setDescription(`All of ${config.bot.name}'s memories for this server have been erased.`)
        .setColor(0xE74C3C)
        .setFooter({ text: 'she won\'t remember anything from before' });

      await interaction.reply({ embeds: [embed] });
      logger.info(`🗑️ Memory reset for guild ${guildId}`);
      break;
    }

    case 'passivechance': {
      const chance = interaction.options.getNumber('chance');
      updateServerSettings(guildId, { passive_chance: chance });

      const embed = new EmbedBuilder()
        .setTitle('🎲 Passive Reply Chance')
        .setDescription(`Passive reply chance set to **${Math.round(chance * 100)}%**`)
        .setColor(0xF39C12);

      await interaction.reply({ embeds: [embed] });
      break;
    }

    default:
      await interaction.reply({ content: 'unknown subcommand', ephemeral: true });
  }
}
