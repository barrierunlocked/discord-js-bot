const RateLimitSettings = require('@root/src/database/schemas/RateLimitSettings');
const RateLimitHistory = require('@root/src/database/schemas/RateLimitHistory');
const { GuildMember } = require('discord.js');

/**
 * @param {GuildMember} member
 * @param {String} type
 * @returns {Promise<boolean>}
 */
async function checkRateLimits(member, type) {
  const now = Date.now();

  const settingsEntry = await RateLimitSettings.findOne({ guildID: member.guild.id, type });
  let historyEntry = await RateLimitHistory.findOne({ userID: member.id, guildID: member.guild.id, type });

  if (settingsEntry) {
    if (!settingsEntry.timelimit || (!settingsEntry.permstoremove && !settingsEntry.rolestoadd)) {
      return false;
    }

    let whitelistArray = Array.isArray(settingsEntry.whitelist) ? settingsEntry.whitelist : (settingsEntry.whitelist ? settingsEntry.whitelist.split(',') : []);

    if (whitelistArray.some(role => member.roles.cache.has(role))) {
      return false;
    }

    if (!historyEntry) {
      historyEntry = new RateLimitHistory({
        userID: member.id,
        guildID: member.guild.id,
        type,
        timestamp: now
      });
      await historyEntry.save();
      return false;
    }

    const timeDiff = now - historyEntry.timestamp;

    if (timeDiff <= settingsEntry.timelimit) {
      if (settingsEntry.permstoremove) {
        const permstoremoveArray = Array.isArray(settingsEntry.permstoremove) ? settingsEntry.permstoremove : settingsEntry.permstoremove.split(',');
        await member.roles.remove(permstoremoveArray);
      }
      if (settingsEntry.rolestoadd) {
        const rolestoaddArray = Array.isArray(settingsEntry.rolestoadd) ? settingsEntry.rolestoadd : settingsEntry.rolestoadd.split(',');
        await member.roles.add(rolestoaddArray);
      }
      return true;
    } else {
      historyEntry.timestamp = now;
      await historyEntry.save();
    }
  }

  return false;
}

module.exports = checkRateLimits;
