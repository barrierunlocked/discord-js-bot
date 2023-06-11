const { CommandCategory, BotClient } = require("@src/structures");
const { EMBED_COLORS, SUPPORT_SERVER } = require("@root/config.js");
const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  Message,
  ButtonBuilder,
  CommandInteraction,
  ApplicationCommandOptionType,
  ButtonStyle,
} = require("discord.js");
const { getCommandUsage, getSlashUsage } = require("@handlers/command");
const types = ["static"]
const CMDS_PER_PAGE = 5;

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "help",
  description: "command help menu",
  category: "UTILITY",
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
    usage: "[command]",
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "type",
        description: "Displays the help menu.",
        required: false,
        type: ApplicationCommandOptionType.String,
        choices: types.map((type) => ({ name: type, value: type })),
      },
      {
        name: "command",
        description: "name of the command",
        required: false,
        type: ApplicationCommandOptionType.String,
      },
    ],
  },

  async messageRun(message, args, data) {
    let trigger = args[0];
    let type = args[1];
    if (!type) {
      type = "ephemeral"; 
    }  
    // !help
    if (!trigger) {
      if (type === "static") {
      return message.safeReply()

      }else{
      const response = await getHelpMenu(message, type);
      const sentMsg = await message.safeReply(response);
      return waiter(sentMsg, message.author.id, data.prefix);}
    }

    // check if command help (!help cat)
    const cmd = message.client.getCommand(trigger);
    if (cmd) {
      const embed = getCommandUsage(cmd, data.prefix, trigger);
      return message.safeReply({ embeds: [embed] });
    }

    // No matching command/category found
    await message.safeReply("No matching command found");
  },

  async interactionRun(interaction) {
    let cmdName = interaction.options.getString("command");
    let type = interaction.options.getString("type") || "ephemeral";

    // !help
    if (!cmdName) {
      const response = await getHelpMenu(interaction, type);
      const sentMsg = await interaction.followUp(response);
      return waiter(sentMsg, interaction.user.id);
    }

    // check if command help (!help cat)
    const cmd = interaction.client.slashCommands.get(cmdName);
    if (cmd) {
      const embed = getSlashUsage(cmd);
      return interaction.followUp({ embeds: [embed] });
    }

    // No matching command/category found
    await interaction.followUp("No matching command found");
  },
};

/**
 * @param {CommandInteraction} interaction
 */
