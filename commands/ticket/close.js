const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('close-ticket')
        .setDescription('Closes the current ticket.'),
    async execute(interaction) {
        const channel = interaction.channel;
        if (!channel.name.startsWith('ticket-')) {
            return interaction.reply({ content: 'This command can only be used in ticket channels.', ephemeral: true });
        }

        const closeButton = new ButtonBuilder()
            .setCustomId(`closeTicket_${channel.id}`)
            .setLabel('Close Ticket')
            .setStyle(ButtonStyle.Danger);

        const closeWithReasonButton = new ButtonBuilder()
            .setCustomId(`closeTicketWithReason_${channel.id}`)
            .setLabel('Close with Reason')
            .setStyle(ButtonStyle.Secondary);

        const row = new ActionRowBuilder().addComponents(closeButton, closeWithReasonButton);

        await interaction.reply({ content: 'Are you sure you want to close this ticket?', components: [row], ephemeral: true });
    },
};
