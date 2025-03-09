const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { isCommandEnabled } = require('../../globalsql'); // Import the function

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roleinfo')
        .setDescription('Provides detailed information about a role in the server.')
        .addRoleOption(option => 
            option.setName('role')
                .setDescription('Select the role to get information about')
                .setRequired(true)),
    async execute(interaction) {
        const isEnabled = await isCommandEnabled(interaction.guild.id, 'roleinfo');
        if (!isEnabled) {
            return interaction.reply({ ephemeral: true, content: "This command is disabled." });
        }

        const role = interaction.options.getRole('role');  // Get the role selected by the user
        const guild = interaction.guild;

        // Get the members who have this role
        const membersWithRole = guild.members.cache.filter(member => member.roles.cache.has(role.id));
        const membersCount = membersWithRole.size;  // Number of members with this role

        // Create an embed with role info
        const roleEmbed = new EmbedBuilder()
            .setColor(role.color || '#FFFFFF')  // Use role color or default to white
            .setTitle(`Role Information for ${role.name}`)
            .setThumbnail(guild.iconURL())  // Add the server's icon as a thumbnail
            .addFields(
                { name: 'Role Name', value: role.name, inline: true },
                { name: 'Role ID', value: role.id, inline: true },
                { name: 'Role Color', value: `${role.hexColor}`, inline: true },
                { name: 'Role Creation Date', value: role.createdAt.toDateString(), inline: true },
                { name: 'Members with Role', value: `${membersCount}`, inline: true },
                { name: 'Permissions', value: role.permissions.toArray().join(', ') || 'No permissions', inline: false }
            )
            .setFooter({ text: 'Role Info' })
            .setTimestamp();

        // Send the embed as a public message in the server
        await interaction.reply({ embeds: [roleEmbed] });
    },
};
