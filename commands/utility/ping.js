const { SlashCommandBuilder } = require('discord.js');
const { isCommandEnabled } = require('../../globalsql'); // Import the function

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with Pong!'),
	async execute(interaction) {
		const isEnabled = await isCommandEnabled(interaction.guild.id, 'ping');
        if (!isEnabled) {
            return interaction.reply({ ephemeral: true, content: "This command is disabled." });
        }

		await interaction.reply({content: 'Pong!', ephemeral: true});
	},
};