const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { isCommandEnabled } = require('../../globalsql'); // Import the function

module.exports = {
	data: new SlashCommandBuilder()
		.setName('server')
		.setDescription('Provides detailed information about the server.'),
	async execute(interaction) {
		const isEnabled = await isCommandEnabled(interaction.guild.id, 'server');
        if (!isEnabled) {
            return interaction.reply({ ephemeral: true, content: "This command is disabled." });
        }

		// Get the guild (server) object
		const guild = interaction.guild;

		// Create an embed with server info
		const serverEmbed = new EmbedBuilder()
			.setColor('#0099ff')
			.setTitle(`Server Information for ${guild.name}`)
			.setThumbnail(guild.iconURL())  // Add the server's icon as a thumbnail
			.addFields(
				{ name: 'Server Name', value: guild.name, inline: true },
				{ name: 'Owner', value: `<@${guild.ownerId}>`, inline: true },
				{ name: 'Total Members', value: `${guild.memberCount}`, inline: true },
				{ name: 'Roles Count', value: `${guild.roles.cache.size -1}`, inline: true },
				{ name: 'Total Channels', value: `${guild.channels.cache.size}`, inline: true },
				{ name: 'Created On', value: `${guild.createdAt.toDateString()}`, inline: true },
			)
			.setFooter({ text: 'Server Info' })
			.setTimestamp();

		// Send the embed as a response to the interaction
		await interaction.reply({ embeds: [serverEmbed], ephemeral: false });
	},
};
