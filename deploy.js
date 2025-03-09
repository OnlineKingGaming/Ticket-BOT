const { REST, Routes } = require('discord.js');
require('dotenv').config();
const token = process.env.TOKEN;
const clientId = process.env.CLIENTID;
// For global commands, remove or comment out the guildId variable and its usage.
// const guildId = process.env.GUILDID; // For testing in a specific guild
const fs = require('node:fs');
const path = require('node:path');

const commands = [];

// Grab all the command folders from the commands directory
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

// Loop through each subfolder and file
for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            // Push the command JSON if it is not already in the list (based on its name)
            if (!commands.some(cmd => cmd.name === command.data.name)) {
                commands.push(command.data.toJSON());
            } else {
                console.log(`[INFO] Duplicate command "${command.data.name}" found in ${filePath}. Skipping.`);
            }
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

// Construct and prepare an instance of the REST module
const rest = new REST({ version: '10' }).setToken(token);

(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        // For global commands, use Routes.applicationCommands(clientId)
        // For testing in a specific guild, use Routes.applicationGuildCommands(clientId, guildId)
        const endpoint = Routes.applicationCommands(clientId);
        // const endpoint = Routes.applicationGuildCommands(clientId, guildId); // Uncomment for guild testing

        // Fetch existing commands from Discord
        const existingCommands = await rest.get(endpoint);
        console.log(`Found ${existingCommands.length} existing commands on Discord.`);

        // Create an array of command names from the new list
        const newCommandNames = commands.map(cmd => cmd.name);
        // Filter out commands that exist on Discord but are no longer in the new list
        const commandsToRemove = existingCommands.filter(existingCmd => !newCommandNames.includes(existingCmd.name));

        if (commandsToRemove.length > 0) {
            console.log(`Removing ${commandsToRemove.length} old commands...`);
            for (const cmd of commandsToRemove) {
                await rest.delete(Routes.applicationCommand(clientId, cmd.id));
            }
            console.log('Old commands removed.');
        } else {
            console.log('No old commands to remove.');
        }

        // Deploy (or update) the new set of commands
        const data = await rest.put(endpoint, { body: commands });
        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error('Error refreshing commands:', error);
    }
})();
