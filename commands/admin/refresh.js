const { SlashCommandBuilder } = require('discord.js');
const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('refreshcommands')
        .setDescription('Refreshes the commands for the bot.'),

    async execute(interaction) {
        if (interaction.user.id != "743115397959778374") {
            interaction.reply({ephemeral: true, content: "You are not allowed to run this command!"})
            return
          }
        try {
            const token = process.env.TOKEN;
            const clientId = process.env.CLIENTID;
            const commands = [];
            const foldersPath = path.join(__dirname, '../');
            const commandFolders = fs.readdirSync(foldersPath);

            for (const folder of commandFolders) {
                const commandsPath = path.join(foldersPath, folder);
                const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

                for (const file of commandFiles) {
                    const filePath = path.join(commandsPath, file);
                    const command = require(filePath);
                    if ('data' in command && 'execute' in command) {
                        commands.push(command.data.toJSON());
                    } else {
                        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
                    }
                }
            }

            const rest = new REST().setToken(token);
            console.log(`Started refreshing ${commands.length} application (/) commands.`);

            // Fetch the existing commands from Discord
            const existingCommands = await rest.get(Routes.applicationCommands(clientId));

            // Filter out any commands that are missing from the new list
            const commandsToRemove = existingCommands.filter(existingCommand => 
                !commands.some(newCommand => newCommand.name === existingCommand.name)
            );

            // Remove any old commands that are not in the new list
            if (commandsToRemove.length > 0) {
                console.log(`Removing ${commandsToRemove.length} old commands.`);
                await Promise.all(
                    commandsToRemove.map(command => 
                        rest.delete(Routes.applicationCommand(clientId, command.id))
                    )
                );
                console.log('Old commands removed.');
            } else {
                console.log('No old commands to remove.');
            }

            // Add new or updated commands
            const data = await rest.put(
                Routes.applicationCommands(clientId),
                { body: commands }
            );

            console.log(`Successfully reloaded ${data.length} application (/) commands.`);
            await interaction.reply({ content: 'Commands refreshed successfully!', ephemeral: true });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error refreshing commands!', ephemeral: true });
        }
    },
};
