const { isHex } = require("@helpers/Utils");
const { buildGreeting } = require("@handlers/greeting");
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ModalBuilder,
  TextInputBuilder,
  ApplicationCommandOptionType,
  ChannelType,
  ButtonStyle,
  TextInputStyle,
  ComponentType,
} = require("discord.js");
const farewellMessage = "<:emoji_9:1115937617867976767>{server} <a:CH_IconArrowRight:715585320178941993>  Replaced with the name of the guild/server.\n" +
"<:emoji_9:1115937617867976767> {count}: Replaced with the total member count of the guild.\n" +
"<:emoji_9:1115937617867976767> {member:nick} <a:CH_IconArrowRight:715585320178941993> Replaced with the nickname of the member joining/leaving.\n" +
"<:emoji_9:1115937617867976767> {member:name} <a:CH_IconArrowRight:715585320178941993> Replaced with the username of the member joining/leaving.\n" +
"<:emoji_9:1115937617867976767> {member:dis} <a:CH_IconArrowRight:715585320178941993> Replaced with the discriminator (the four-digit number) of the member joining/leaving.\n" +
"<:emoji_9:1115937617867976767> {member:tag} <a:CH_IconArrowRight:715585320178941993> Replaced with the username and discriminator (e.g., Username#1234) of the member joining/leaving.\n" +
"<:emoji_9:1115937617867976767> {member:mention} <a:CH_IconArrowRight:715585320178941993> Replaced with the member mention of the member joining/leaving.\n" +
"<:emoji_9:1115937617867976767> {member:avatar} <a:CH_IconArrowRight:715585320178941993> Replaced with the URL of the member's avatar image.\n" +
"<:emoji_9:1115937617867976767> {inviter:name} <a:CH_IconArrowRight:715585320178941993> Replaced with the username of the inviter (if available).\n" +
"<:emoji_9:1115937617867976767> {inviter:tag} <a:CH_IconArrowRight:715585320178941993> Replaced with the username and discriminator of the inviter (if available).\n" +
"<:emoji_9:1115937617867976767> {invites} <a:CH_IconArrowRight:715585320178941993> Replaced with the effective number of invites for the inviter (tracked + added - fake - left).";




/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "farewell",
  description: "setup farewell  message",
  category: "ADMIN",
  userPermissions: ["ManageGuild"],
  command: {
    enabled: true,
    minArgsCount: 1,
    subcommands: [
      {
        trigger: "status <on|off>",
        description: "enable or disable farewell message",
      },
      {
        trigger: "channel <#channel>",
        description: "configure farewell  message",
      },
      {
        trigger: "preview",
        description: "preview the configured farewell message",
      },
      {
        trigger: "message",
        description: "configure farewell message",
      },
    ],
  },
  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [
      {
        name: "status",
        description: "enable or disable farewell message",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "status",
            description: "enabled or disabled",
            required: true,
            type: ApplicationCommandOptionType.String,
            choices: [
              {
                name: "ON",
                value: "ON",
              },
              {
                name: "OFF",
                value: "OFF",
              },
            ],
          },
        ],
      },
      {
        name: "preview",
        description: "preview the configured farewell message",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: "channel",
        description: "set farewell channel",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "channel",
            description: "channel name",
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildText],
            required: true,
          },
        ],
      },
      {
        name: "message",
        description: "configure farewell message",
        type: ApplicationCommandOptionType.Subcommand,
      },
    ],
  },

  async messageRun(message, args, data) {
    const type = args[0].toLowerCase();
    const settings = data.settings;

    let response;

    // preview
    if (type === "preview") {
      response = await sendPreview(settings, message.member);
    }

    // status
    else if (type === "status") {
      const status = args[1]?.toUpperCase();
      if (!status || !["ON", "OFF"].includes(status))
        return message.safeReply("Invalid status. Value must be `on/off`");
      response = await setStatus(settings, status);
    }

    // channel
    else if (type === "channel") {
      const channel = message.mentions.channels.first();
      response = await setChannel(settings, channel);
    }

    // message
    else if (type === "message") {
      await interaction.followUp(farewellMessage)
      await configureFarewellMessage(interaction, settings);
      return;
    }

    else response = "Invalid command usage!";
    return message.safeReply(response);
  },

  async interactionRun(interaction, data) {
    const sub = interaction.options.getSubcommand();
    const settings = data.settings;

    let response;
    switch (sub) {
      case "preview":
        response = await sendPreview(settings, interaction.member);
        break;

      case "status":
        response = await setStatus(settings, interaction.options.getString("status"));
        break;

      case "channel":
        response = await setChannel(settings, interaction.options.getChannel("channel"));
        break;

      case "message":
        await interaction.followUp(farewellMessage)
        await configureFarewellMessage(interaction, settings);
        return;


      default:
        response = "Invalid subcommand";
    }

    return await interaction.followUp(response);
  },
};

