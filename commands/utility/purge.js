const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const { isCommandEnabled } = require('../../globalsql');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('purge')
        .setDescription('Deletes a specified number of messages from the channel.')
        .addIntegerOption(option => 
            option.setName('amount')
                .setDescription('Number of messages to delete.')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100)
        ),
    async execute(interaction) {
        const isEnabled = await isCommandEnabled(interaction.guild.id, 'purge');
        if (!isEnabled) {
            return interaction.reply({ ephemeral: true, content: "This command is disabled." });
        }

        const amount = interaction.options.getInteger('amount');

        if (
            interaction.user.id !== "743115397959778374" && // Specific user ID
            interaction.user.id !== interaction.guild.ownerId && // Server owner
            !interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages) && // Manage Messages permission
            !interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild) // Manage Server permission (optional alternative)
        ) {
            interaction.reply({ ephemeral: true, content: "You are not allowed to run this command!" });
            return;
        }
        
        // Validate the amount
        if (amount < 1 || amount > 100) {
            return interaction.reply({ content: 'You must specify a number between 1 and 100.', ephemeral: true });
        }

        try {
            const messages = await interaction.channel.messages.fetch({ limit: amount });

            // Delete the messages
            await interaction.channel.bulkDelete(messages, true);

            // Create the confirmation embed
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('Purge Successful')
                .setDescription(`Successfully deleted **${messages.size}** message(s).`)
                .setTimestamp();

            // Reply with the embed
            const reply = await interaction.reply({ embeds: [embed], fetchReply: true });

            // Wait for 10 seconds and delete the reply
            setTimeout(async () => {
                try {
                    // Delete the reply directly using its ID
                    await interaction.channel.messages.delete(reply.id);
                } catch (error) {
                    console.log('Error deleting the reply:', error);
                }
            }, 10000); // 10 seconds
        } catch (error) {
            console.error(error);
            // If something goes wrong
            await interaction.reply({ content: 'There was an error trying to purge the messages. Please try again later.', ephemeral: true });
        }
    },
};
