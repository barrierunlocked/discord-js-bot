const { EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");
const { MESSAGES, EMBED_COLORS } = require("@root/config.js");
const fetch = require('node-fetch');

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "hanal",
  description: "Send a random hanal image.",
  cooldown: 5,
  category: "NSFW",
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
    usage: "",
    minArgsCount: 0,
  },
  slashCommand: {
    enabled: true,
    options: [],
  },

  async messageRun(message) {
    if (!message.channel.nsfw) {
      return message.safeReply("This command can only be used in NSFW channels.");
    }

    const loadingEmbed = new EmbedBuilder()
      .setDescription("Loading image...")
      .setColor(EMBED_COLORS.TRANSPARENT)
      .setTimestamp();

    const loadingMsg = await message.channel.send({ embeds: [loadingEmbed] });

    try {
      const res = await fetch(`https://nekobot.xyz/api/image?type=${this.name}`);
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
    const type = interaction.options.getString("type");
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
      return interaction.followUp(`Sorry, I couldn't get a ${type} image at the moment.`);
    }
  },
};