async function getHelpMenu({ client, guild }, type) {
  if (type === "static") {
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.BOT_EMBED)
      .setThumbnail("https://i.ibb.co/TvWcn5Z/hellbot.png")
      .setImage("https://i.ibb.co/4WYms8N/Media-230608-112029.gif")
      .setTitle("<a:Red_Fire:1100588980916985936>" + guild.members.me.displayName + "<a:Red_Fire:1100588980916985936>")
      .setDescription(`I'll work my best to make ${guild.name} server safe and entertaining.`)
      .addFields(
        { name: "About Me <a:Crown_Emoji_4:1100573051504042064>", value: `Hello, I am ${guild.members.me.displayName}! Thank you for considering me for your server. I offer a wide range of features to help you manage and entertain your community.` },
        { name: "Features <:hellbot:1116281728626073610>", value: "<a:Arrow_Right_RGB:1100598695566774384> Custom anti-hacks protection\n<a:Arrow_Right_RGB:1100598695566774384> Automode\n<a:Arrow_Right_RGB:1100598695566774384> Contact\n<a:Arrow_Right_RGB:1100598695566774384> Economy\n<a:Arrow_Right_RGB:1100598695566774384> Music\n<a:Arrow_Right_RGB:1100598695566774384> Utility\n<a:Arrow_Right_RGB:1100598695566774384> Moderation\n<a:Arrow_Right_RGB:1100598695566774384> XP\n<a:Arrow_Right_RGB:1100598695566774384> 18+", inline: true  },
        { name: "Support Server <a:nitro_boost_SPIN:1100573616644575372>", value: "Join my support server [here](https://discord.gg/fBttzbbsuX) and DM me", inline: true  },
        { name: "Invite Me <:crazyeyes:908023063621296170>", value: `[Here](${client.getInvite()})` }
      )
      .setFooter({ text: "Created by Name#0018" });

    return { embeds: [embed] };
  }

  // Menu Row
  const options = [];
  for (const [k, v] of Object.entries(CommandCategory)) {
    if (v.enabled === false) continue;
    options.push({
      label: v.name,
      value: k,
      description: `View commands in ${v.name} category`,
      emoji: v.emoji,
    });
  }

  const menuRow = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("help-menu")
      .setPlaceholder("Choose the command category")
      .addOptions(options)
  );

  // Buttons Row
  let components = [];
  components.push(
    new ButtonBuilder().setCustomId("previousBtn").setEmoji("⬅️").setStyle(ButtonStyle.Secondary).setDisabled(true),
    new ButtonBuilder().setCustomId("nextBtn").setEmoji("➡️").setStyle(ButtonStyle.Secondary).setDisabled(true)
  );

  let buttonsRow = new ActionRowBuilder().addComponents(components);

  const embed = new EmbedBuilder()
  .setColor(EMBED_COLORS.BOT_EMBED)
  .setThumbnail("https://i.ibb.co/TvWcn5Z/hellbot.png")
  .setImage("https://i.ibb.co/4WYms8N/Media-230608-112029.gif")  
  .setTitle("<a:Red_Fire:1100588980916985936>"+ guild.members.me.displayName + "<a:Red_Fire:1100588980916985936>")
  .setDescription(`I'll work my best to make ${guild.name} server safe and entertaining.`)
  .addFields(
    { name: "About Me <a:Crown_Emoji_4:1100573051504042064>", value: `Hello, I am ${guild.members.me.displayName}! Thank you for considering me for your server. I offer a wide range of features to help you manage and entertain your community.` },
    { name: "Features <:hellbot:1116281728626073610>", value: "<a:Arrow_Right_RGB:1100598695566774384> Custom anti-hacks protection\n<a:Arrow_Right_RGB:1100598695566774384> Automode\n<a:Arrow_Right_RGB:1100598695566774384> Contact\n<a:Arrow_Right_RGB:1100598695566774384> Economy\n<a:Arrow_Right_RGB:1100598695566774384> Music\n<a:Arrow_Right_RGB:1100598695566774384> Utility\n<a:Arrow_Right_RGB:1100598695566774384> Moderation\n<a:Arrow_Right_RGB:1100598695566774384> XP\n<a:Arrow_Right_RGB:1100598695566774384> 18+", inline: true  },
    { name: "Support Server <a:nitro_boost_SPIN:1100573616644575372>", value: "Join my support server [here](https://discord.gg/fBttzbbsuX) and DM me", inline: true  },
    { name: "Invite Me <:crazyeyes:908023063621296170>", value: `[Here](${client.getInvite()})` }
  )
  .setFooter({text:"Created by Name#0018"});

  return {
    embeds: [embed],
    components: [menuRow, buttonsRow],
  };
}

/**
 * @param {Message} msg
 * @param {string} userId
 * @param {string} prefix
 */
const waiter = (msg, userId, prefix) => {
    const collector = msg.channel.createMessageComponentCollector({
      filter: (reactor) => reactor.user.id === userId && msg.id === reactor.message.id,
      dispose: false,
      time: 60 * 60 * 100,
    });

    let arrEmbeds = [];
    let currentPage = 0;
    let menuRow = msg.components[0];
    let buttonsRow = msg.components[1];

    collector.on("collect", async (response) => {
      if (!["help-menu", "previousBtn", "nextBtn"].includes(response.customId)) return;
      await response.deferUpdate();

      switch (response.customId) {
        case "help-menu": {
          const cat = response.values[0].toUpperCase();
          arrEmbeds = prefix ? getMsgCategoryEmbeds(msg.client, cat, prefix) : getSlashCategoryEmbeds(msg.client, cat);
          currentPage = 0;

          // Buttons Row
          let components = [];
          buttonsRow.components.forEach((button) =>
            components.push(ButtonBuilder.from(button).setDisabled(arrEmbeds.length > 1 ? false : true))
          );

          buttonsRow = new ActionRowBuilder().addComponents(components);
          msg.editable && (await msg.edit({ embeds: [arrEmbeds[currentPage]], components: [menuRow, buttonsRow] }));
          break;
        }

        case "previousBtn":
          if (currentPage !== 0) {
            --currentPage;
            msg.editable && (await msg.edit({ embeds: [arrEmbeds[currentPage]], components: [menuRow, buttonsRow] }));
          }
          break;

        case "nextBtn":
          if (currentPage < arrEmbeds.length - 1) {
            currentPage++;
            msg.editable && (await msg.edit({ embeds: [arrEmbeds[currentPage]], components: [menuRow, buttonsRow] }));
          }
          break;
      }
    });

    collector.on("end", (collected) => {
      if (collected.size === 0) {
        msg.delete().catch((error) => console.error("Failed to delete message:", error));
      } else {
        msg.edit({ components: [] }).catch((error) => console.error("Failed to edit message:", error));
      }
    });
}; 




/**
 * Returns an array of message embeds for a particular command category [SLASH COMMANDS]
 * @param {BotClient} client
 * @param {string} category
 */
