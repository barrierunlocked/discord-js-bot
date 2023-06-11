const { EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");
const { MESSAGES, EMBED_COLORS } = require("@root/config.js");
const axios = require("axios");

const BASE_URL = "https://api.api-ninjas.com/v1/facts";
const API_KEY = "5KanGKWur9I9ZCi9ziEVwg==DMBhTyDBxxVpEmyH";

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "fact",
  description: "shows random facts",
  cooldown: 5,
  category: "FUN",
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
    usage: "<limit>",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "limit",
        description: "number of facts to retrieve (max 15)",
        type: ApplicationCommandOptionType.Integer,
        required: true,
      },
    ],
  },

  async messageRun(message, args) {
    const limit = parseInt(args[0]);
    if (isNaN(limit)) {
      return message.safeReply("Invalid limit. Please provide a valid number.");
    }

    if (limit > 15) {
      return interaction.reply({ content: "The maximum limit is 15.", ephemeral: true });
    }  

    const facts = await getRandomFacts(limit);
    if (!facts || facts.length === 0) {
      return message.safeReply("Unable to fetch random facts at the moment. Please try again later.");
    }

    const formattedFacts = formatFacts(facts);
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.TRANSPARENT)
      .setTitle("Random Facts")
      .setDescription(formattedFacts);

    return message.safeReply({ embeds: [embed] });
  },

  async interactionRun(interaction) {
    const limit = interaction.options.getInteger("limit");

    const facts = await getRandomFacts(limit);
    if (!facts || facts.length === 0) {
      return interaction.followUp("Unable to fetch random facts at the moment. Please try again later.");
    }

    if (limit > 15) {
      return interaction.followUp({
        content: "The maximum limit is 15.",
        ephemeral: true,
      });
    }

    const formattedFacts = formatFacts(facts);
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.TRANSPARENT)
      .setTitle("💡 Random Facts 💡")
      .setDescription(formattedFacts)
      .setFooter({ text: `Requested by ${interaction.member.user.tag}`, iconURL: interaction.member.user.displayAvatarURL() });

    await interaction.followUp({ embeds: [embed] });
  },
};

async function getRandomFacts(limit) {
  try {
    const response = await axios.get(`${BASE_URL}?limit=${limit}`, {
      headers: {
        "X-Api-Key": API_KEY,
      },
    });

    if (response.status === 200) {
      return response.data.map((fact) => fact.fact);
    }
  } catch (error) {
    console.error("Error fetching random facts:", error);
  }

  return null;
}

function formatFacts(facts) {
  const formattedFacts = [];
  const border = "══ ❀•°❀°•❀ ══";
  for (let i = 0; i < facts.length; i++) {

    const number = `【${i + 1}】☾`;
    const fact = `|| ${facts[i]} ||`;

    formattedFacts.push(border);
    formattedFacts.push(`${number} ${fact}`);
  }

  formattedFacts.push(border);

  return formattedFacts.join("\n\n");
}
