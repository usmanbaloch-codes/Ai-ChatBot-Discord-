// src/client.js - Discord client setup
import { Client, GatewayIntentBits, Partials } from 'discord.js';

export function createClient() {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.GuildPresences
    ],
    partials: [
      Partials.Message,
      Partials.Channel,
      Partials.Reaction
    ],
    // Make the bot appear more human - no caching everything
    sweepers: {
      messages: {
        interval: 300,
        lifetime: 600
      }
    }
  });

  return client;
}
