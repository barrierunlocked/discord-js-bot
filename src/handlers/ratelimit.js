const RateLimit = require('@schemas/Ratelimit');
const { GuildMember, Guild } = require('discord.js');

/**
 * 
 * @param {GuildMember} member 
 * @param {Guild} guild 
 * @param {String} type
 * @returns {Promise<boolean>}
 */

async function checkRateLimit(user, guild, type) {
    const now = Date.now();
    const rateLimitEntry = await RateLimit.findOne({ userID: user.id, guildID: guild.id, type: type });

    if (rateLimitEntry) {
        // Ensure all necessary fields are present
        if (!rateLimitEntry.whitelist || !rateLimitEntry.timestamp || !rateLimitEntry.timeLimit || !rateLimitEntry.permsToRemove) {
            console.error(`Rate limit entry for user ${user.id} in guild ${guild.id} is missing necessary fields.`);
            return false;
        }

        // Check if user is whitelisted
        const member = guild.members.cache.get(user.id);
        if (member && member.roles.cache.some(role => rateLimitEntry.whitelist.includes(role.id))) {
            return false;
        }

        const timeDiff = now - rateLimitEntry.timestamp;

        if (timeDiff < rateLimitEntry.timeLimit) {
            // If the time difference is less than the limit, remove permissions
            if (member && member.roles) {
                await member.roles.remove(rateLimitEntry.permsToRemove);
            }
            return true;
        } else {
            // If the time difference is greater than the limit, update the timestamp
            rateLimitEntry.timestamp = now;
            await rateLimitEntry.save();
            return false;
        }
    } else {
        // If there is no entry, return false. No need to create an entry if user has not yet hit the rate limit
        return false;
    }
}

module.exports = checkRateLimit;
