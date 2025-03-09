const { REST, Routes } = require('discord.js');
require('dotenv').config();
const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;
const fs = require('node:fs');
const path = require('node:path');

const commands = [];
const { getTicketVariants } = require('./globalsql');

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
        console.log('Started refreshing application (/) commands.');

        // Fetch existing ticket variants for the default guild
        const guildId = process.env.GUILD_ID;
        const variants = await getTicketVariants(guildId);
        const variantChoices = variants.map(variant => ({ name: variant.variant_name, value: variant.variant_name }));

        // Update the create-embed command with variant choices
        const createEmbedCommand = commands.find(cmd => cmd.name === 'create-embed');
        if (createEmbedCommand) {
            const variantOption = createEmbedCommand.options.find(opt => opt.name === 'variants');
            if (variantOption) {
                variantOption.choices = variantChoices;
            }
        }

        await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands },
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();