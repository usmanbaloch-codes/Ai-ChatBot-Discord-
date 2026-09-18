// index.js - Entry point for Nadia Bot
import dotenv from 'dotenv';
dotenv.config();

import { createClient } from './src/client.js';
import { initDatabase } from './src/memory/database.js';
import { registerCommands } from './src/handlers/commandHandler.js';
import { setupEventHandler } from './src/handlers/eventHandler.js';
import { logger } from './src/utils/logger.js';

async function main() {
  try {
    logger.info('☀️  Nadia is waking up...');

    // Initialize database
    await initDatabase();
    logger.info('💾 Database initialized');

    // Create Discord client
    const client = createClient();

    // Register slash commands
    await registerCommands();
    logger.info('📝 Slash commands registered');

    // Setup all event handlers
    setupEventHandler(client);
    logger.info('🎧 Event handlers ready');

    // Login to Discord
    await client.login(process.env.DISCORD_TOKEN);
    logger.info('🔐 Logged into Discord');

  } catch (error) {
    logger.error('Fatal startup error:', error);
    process.exit(1);
  }
}

main();
