const { EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");
const { MESSAGES, EMBED_COLORS } = require("@root/config.js");
const RateLimit = require('@schemas/Ratelimit');
const fs = require('fs');
const path = require('path');

const action = [
  "set", "delete"
];

const chunkArray = (arr, chunkSize) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
      chunks.push(arr.slice(i, i + chunkSize));
  }
  return chunks;
};

const getAllJsFiles = (dir, fileList = []) => {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
      if (fs.statSync(path.join(dir, file)).isDirectory()) {
          fileList = getAllJsFiles(path.join(dir, file), fileList);
      }
      else if (file.endsWith('.js')) {
          fileList.push(path.join(dir, file));
      }
  });

  return fileList;
};

function getRoleIdsFromMentions(mentionString) {
  return mentionString
    ? mentionString.split(',').map(mention => mention.trim().replace(/<@&([0-9]+)>/g, '$1'))
    : null;
}

const commandFiles = getAllJsFiles(path.join(__dirname, '../../commands'));
const commandNames = commandFiles.map(file => path.basename(file, '.js'));
const commandNameChunks = chunkArray(commandNames, 25);

const eventFiles = getAllJsFiles(path.join(__dirname, '../../events'));
const eventNames = eventFiles.map(file => path.basename(file, '.js'));
const eventNameChunks = chunkArray(eventNames, 25);

const commandOptions = commandNameChunks.map((chunk, index) => ({
  name: `limit_command_${index + 1}`,
  description: 'List of commands to apply this setting',
  type: ApplicationCommandOptionType.String,
  required: false,
  choices: chunk.map(name => ({ name, value: name })),
}));

const eventOptions = eventNameChunks.map((chunk, index) => ({
  name: `limit_event_${index + 1}`,
  description: 'List of events to apply this setting',
  type: ApplicationCommandOptionType.String,
  required: false,
  choices: chunk.map(name => ({ name, value: name })),
}));

