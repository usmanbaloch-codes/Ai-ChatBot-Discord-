// src/utils/logger.js - Clean logging utility
const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

function timestamp() {
  return new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' });
}

export const logger = {
  info: (...args) => {
    console.log(`${COLORS.gray}[${timestamp()}]${COLORS.green} [INFO]${COLORS.reset}`, ...args);
  },
  warn: (...args) => {
    console.log(`${COLORS.gray}[${timestamp()}]${COLORS.yellow} [WARN]${COLORS.reset}`, ...args);
  },
  error: (...args) => {
    console.log(`${COLORS.gray}[${timestamp()}]${COLORS.red} [ERROR]${COLORS.reset}`, ...args);
  },
  debug: (...args) => {
    if (process.env.DEBUG === 'true') {
      console.log(`${COLORS.gray}[${timestamp()}]${COLORS.cyan} [DEBUG]${COLORS.reset}`, ...args);
    }
  },
  chat: (server, user, msg) => {
    console.log(
      `${COLORS.gray}[${timestamp()}]${COLORS.magenta} [CHAT]${COLORS.reset}`,
      `${COLORS.blue}${server}${COLORS.reset} |`,
      `${COLORS.cyan}${user}${COLORS.reset}:`,
      msg
    );
  }
};
