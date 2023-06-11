const { getMemberStats } = require("@schemas/MemberStats");
const { getRandomInt } = require("@helpers/Utils");
const XpSettings = require('@schemas/XpSettings');

const cooldownCache = new Map();
const voiceStates = new Map();

const xpToAdd = () => getRandomInt(19) + 1;

/**
 * @param {string} content
 * @param {import('discord.js').GuildMember} member
 * @param {number} level
 */
const parse = (content, member, level) => {
  return content
    .replace(/\\n/g, "\n")
    .replace(/{server}/g, member.guild.name)
    .replace(/{count}/g, member.guild.memberCount)
    .replace(/{member:id}/g, member.id)
    .replace(/{member:name}/g, member.displayName)
    .replace(/{member:mention}/g, member.toString())
    .replace(/{member:tag}/g, member.user.tag)
    .replace(/{level}/g, level);
};

module.exports = {
  /**
   * This function saves stats for a new message
   * @param {import("discord.js").Message} message
   * @param {boolean} isCommand
   * @param {object} settings
   */
  async trackMessageStats(message, isCommand, settings) {
    const statsDb = await getMemberStats(message.guildId, message.member.id);
    if (isCommand) statsDb.commands.prefix++;
    statsDb.messages++;

    // Skip XP increment and role assignment for bot members
    if (message.member.user.bot) {
      return statsDb.save();
    }

    // Cooldown check to prevent Message Spamming
    const key = `${message.guildId}|${message.member.id}`;
    if (cooldownCache.has(key)) {
      const difference = (Date.now() - cooldownCache.get(key)) * 0.001;
      if (difference < message.client.config.STATS.XP_COOLDOWN) {
        return statsDb.save();
      }
      cooldownCache.delete(key);
    }

    // Update member's XP in DB
    statsDb.xp += xpToAdd();

    // Check if member has leveled up
    let { xp, level } = statsDb;
    const needed = level * level * 100;

    if (xp > needed) {
      level += 1;
      xp -= needed;

      statsDb.xp = xp;
      statsDb.level = level;
      let lvlUpMessage = settings.stats.xp.message;
      lvlUpMessage = parse(lvlUpMessage, message.member, level);

      const xpChannel = settings.stats.xp.channel && message.guild.channels.cache.get(settings.stats.xp.channel);
      const lvlUpChannel = xpChannel || message.channel;

      lvlUpChannel.safeSend(lvlUpMessage);

      // Assign roles based on XP levels
      const xpSettings = await XpSettings.findOne({ guildId: message.guildId });
      if (!xpSettings) {
        xpSettings = new XpSettings({ guildId: message.guildId });
      }
      const xproles = xpSettings.get('xproles');

      if (xproles.has(level.toString())) {
        const roleId = xproles.get(level.toString());
        const role = message.guild.roles.cache.get(roleId);

        if (role) {
          try {
            await message.member.roles.add(role);
            console.log(`Added role ${role.name} to ${message.member.user.tag}`);
          } catch (error) {  
            // Handle specific error cases
            if (error.code === 30007) {
              // Cannot add role higher than bot's highest role
              message.member.send("Failed to add the role. The role you are trying to assign is higher than the bot's highest role.");
            } else if (error.code === 50013) {
              // Missing permissions to add the role
              message.member.send("Failed to add the role. The bot doesn't have permission to assign roles.");
            } else {
              // Generic error message
              message.member.send("Failed to add the role. An error occurred while assigning the role.");
            }
          }
        }
      }
    }

    await statsDb.save();
    cooldownCache.set(key, Date.now());
  },

  /**
   * @param {import('discord.js').Interaction} interaction
   */
  async trackInteractionStats(interaction) {
    if (!interaction.guild) return;
    const statsDb = await getMemberStats(interaction.guildId, interaction.member.id);
    if (interaction.isChatInputCommand()) statsDb.commands.slash += 1;
    if (interaction.isUserContextMenuCommand()) statsDb.contexts.user += 1;
    if (interaction.isMessageContextMenuCommand()) statsDb.contexts.message += 1;
    await statsDb.save();
  },

  /**
   * @param {import('discord.js').VoiceState} oldState
   * @param {import('discord.js').VoiceState} newState
   */
  async trackVoiceStats(oldState, newState) {
    const oldChannel = oldState.channel;
    const newChannel = newState.channel;

    if (!oldChannel && !newChannel) return;
    if (!newState.member) return;

    const member = await newState.member.fetch().catch(() => {});
    if (!member || member.user.bot) return;

    // Member joined a voice channel
    if (!oldChannel && newChannel) {
      const statsDb = await getMemberStats(member.guild.id, member.id);
      statsDb.voice.connections += 1;
      await statsDb.save();
      voiceStates.set(member.id, Date.now());
    }

    // Member left a voice channel
    if (oldChannel && !newChannel) {
      const statsDb = await getMemberStats(member.guild.id, member.id);
      if (voiceStates.has(member.id)) {
        const time = Date.now() - voiceStates.get(member.id);
        statsDb.voice.time += time / 1000; // add time in seconds
        await statsDb.save();
        voiceStates.delete(member.id);
      }
    }
  },
};