module.exports = {
  name: 'settings',
  description: 'Configure the moderation system settings',
  cooldown: 5,
  category: "MODSYSTEM",
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "action",
        description: "set/delete",
        type: ApplicationCommandOptionType.String,
        required: true,
        choices: action.map((type) => ({ name: type, value: type })),
      },
      {
        name: "whitelist",
        description: "List of roles to whitelist, comma separated",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
      {
        name: "permstoremove",
        description: "List of roles to remove, comma separated",
        type: ApplicationCommandOptionType.String,
        required: false
      },
      {
        name: "timelimit",
        description: "Time limit for the specified event/command action in seconds",
        type: ApplicationCommandOptionType.Integer,
        required: false,
      },
      ...commandOptions,
      ...eventOptions,
    ],
  },
  async messageRun(message, args) {
    const action = args[0].toLowerCase();
    const whitelist = args[1] ? args[1].split(',').map(role => role.trim()) : null;
    const permstoremove = args[2] ? args[2].split(',').map(role => role.trim()) : null;
    const timelimit = args[3] ? parseInt(args[3]) : 0;
    const type = args[4] ? args[4] : "";
  
    if (action == 'set') {
      const query = {
        userID: message.author.id,
        guildID: message.guild.id,
        type: type,
      };
  
      let rateLimitEntry = await RateLimit.findOne(query);
      if (!rateLimitEntry) {
        rateLimitEntry = new RateLimit({
          userID: message.author.id,
          guildID: message.guild.id,
          type: type,
          timestamp: Date.now(),
          timelimit,
          permstoremove,
          whitelist,
        });
      } else {
        rateLimitEntry.timestamp = Date.now();
        rateLimitEntry.timelimit = timelimit;
        rateLimitEntry.permstoremove = permstoremove;
        rateLimitEntry.whitelist = whitelist;
      }
  
      try {
        await rateLimitEntry.save();
        message.safereply('Moderation system settings have been updated successfully.');
      } catch (err) {
        console.error(err);
        message.safereply('Failed to update moderation system settings.');
      }
    }
 
    else if (action == 'delete') {
      const query = {
        userID: message.author.id,
        guildID: message.guild.id,
        type: type,
      };
  
      try {
        const deletedDoc = await RateLimit.findOneAndDelete(query);
        if (deletedDoc) {
          message.reply('Successfully deleted the matching document.');
        } else {
          message.reply('No matching document was found to delete.');
        }
      } catch (err) {
        console.error(err);
        message.reply('Failed to delete moderation system settings.');
      }
    }  
    else {
      message.reply('Invalid action. Only `set` and `delete` actions are supported.');
    }
  },



  async interactionRun(interaction) {
    const action = interaction.options.getString("action").toLowerCase();
    const whitelist = getRoleIdsFromMentions(interaction.options.getString("whitelist"));
    const permstoremove = getRoleIdsFromMentions(interaction.options.getString("permstoremove"));
    const timelimit = interaction.options.getInteger("timelimit") ? interaction.options.getInteger("timelimit") : 0;
    let type = "";
  
    // Retrieve the selected command or event
    for (let i = 1; i <= commandNameChunks.length; i++) {
      const limitCommandOption = interaction.options.getString(`limit_command_${i}`);
      if (limitCommandOption) {
        type = limitCommandOption;
        break;
      }
    }
  
    if (!type) {
      for (let i = 1; i <= eventNameChunks.length; i++) {
        const limitEventOption = interaction.options.getString(`limit_event_${i}`);
        if (limitEventOption) {
          type = limitEventOption;
          break;
        }
      }
    }

    if (!type) {
      return interaction.followUp({ content: 'Please select either a command or an event.', ephemeral: true });
    }
    const commandSelections = commandNameChunks.map((_, i) => interaction.options.getString(`limit_command_${i + 1}`)).filter(Boolean);
    const eventSelections = eventNameChunks.map((_, i) => interaction.options.getString(`limit_event_${i + 1}`)).filter(Boolean);
    
    if (commandSelections.length > 1 || eventSelections.length > 1 || (commandSelections.length > 0 && eventSelections.length > 0)) {
      return interaction.followUp({ content: 'Please select only one command or event.', ephemeral: true });
    }
    
    if (action === 'set' && !timelimit && !permstoremove) {
      return interaction.followUp({ content: 'Please select a time limit or a role to remove permissions from when setting limits.', ephemeral: true });
    }
    
    if (!whitelist) {
      interaction.followUp({ content: 'No roles have been whitelisted. All roles will be affected by this limit.', ephemeral: true });
    }
    
    if (action == 'set') {
      const query = {
        userID: interaction.user.id,
        guildID: interaction.guild.id,
        type: type,
      };
  
      let rateLimitEntry = await RateLimit.findOne(query);
      if (!rateLimitEntry) {
        rateLimitEntry = new RateLimit({
          userID: interaction.user.id,
          guildID: interaction.guild.id,
          type: type,
          timestamp: Date.now(),
          timelimit,
          permstoremove,
          whitelist,
        });
      } else {
        rateLimitEntry.timestamp = Date.now();
        rateLimitEntry.timelimit = timelimit;
        rateLimitEntry.permstoremove = permstoremove;
        rateLimitEntry.whitelist = whitelist;
      }
  
      try {
        await rateLimitEntry.save();
        interaction.followUp({ content: 'Moderation system settings have been updated successfully.', ephemeral: true });
      } catch (err) {
        console.error(err);
        interaction.followUp({ content: 'Failed to update moderation system settings.', ephemeral: true });
      }
    }
    else if (action == 'delete') {
      const query = {
        userID: interaction.user.id,
        guildID: interaction.guild.id,
        type: type,
      };
  
      try {
        const deletedDoc = await RateLimit.findOneAndDelete(query);
        if (deletedDoc) {
          interaction.followUp({ content: 'Successfully deleted the matching document.', ephemeral: true });
        } else {
          interaction.followUp({ content: 'No matching document was found to delete.', ephemeral: true });
        }
      } catch (err) {
        console.error(err);
        interaction.followUp({ content: 'Failed to delete moderation system settings.', ephemeral: true });
      }
    }
    else {
      interaction.followUp({ content: 'Invalid action. Only `set` and `delete` actions are supported.', ephemeral: true });
    }
  },
};