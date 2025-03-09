const { SlashCommandBuilder } = require('@discordjs/builders');
const { isCommandEnabled } = require('../../globalsql'); // Import the function
require('dotenv').config(); // Load environment variables from .env file

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Lists all available commands and their descriptions'),

  async execute(interaction) {
    const isEnabled = await isCommandEnabled(interaction.guild.id, 'help');
    if (!isEnabled) {
      return interaction.reply({ ephemeral: true, content: "This command is disabled." });
    }

    const commands = interaction.client.commands.map(cmd => ({
      name: cmd.data.name,
      description: cmd.data.description
    }));

    let helpMessage = 'Here are the available commands:\n\n';
    
    commands.forEach(command => {
      helpMessage += `**/${command.name}**: ${command.description}\n`;
    });

    return interaction.reply({
      content: helpMessage,
      ephemeral: true, // Only visible to the user who invoked the command
    });
  },
};
