const { EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");
const { MESSAGES, EMBED_COLORS } = require("@root/config.js");
const fetch = require('node-fetch');

const nsfwTypes = [
  "4k", "anal", "ass", "boobs", "hanal", "hass", "hboobs", 
  "hentai", "hkitsune", "hmidriff", "hneko", "holo", "kemonomimi", 
  "neko", "pgif", "pussy", "yaoi"
];

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "nsfw",
  description: "Send a random NSFW image based on type.",
  cooldown: 5,
  category: "NSFW",
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
        name: "type",
        description: "Type of NSFW image",
        type: ApplicationCommandOptionType.String,
        required: true,
        choices: nsfwTypes.map((type) => ({ name: type, value: type })),
      },
    ],
  },

  async messageRun(message, args) {
    if (!message.channel.nsfw) {
      return message.safeReply("This command can only be used in NSFW channels.");
    }

    const type = args[0].toLowerCase();

    if (!nsfwTypes.includes(type)) {
      return message.safeReply(`Invalid type. Available types are: ${nsfwTypes.join(", ")}`);
    }

    const loadingEmbed = new EmbedBuilder()
      .setDescription("Loading image...")
      .setColor(EMBED_COLORS.TRANSPARENT)
      .setTimestamp();

    const loadingMsg = await message.channel.send({ embeds: [loadingEmbed] });

    try {
      const res = await fetch(`https://nekobot.xyz/api/image?type=${type}`);
      const data = await res.json();

      const imageEmbed = new EmbedBuilder()
        .setImage(data.message)
        .setColor(EMBED_COLORS.TRANSPARENT)
        .setFooter({ text: `Requested by ${message.author.tag}` })
        .setTimestamp();

      await loadingMsg.edit({ embeds: [imageEmbed] });
    } catch (err) {
      console.error(err);
      return message.safeReply("Sorry, I couldn't get an image at the moment.");
    }
  },

  async interactionRun(interaction) {
    if (!interaction.channel.nsfw) {
      return interaction.safeReply({ content: "This command can only be used in NSFW channels.", ephemeral: true });
    }

    const type = interaction.options.getString("type").toLowerCase();

    const loadingEmbed = new EmbedBuilder()
      .setDescription("Loading image...")
      .setTimestamp();
  
    await interaction.editReply({ embeds: [loadingEmbed] });

    try {
      const res = await fetch(`https://nekobot.xyz/api/image?type=${type}`);
      const data = await res.json();

      const imageEmbed = new EmbedBuilder()
        .setImage(data.message)
        .setColor(EMBED_COLORS.TRANSPARENT)
        .setFooter({ text: `Requested by ${interaction.user.tag}` })
        .setTimestamp();

      await interaction.editReply({ embeds: [imageEmbed] });
    } catch (err) {
      console.error(err);
      return interaction.followUp({ content: "Sorry, I couldn't get an image at the moment.", ephemeral: true });
    }
  },
};