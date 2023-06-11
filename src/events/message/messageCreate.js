const { commandHandler, automodHandler, statsHandler } = require("@src/handlers");
const { PREFIX_COMMANDS } = require("@root/config");
const { getSettings } = require("@schemas/Guild");
const checkRateLimit = require('@handlers/ratelimit');
const path = require('path');
const fileNameWithoutExt = path.basename(__filename, path.extname(__filename));

/**
 * @param {import('@src/structures').BotClient} client
 * @param {import('discord.js').Message} message
 */
module.exports = async (client, message) => {
  if (!message.guild) return;
  const settings = await getSettings(message.guild);

  // command handler
  let isCommand = false;
  if (PREFIX_COMMANDS.ENABLED) {
    // check for bot mentions
    if (message.content.includes(`${client.user.id}`)) {
      // Remove the response message
      return;
    }

    if (message.content && message.content.startsWith(settings.prefix)) {
      const invoke = message.content.replace(`${settings.prefix}`, "").split(/\s+/)[0];
      const cmd = client.getCommand(invoke);
      if (cmd) {
        isCommand = true;
        commandHandler.handlePrefixCommand(message, cmd, settings);
      }
    }
  }

  // stats handler
  if (settings.stats.enabled) await statsHandler.trackMessageStats(message, isCommand, settings);
  
  const hasReachedLimit = await checkRateLimit(message.member || message.author, fileNameWithoutExt);

  if (hasReachedLimit) {
    // Remove the response message
    return;
  }

  // if not a command
  if (!isCommand) await automodHandler.performAutomod(message, settings);
};
