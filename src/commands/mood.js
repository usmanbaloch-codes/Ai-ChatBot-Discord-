// src/commands/mood.js - Mood command handler
import { EmbedBuilder } from 'discord.js';
import { getMood, setMood, getAvailableMoods, getMoodData } from '../systems/moodSystem.js';
import { getConfig } from '../utils/helpers.js';

const config = getConfig();

export async function handleMoodCommand(interaction) {
  const guildId = interaction.guild.id;
  const newMood = interaction.options.getString('set');

  if (newMood) {
    setMood(guildId, newMood, `Set by ${interaction.user.username}`);

    const moodData = getMoodData(newMood);

    const embed = new EmbedBuilder()
      .setTitle(`${moodData.label} Mood Changed!`)
      .setDescription(`${config.bot.name} is now feeling **${moodData.label}**`)
      .addFields(
        { name: 'Energy', value: `${moodData.energyMultiplier}x`, inline: true },
        { name: 'Emoji Usage', value: `${Math.round(moodData.emojiFrequency * 100)}%`, inline: true }
      )
      .setColor(0xE91E63);

    await interaction.reply({ embeds: [embed] });
  } else {
    const currentMood = getMood(guildId);
    const moodData = getMoodData(currentMood);
    const allMoods = getAvailableMoods();

    const embed = new EmbedBuilder()
      .setTitle(`${config.bot.name}'s Current Mood`)
      .setDescription(`Currently feeling: **${moodData.label}**`)
      .addFields({
        name: 'Available Moods',
        value: allMoods.map(m => m.label).join(' | ')
      })
      .setColor(0xE91E63)
      .setFooter({ text: 'use /mood set:<mood> to change' });

    await interaction.reply({ embeds: [embed] });
  }
}
