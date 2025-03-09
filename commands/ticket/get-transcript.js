const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { getTicketTranscript } = require('../../globalsql');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('get-transcript')
        .setDescription('Retrieves the transcript of a ticket by ticket ID.')
        .addStringOption(option => 
            option.setName('ticket_id')
                .setDescription('The ID of the ticket channel')
                .setRequired(true)),
    async execute(interaction) {
        const ticketId = interaction.options.getString('ticket_id');
        const transcript = await getTicketTranscript(interaction.guild.id, ticketId);

        if (!transcript) {
            return interaction.reply({ content: `No transcript found for ticket ID ${ticketId}.`, ephemeral: true });
        }

        const transcriptText = transcript.map(msg => `[${new Date(msg.timestamp).toLocaleString()}] ${msg.author}: ${msg.content}`).join('\n');
        const filePath = path.join(__dirname, `transcript_${ticketId}.txt`);
        fs.writeFileSync(filePath, transcriptText);

        const attachment = new AttachmentBuilder(filePath);

        await interaction.reply({ content: 'Here is the transcript:', files: [attachment], ephemeral: true });

        fs.unlinkSync(filePath);
    },
};
