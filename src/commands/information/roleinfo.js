const { EmbedBuilder, Permissions } = require('discord.js');

module.exports = {
  name: 'roleinfo',
  description: 'Shows info about a role',
  usage: 'roleinfo <role>',
  category: 'INFORMATION',
  command: {
    enabled: true,
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: 'role',
        description: 'Role to get info about',
        type: 8, // ApplicationCommandOptionType.Role
        required: true,
      },
    ],
  },

  async messageRun(message, args) {
    const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]);
    if (!role) {
      return message.reply('Please mention a valid role or provide a valid role ID.');
    }

    const rolePermissions = role.permissions.toArray().filter((perm) => perm !== 'ADMINISTRATOR');

    const embed = new EmbedBuilder()
      .setTitle('Role Info')
      .setColor(role.color)
      .addFields(
        { name: 'Role Name', value: `\`${role.name}\``, inline: true },
        { name: 'Role ID', value: `\`${role.id}\``, inline: true },
        { name: 'Created At', value: `\`${role.createdAt.toDateString()}\``, inline: true },
        { name: 'Color', value: `\`${role.hexColor}\``, inline: true },
        { name: 'Position', value: `\`${role.position}\``, inline: true },
        { name: 'Members with Role', value: `\`${role.members.size}\``, inline: true },
        { name: 'Hoisted', value: `\`${role.hoist}\``, inline: true },
        { name: 'Integrated', value: `\`${role.managed}\``, inline: true },
        { name: 'Mentionable', value: `\`${role.mentionable}\``, inline: true },
        { name: 'Key Permissions', value: rolePermissions.map((perm) => `\`${perm}\``).join(', ') || 'None' }
      );

    await message.reply({ embeds: [embed] });
  },

  async interactionRun(interaction) {
    const role = interaction.options.getRole('role');
    const rolePermissions = role.permissions.toArray().filter((perm) => perm !== 'ADMINISTRATOR');

    const embed = new EmbedBuilder()
      .setTitle('Role Info')
      .setColor(role.color)
      .addFields(
        { name: 'Role Name', value: `\`${role.name}\``, inline: true },
        { name: 'Role ID', value: `\`${role.id}\``, inline: true },
        { name: 'Created At', value: `\`${role.createdAt.toDateString()}\``, inline: true },
        { name: 'Color', value: `\`${role.hexColor}\``, inline: true },
        { name: 'Position', value: `\`${role.position}\``, inline: true },
        { name: 'Members with Role', value: `\`${role.members.size}\``, inline: true },
        { name: 'Hoisted', value: `\`${role.hoist}\``, inline: true },
        { name: 'Integrated', value: `\`${role.managed}\``, inline: true },
        { name: 'Mentionable', value: `\`${role.mentionable}\``, inline: true },
        { name: 'Key Permissions', value: rolePermissions.map((perm) => `\`${perm}\``).join(', ') || 'None' }
      );

    await interaction.followUp({ embeds: [embed] });
  },
};
