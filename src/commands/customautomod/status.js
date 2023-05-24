const RateLimit = require('@schemas/Ratelimit');
const { EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");
const { MESSAGES, EMBED_COLORS } = require("@root/config.js");
const fetch = require('node-fetch');

const status = ["status"];

module.exports = {
  name: 'status',
  description: 'Check the status of the moderation system',
  cooldown: 5,
  category: "MODSYSTEM",
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
    usage: "<type>",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "action",
        description: "Type of action",
        type: ApplicationCommandOptionType.String,
        required: true,
        choices: status.map((type) => ({ name: type, value: type })),
      },
    ],
  },
  async messageRun(message, args) {
    const rateLimitEntries = await RateLimit.find({ guildID: message.guild.id });

    if (!rateLimitEntries || rateLimitEntries.length === 0) {
      return message.safereply('The moderation system is not configured for this guild.');
    }

    for (const rateLimitEntry of rateLimitEntries) {
      const embed = new EmbedBuilder()
        .setColor(EMBED_COLORS.TRANSPARENT)
        .setTitle(`Moderation System - ${rateLimitEntry.enabled ? 'Enabled' : 'Disabled'}`)
        .setDescription(`
          Type: ${rateLimitEntry.type}
          ${rateLimitEntry.ready ? 'The moderation system is ready.' : 'The moderation system is not ready.'}
          Time Limit: ${rateLimitEntry.timelimit}
          Permissions to Remove: ${rateLimitEntry.permstoremove.join(', ')}
          Whitelist: ${rateLimitEntry.whitelist.join(', ')}
        `)
        .setColor(rateLimitEntry.enabled ? EMBED_COLORS.SUCCESS : EMBED_COLORS.ERROR)
        .setFooter({ text: `Requested by ${message.author.tag}` })
        .setTimestamp();

      await message.channel.send({ embeds: [embed] });
    }
  },

  async interactionRun(interaction) {
    // Check if status option was used
    const action = interaction.options.getString("action").toLowerCase();
    if (action === 'status') {
      const rateLimitEntries = await RateLimit.find({ guildID: interaction.guild.id });

      if (!rateLimitEntries || rateLimitEntries.length === 0) {
        return interaction.followUp({ content: 'The moderation system is not configured for this guild.', ephemeral: true });
      }

      for (const rateLimitEntry of rateLimitEntries) {
        const embed = new EmbedBuilder()
        .setColor(EMBED_COLORS.TRANSPARENT)
        .setTitle(`Moderation System - ${rateLimitEntry.enabled ? 'Enabled' : 'Disabled'}`)
        .setDescription(`
          Type: ${rateLimitEntry.type}
          ${rateLimitEntry.ready ? 'The moderation system is ready.' : 'The moderation system is not ready.'}
          Time Limit: ${rateLimitEntry.timelimit}
          Permissions to Remove: ${rateLimitEntry.permstoremove.join(', ')}
          Whitelist: ${rateLimitEntry.whitelist.join(', ')}
        `)
        .setColor(rateLimitEntry.enabled ? EMBED_COLORS.SUCCESS : EMBED_COLORS.ERROR)
        .setFooter({ text: `Requested by ${interaction.user.tag}` })
        .setTimestamp();

        await interaction.followUp({ embeds: [embed] });
      }
    }
  },
}