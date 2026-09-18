# AI ChatBot (Discord) — NADIA

**NADIA** is a multipurpose AI Discord chatbot built with Node.js and `discord.js`. It supports natural conversations, English + Roman Urdu, configurable personalities and moods, long/short-term memory, passive chat, relationship tracking, sleep mode, cooldowns, and server admin controls.

## Features

- Natural AI conversations in English and Roman Urdu
- Multiple personalities and moods
- Short-term and long-term memory
- User relationship / friendship tracking
- Passive replies without requiring a mention
- Tone detection and human-like reply delays
- Sleep / wake behavior with configurable timezone
- Slash commands for mood, personality, memory, status and admin controls
- Groq, Google Gemini, or local Ollama support
- SQLite-based local memory storage

## Tech stack

- Node.js 18+
- discord.js 14
- better-sqlite3
- Groq SDK
- Google Generative AI SDK
- Ollama
- dotenv

## Project structure

```text
.
├── index.js
├── config.json
├── package.json
├── src/
│   ├── ai/
│   ├── commands/
│   ├── handlers/
│   ├── memory/
│   ├── systems/
│   └── utils/
└── data/
```

## Setup

1. Install Node.js 18 or newer.
2. Clone the repository.
3. Install dependencies:

```bash
npm install
```

4. Copy `.env.example` to `.env` and add your own credentials:

```env
DISCORD_TOKEN=your_discord_bot_token_here
DISCORD_CLIENT_ID=your_discord_application_id_here
AI_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
OWNER_ID=0
DEBUG=false
```

5. Start the bot:

```bash
npm start
```

For development with Node's watch mode:

```bash
npm run dev
```

## AI providers

Set `AI_PROVIDER` to one of:

- `groq` — cloud inference using your Groq API key
- `gemini` — Google Gemini using your Gemini API key
- `ollama` — local models through Ollama

## Security

Never commit `.env`, Discord bot tokens, AI API keys, or runtime database files. The repository intentionally ignores these files. If a token or API key is exposed, rotate it immediately before using the bot again.

## Notes

The bot creates and updates its local SQLite data at runtime. Runtime conversation/memory data is intentionally excluded from this public repository.
