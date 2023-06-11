const { EmbedBuilder } = require("discord.js");
const { getSettings } = require("@schemas/Guild");

/**
 * @param {string} content
 * @param {import('discord.js').GuildMember} member
 * @param {Object} inviterData
 */
const parse = async (content, member, inviterData = {}) => {
  const inviteData = {};

  const getEffectiveInvites = (inviteData = {}) =>
    inviteData.tracked + inviteData.added - inviteData.fake - inviteData.left || 0;

  if (content.includes("{inviter:")) {
    const inviterId = inviterData.member_id || "NA";
    if (inviterId !== "VANITY" && inviterId !== "NA") {
      try {
        const inviter = await member.client.users.fetch(inviterId);
        inviteData.name = inviter.username;
        inviteData.tag = inviter.tag;
      } catch (ex) {
        member.client.logger.error(`Parsing inviterId: ${inviterId}`, ex);
        inviteData.name = "NA";
        inviteData.tag = "NA";
      }
    } else if (member.user.bot) {
      inviteData.name = "OAuth";
      inviteData.tag = "OAuth";
    } else {
      inviteData.name = inviterId;
      inviteData.tag = inviterId;
    }
  }

  return content
    .replaceAll(/\\n/g, "\n")
    .replaceAll(/\\n/g, "\n")
    .replaceAll(/{server}/g, member.guild.name)
    .replaceAll(/{count}/g, member.guild.memberCount)
    .replaceAll(/{member:nick}/g, member.displayName)
    .replaceAll(/{member:name}/g, member.user.username)
    .replaceAll(/{member:dis}/g, member.user.discriminator)
    .replaceAll(/{member:tag}/g, member.user.tag)
    .replaceAll(/{member:avatar}/g, member.displayAvatarURL())
    .replaceAll(/{member:mention}/g, member.toString())
    .replaceAll(/{inviter:name}/g, inviteData.name)
    .replaceAll(/{inviter:tag}/g, inviteData.tag)
    .replaceAll(/{invites}/g, getEffectiveInvites(inviterData.invite_data));
};


/**
 * @param {import('discord.js').GuildMember} member
 * @param {"WELCOME"|"FAREWELL"} type
 * @param {Object} config
 * @param {Object} inviterData
 */
const buildGreeting = async (member, type, config, inviterData) => {
  if (!config) return;
  let content;
  let description = config.embed.description;

  // build content
  if (config.content) content = await parse(config.content, member, inviterData);

  // parse description
  if (description) description = await parse(description, member, inviterData);

  // build embed
  const embed = new EmbedBuilder();
  if (description) embed.setDescription(description);
  if (config.embed.color) embed.setColor(config.embed.color);
  if (config.embed.thumbnail) embed.setThumbnail(member.user.displayAvatarURL());
  if (config.embed.footer) {
    const parsedFooter = await parse(config.embed.footer, member, inviterData);
    embed.setFooter({ text: parsedFooter });
  }
  if (config.embed.image) {
    const parsedImage = await parse(config.embed.image, member);
    embed.setImage(parsedImage);
  }

  // set default message
  if (!content && !description && !config.embed.footer) {
    content =
      type === "WELCOME"
        ? `Welcome to the server, ${member.displayName} 🎉`
        : `${member.user.tag} has left the server 👋`;
    return { content };
  }

  return { content, embeds: [embed] };
};

/**
 * Send welcome message
 * @param {import('discord.js').GuildMember} member
 * @param {Object} inviterData
 */
async function sendWelcome(member, inviterData = {}) {
  const config = (await getSettings(member.guild))?.welcome;
  if (!config || !config.enabled) return;

  // check if channel exists
  const channel = member.guild.channels.cache.get(config.channel);
  if (!channel) return;

  // build welcome message
  const response = await buildGreeting(member, "WELCOME", config, inviterData);

  channel.safeSend(response);
}

/**
 * Send farewell message
 * @param {import('discord.js').GuildMember} member
 * @param {Object} inviterData
 */
async function sendFarewell(member, inviterData = {}) {
  const config = (await getSettings(member.guild))?.farewell;
  if (!config || !config.enabled) return;

  // check if channel exists
  const channel = member.guild.channels.cache.get(config.channel);
  if (!channel) return;

  // build farewell message
  const response = await buildGreeting(member, "FAREWELL", config, inviterData);

  channel.safeSend(response);
}

module.exports = {
  buildGreeting,
  sendWelcome,
  sendFarewell,
};
