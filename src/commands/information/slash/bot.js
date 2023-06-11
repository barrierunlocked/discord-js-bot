const {
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonStyle,
} = require("discord.js");
const { timeformat } = require("@helpers/Utils");
const { EMBED_COLORS, SUPPORT_SERVER, DASHBOARD } = require("@root/config.js");
const botstats = require("../shared/botstats");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "bot",
  description: "bot related commands",
  category: "INFORMATION",
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: false,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "invite",
        description: "get bot's invite",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: "uptime",
        description: "get bot's uptime",
        type: ApplicationCommandOptionType.Subcommand,
      },
    ],
  },

  async interactionRun(interaction) {
    const sub = interaction.options.getSubcommand();
    if (!sub) return interaction.followUp("Not a valid subcommand");

    // Invite
    if (sub === "invite") {
      const response = botInvite(interaction.client);
      try {
        await interaction.user.send(response);
        return interaction.followUp("Check your DM for my information! :envelope_with_arrow:");
      } catch (ex) {
        return interaction.followUp("I cannot send you my information! Is your DM open?");
      }
    }

    // Stats

    // Uptime
    else if (sub === "uptime") {
      await interaction.followUp(`My Uptime: \`${timeformat(process.uptime())}\``);
    }
  },
};