async function sendPreview(settings, member) {
  if (!settings.farewell?.enabled) return "farewell message not enabled in this server";

  const targetChannel = member.guild.channels.cache.get(settings.farewell.channel);
  if (!targetChannel) return "No channel is configured to send farewell message";

  const response = await buildGreeting(member, "farewell", settings.farewell);
  await targetChannel.safeSend(response);

  return `Sent farewell preview to ${targetChannel.toString()}`;
}

async function setStatus(settings, status) {
  const enabled = status.toUpperCase() === "ON" ? true : false;
  settings.farewell.enabled = enabled;
  await settings.save();
  return `Configuration saved! farewell message ${enabled ? "enabled" : "disabled"}`;
}

async function setChannel(settings, channel) {
  if (!channel.canSendEmbeds()) {
    return (
      "Ugh! I cannot send greeting to that channel? I need the `Write Messages` and `Embed Links` permissions in " +
      channel.toString()
    );
  }
  settings.farewell.channel = channel.id;
  await settings.save();
  return `Configuration saved! farewell message will be sent to ${channel ? channel.toString() : "Not found"}`;
}





/**
 * @param {import('discord.js').Message} param0
 * @param {import('discord.js').GuildTextBasedChannel} targetChannel
 * @param {object} settings
 */
async function configureFarewellMessage({ guild, channel, member }, settings) {
  const existingSettings = settings.farewell;

  // Create the button component
  const buttonRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("farewell_btnConfig").setLabel("Configure farewell Message").setStyle(ButtonStyle.Primary)
  );

  // Send the initial message with the button component
  const sentMsg = await channel.safeSend({
    content: "Please click the button below to setup ticket message",
    components: [buttonRow],
  });

  if (!sentMsg) return;

  // Wait for the button interaction
  const btnInteraction = await channel
    .awaitMessageComponent({
      componentType: ComponentType.Button,
      filter: (i) => i.customId === "farewell_btnConfig" && i.member.id === member.id && i.message.id === sentMsg.id,
      time: 20000,
    })
    .catch((ex) => {});

  if (!btnInteraction) return sentMsg.edit({ content: "No response received, farewell message configuration aborted.", components: [] });

  await btnInteraction.showModal(
    new ModalBuilder({
      customId: "farewell-modalConfig",
      title: "farewell Message Configuration",
      components: [
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("color")
            .setLabel("Color")
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setValue(existingSettings.embed.color ? existingSettings.embed.color : "")
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("description")
            .setLabel("Description")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(false)
            .setValue(existingSettings.embed.description ? existingSettings.embed.description : "")
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("thumbnail")
            .setLabel("Thumbnail (ON/OFF)")
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setValue(existingSettings.embed.thumbnail ? "ON" : "OFF")
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("footer")
            .setLabel("Footer")
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setValue(existingSettings.embed.footer ? existingSettings.embed.footer : "")
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("image")
            .setLabel("Image")
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setValue(existingSettings.embed.image ? existingSettings.embed.image : "")
        ),
      ],
    })
  );




  const modal = await btnInteraction
    .awaitModalSubmit({
      time: 15 * 60 * 1000,
      filter: (m) => m.customId === "farewell-modalConfig" && m.member.id === member.id && m.message.id === sentMsg.id,
    })
    .catch((ex) => {});

    
  if (!modal) return sentMsg.edit({ content: "No response received, cancelling setup", components: [] });

  await modal.reply("Updating farewell message configuration...");

  const color = modal.fields.getTextInputValue("color");
  if (color && isHex(color)) {
    settings.farewell.embed.color = color;
    await settings.save();
  } else {
    return "Invalid color input or no color provided. farewell message configuration aborted.";
  }

  const description = modal.fields.getTextInputValue("description");
  if (description) {
    settings.farewell.embed.description = description;
    await settings.save();
  } else {
    return "No description provided. farewell message configuration aborted.";
  }

  const thumbnailStatus = modal.fields.getTextInputValue("thumbnail")?.toLowerCase();
  if (thumbnailStatus === "on") {
    settings.farewell.embed.thumbnail = true;
    await settings.save();
  } else if (thumbnailStatus === "off") {
    settings.farewell.embed.thumbnail = false;
    await settings.save();
  } else {
    return "Invalid thumbnail status provided. farewell message configuration aborted.";
  }

  const footer = modal.fields.getTextInputValue("footer");
  if (footer) {
    settings.farewell.embed.footer = footer;
    await settings.save();
  } else {
    return "No footer provided. farewell message configuration aborted.";
  }

  const image = modal.fields.getTextInputValue("image");
  if (image) {
    settings.farewell.embed.image = image;
    await settings.save();
  } else {
    return "No image provided. farewell message configuration aborted.";
  }

 
  await modal.deleteReply();
  await sentMsg.edit({ content: "Done! farewell Message Saved", components: [] });
}