function getSlashCategoryEmbeds(client, category) {
  let collector = "";

  // For IMAGE Category
  if (category === "IMAGE") {
    client.slashCommands
      .filter((cmd) => cmd.category === category)
      .forEach((cmd) => (collector += `\`/${cmd.name}\`\n ❯ ${cmd.description}\n\n`));

    const availableFilters = client.slashCommands
      .get("filter")
      .slashCommand.options[0].choices.map((ch) => ch.name)
      .join(", ");

    const availableGens = client.slashCommands
      .get("generator")
      .slashCommand.options[0].choices.map((ch) => ch.name)
      .join(", ");

    collector +=
      "**Available Filters:**\n" + `${availableFilters}` + `*\n\n**Available Generators**\n` + `${availableGens}`;

    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.BOT_EMBED)
      .setThumbnail(CommandCategory[category]?.image)
      .setAuthor({ name: `${category} Commands` })
      .setDescription(collector);

    return [embed];
  }

  // For REMAINING Categories
  const commands = Array.from(client.slashCommands.filter((cmd) => cmd.category === category).values());

  if (commands.length === 0) {
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.BOT_EMBED)
      .setThumbnail(CommandCategory[category]?.image)
      .setAuthor({ name: `${category} Commands` })
      .setDescription("No commands in this category");

    return [embed];
  }

  const arrSplitted = [];
  const arrEmbeds = [];

  while (commands.length) {
    let toAdd = commands.splice(0, commands.length > CMDS_PER_PAGE ? CMDS_PER_PAGE : commands.length);

    toAdd = toAdd.map((cmd) => {
      const subCmds = cmd.slashCommand.options?.filter((opt) => opt.type === "SUB_COMMAND");
      const subCmdsString = subCmds?.map((s) => s.name).join(", ");

      return `\`/${cmd.name}\`\n ❯ **Description**: ${cmd.description}\n ${
        !subCmds?.length ? "" : `❯ **SubCommands [${subCmds?.length}]**: ${subCmdsString}\n`
      } `;
    });

    arrSplitted.push(toAdd);
  }

  arrSplitted.forEach((item, index) => {
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.BOT_EMBED)
      .setThumbnail(CommandCategory[category]?.image)
      .setAuthor({ name: `${category} Commands` })
      .setDescription(item.join("\n"))
      .setFooter({ text: `page ${index + 1} of ${arrSplitted.length}` });
    arrEmbeds.push(embed);
  });

  return arrEmbeds;
}

/**
 * Returns an array of message embeds for a particular command category [MESSAGE COMMANDS]
 * @param {BotClient} client
 * @param {string} category
 * @param {string} prefix
 */
function getMsgCategoryEmbeds(client, category, prefix) {
  let collector = "";

  // For IMAGE Category
  if (category === "IMAGE") {
    client.commands
      .filter((cmd) => cmd.category === category)
      .forEach((cmd) =>
        cmd.command.aliases.forEach((alias) => {
          collector += `\`${alias}\`, `;
        })
      );

    collector +=
      "\n\nYou can use these image commands in following formats\n" +
      `**${prefix}cmd:** Picks message authors avatar as image\n` +
      `**${prefix}cmd <@member>:** Picks mentioned members avatar as image\n` +
      `**${prefix}cmd <url>:** Picks image from provided URL\n` +
      `**${prefix}cmd [attachment]:** Picks attachment image`;

    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.BOT_EMBED)
      .setThumbnail(CommandCategory[category]?.image)
      .setAuthor({ name: `${category} Commands` })
      .setDescription(collector);

    return [embed];
  }

  // For REMAINING Categories
  const commands = client.commands.filter((cmd) => cmd.category === category);

  if (commands.length === 0) {
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.BOT_EMBED)
      .setThumbnail(CommandCategory[category]?.image)
      .setAuthor({ name: `${category} Commands` })
      .setDescription("No commands in this category");

    return [embed];
  }

  const arrSplitted = [];
  const arrEmbeds = [];

  while (commands.length) {
    let toAdd = commands.splice(0, commands.length > CMDS_PER_PAGE ? CMDS_PER_PAGE : commands.length);
    toAdd = toAdd.map((cmd) => `\`${prefix}${cmd.name}\`\n ❯ ${cmd.description}\n`);
    arrSplitted.push(toAdd);
  }

  arrSplitted.forEach((item, index) => {
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.BOT_EMBED)
      .setThumbnail(CommandCategory[category]?.image)
      .setAuthor({ name: `${category} Commands` })
      .setDescription(item.join("\n"))
      .setFooter({
        text: `page ${index + 1} of ${arrSplitted.length} | Type ${prefix}help <command> for more command information`,
      });
    arrEmbeds.push(embed);
  });

  return arrEmbeds;
}
