const { ApplicationCommandOptionType, ChannelType } = require("discord.js");
const XpSettings = require('@schemas/XpSettings');
const { MESSAGES, EMBED_COLORS } = require('@root/config.js');
const fetch = require('node-fetch');
const XpStats = require('@schemas/MemberStats');

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "levelup",
  description: "Configure the leveling system",
  category: "STATS",
  userPermissions: ["ManageGuild"],
  command: {
    enabled: true,
    minArgsCount: 1,
    subcommands: [
      {
        trigger: "message <new-message>",
        description: "Set custom level up message",
      },
      {
        trigger: "channel <#channel|off>",
        description: "Set the channel to send level up messages to",
      },
      {
        trigger: "xproles <level> <role>",
        description: "Assign a role to an XP level",
      },
      {
        trigger: "xphandle",
        description: "Handle XP for a member",
        options: [
          {
            name: "action",
            description: "The action to perform (add, set, remove)",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
              { name: "Add", value: "add" },
              { name: "Set", value: "set" },
              { name: "Remove", value: "remove" },
            ],
          },
          {
            name: "xp",
            description: "The XP number",
            type: ApplicationCommandOptionType.Integer,
            required: true,
          },
          {
            name: "levels",
            description: "The number of levels",
            type: ApplicationCommandOptionType.Integer,
            required: true,
          },
          {
            name: "member",
            description: "The member to handle XP for",
            type: ApplicationCommandOptionType.User,
            required: true,
          },
        ],
      },
    ],
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "message",
        description: "Set custom level up message",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "message",
            description: "Message to display when a user levels up",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
      {
        name: "channel",
        description: "Set the channel to send level up messages to",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "channel",
            description: "Channel to send level up messages to",
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildText],
            required: true,
          },
        ],
      },
      {
        name: "xproles",
        description: "Assign a role to an XP level",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "level",
            description: "XP level",
            type: ApplicationCommandOptionType.Integer,
            required: true,
          },
          {
            name: "role",
            description: "Role to assign",
            type: ApplicationCommandOptionType.Role,
            required: true,
          },
        ],
      },
      {
        name: "xphandle",
        description: "Handle XP for a member",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "action",
            description: "The action to perform (add, set, remove)",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
              { name: "Add", value: "add" },
              { name: "Set", value: "set" },
              { name: "Remove", value: "remove" },
            ],
          },
          {
            name: "xp",
            description: "The XP number",
            type: ApplicationCommandOptionType.Integer,
            required: true,
          },
          {
            name: "levels",
            description: "The number of levels",
            type: ApplicationCommandOptionType.Integer,
            required: true,
          },
          {
            name: "member",
            description: "The member to handle XP for",
            type: ApplicationCommandOptionType.User,
            required: true,
          },
        ],
      },
    ],
  },

  async messageRun(message, args, data) {
    const sub = args[0];
    const subcommandArgs = args.slice(1);
    let response;

    // message
    if (sub === "message") {
      const message = subcommandArgs.join(" ");
      response = await setMessage(message, data.settings);
    }

    // channel
    else if (sub === "channel") {
      const input = subcommandArgs[0];
      let channel;

      if (input === "off") channel = "off";
      else {
        const match = message.guild.findMatchingChannels(input);
        if (match.length === 0) return message.safeReply("Invalid channel. Please provide a valid channel");
        channel = match[0];
      }
      response = await setChannel(channel, data.settings);
    }

    // xproles
    else if (sub === "xproles") {
      const level = parseInt(subcommandArgs[0]);
      const roleId = subcommandArgs[1].replace(/[^0-9]/g, '');
      const role = message.guild.roles.cache.get(roleId);

      if (!role) {
        return message.reply('Please provide a valid role.');
      }

      response = await setXpRole(level, roleId, data.settings);
    }

    // xphandle
    else if (sub === "xphandle") {
      const action = subcommandArgs[0];
      const xp = parseInt(subcommandArgs[1]);
      const levels = parseInt(subcommandArgs[2]);
      const member = subcommandArgs[3];

      response = await handleXP(action, xp, levels, member);
    }

    // invalid
    else response = "Invalid subcommand";
    await message.safeReply(response);
  },

  async interactionRun(interaction, data) {
    const sub = interaction.options.getSubcommand();
    let response;

    if (sub === "message") response = await setMessage(interaction.options.getString("message"), data.settings);
    else if (sub === "channel") response = await setChannel(interaction.options.getChannel("channel"), data.settings);
    else if (sub === "xproles") {
      const level = interaction.options.getInteger('level');
      const role = interaction.options.getRole('role');

      if (!role) {
        return interaction.followUp({ content: 'Please provide a valid role.', ephemeral: true });
      }

      response = await setXpRole(level, role.id, data.settings);
    }
    else if (sub === "xphandle") {
      const action = interaction.options.getString("action");
      const xp = interaction.options.getInteger("xp");
      const levels = interaction.options.getInteger("levels");
      const member = interaction.options.getMember("member");

      response = await handleXP(action, xp, levels, member);
    }
    else response = "Invalid subcommand";

    await interaction.followUp(response);
  },
};

async function setMessage(message, settings) {
  if (!message) return "Invalid message. Please provide a message";
  settings.stats.xp.message = message;
  await settings.save();
  return `Configuration saved. Level up message updated!`;
}

async function setChannel(channel, settings) {
  if (!channel) return "Invalid channel. Please provide a channel";

  if (channel === "off") settings.stats.xp.channel = null;
  else settings.stats.xp.channel = channel.id;

  await settings.save();
  return `Configuration saved. Level up channel updated!`;
}

async function setXpRole(level, roleId, settings) {
  if (!level || isNaN(level)) return "Invalid level. Please provide a valid integer level.";

  let xpSettings = await XpSettings.findOne();
  if (!xpSettings) {
    xpSettings = new XpSettings();
  }

  if (!xpSettings.xproles) {
    xpSettings.xproles = new Map();
  }

  xpSettings.xproles.set(level.toString(), roleId);
  await xpSettings.save();

  return `The role has been assigned to XP level ${level}.`;
}

async function handleXP(action, xp, levels, member) {
  const guildId = member.guild.id;
  const memberId = member.id;

  let memberStats = await XpStats.getMemberStats(guildId, memberId);

  if (action === "add") {
    memberStats.xp += xp;
    memberStats.level += levels;

    await memberStats.save();

    return `XP for ${member} has been added by ${xp} and ${levels} levels.`;
  } else if (action === "set") {
    memberStats.xp = xp;
    memberStats.level = levels;

    await memberStats.save();

    return `XP for ${member} has been set to ${xp} and ${levels} levels.`;
  } else if (action === "remove") {
    if (memberStats.xp < xp) {
      return `${member} does not have enough XP to remove ${xp}.`;
    }

    memberStats.xp -= xp;
    memberStats.level -= levels;

    await memberStats.save();

    return `XP for ${member} has been removed by ${xp} and ${levels} levels.`;
  } else {
    return "Invalid action. Please provide a valid action (add, set, remove).";
  }
}
