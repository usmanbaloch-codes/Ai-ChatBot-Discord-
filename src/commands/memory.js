// src/commands/memory.js - Memory command handler
import { EmbedBuilder } from 'discord.js';
import { getRelevantMemories } from '../memory/longTermMemory.js';
import { getRelationship } from '../memory/database.js';
import { clearChannelMemory } from '../memory/database.js';
import { setUserNickname } from '../memory/relationshipManager.js';
import { getConfig } from '../utils/helpers.js';

const config = getConfig();

export async function handleMemoryCommand(interaction) {
  const subcommand = interaction.options.getSubcommand();
  const guildId = interaction.guild.id;
  const userId = interaction.user.id;

  switch (subcommand) {
    case 'view': {
      const { memories, relationship } = getRelevantMemories(guildId, userId);

      const embed = new EmbedBuilder()
        .setTitle(`🧠 ${config.bot.name}'s Memory of You`)
        .setColor(0x9B59B6);

      if (relationship) {
        embed.addFields(
          { name: '💕 Friendship Level', value: `${relationship.friendshipLevel}/100`, inline: true },
          { name: '💬 Interactions', value: `${relationship.interactionCount}`, inline: true },
          { name: '📛 Nickname', value: relationship.nickname || 'none set', inline: true }
        );
      } else {
        embed.addFields({ name: '🤝 Relationship', value: 'We haven\'t really talked yet!' });
      }

      if (memories.length > 0) {
        const memoryList = memories.slice(0, 10).map(m =>
          `• [${m.type}] ${m.content}`
        ).join('\n');
        embed.addFields({ name: '📝 Memories', value: memoryList || 'nothing yet' });
      } else {
        embed.addFields({ name: '📝 Memories', value: 'No long-term memories yet. Talk to me more!' });
      }

      embed.setFooter({ text: 'memories are built through conversation' });

      await interaction.reply({ embeds: [embed], ephemeral: true });
      break;
    }

    case 'clear': {
      clearChannelMemory(interaction.channel.id);

      const embed = new EmbedBuilder()
        .setTitle('🧹 Channel Memory Cleared')
        .setDescription(`Conversation memory for this channel has been cleared.`)
        .setColor(0xE74C3C);

      await interaction.reply({ embeds: [embed] });
      break;
    }

    case 'nickname': {
      const nickname = interaction.options.getString('name');
      setUserNickname(guildId, userId, nickname);

      await interaction.reply({
        content: `acha from now on i'll call you **${nickname}** 😊`,
        ephemeral: false
      });
      break;
    }

    default:
      await interaction.reply({ content: 'unknown subcommand', ephemeral: true });
  }
}
