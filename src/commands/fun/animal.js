const { EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");
const { MESSAGES, EMBED_COLORS } = require("@root/config.js");
const { getJson } = require("@helpers/HttpUtils");
const animals = require('random-animals-api');

const animalTypes = ["dog", "bunny", "duck", "fox", "lizard", "shiba"];
const BASE_URL = "https://some-random-api.ml/animal";

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "animal",
  description: "shows a random animal image",
  cooldown: 5,
  category: "FUN",
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
        description: "animal type",
        type: ApplicationCommandOptionType.String,
        required: true,
        choices: animalTypes.map((type) => ({ name: type, value: type })),
      },
    ],
  },

  async messageRun(message, args) {
    const choice = args[0].toLowerCase();
    if (!animalTypes.includes(choice)) {
      return message.safeReply(`Invalid animal type selected. Available types:\n${animalTypes.join(", ")}`);
    }
    const imageUrl = await getAnimalUrl(choice);
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.TRANSPARENT)
      .setImage(imageUrl)
      .setFooter({ text: `Requested by ${message.author.tag}` });

    return message.safeReply({ embeds: [embed] });
  },

  async interactionRun(interaction) {
    const choice = interaction.options.getString("type").toLowerCase();
    const imageUrl = await getAnimalUrl(choice);
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.TRANSPARENT)
      .setImage(imageUrl)
      .setFooter({ text: `Requested by ${interaction.user.tag}` });

    await interaction.followUp({ embeds: [embed] });
  },
};

async function getAnimalUrl(type) {
  const promise = new Promise((resolve, reject) => {
    animals[type]()
      .then((url) => {
        resolve(url);
      })
      .catch((error) => {
        reject(error);
      });
  });
  const url = await promise;
  return url;
}
