const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { closeTicket } = require('../../globalsql');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('close-ticket')
        .setDescription('Closes the current ticket.'),
    async execute(interaction) {
        const channel = interaction.channel;
        if (!channel.topic || !channel.topic.includes('Ticket ID:')) {
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

        // Handle button interactions
        const filter = i => i.customId.startsWith('closeTicket_') && i.user.id === interaction.user.id;
        const collector = channel.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async i => {
            if (i.customId === `closeTicket_${channel.id}`) {
                await closeTicket(i, channel.id);
            } else if (i.customId === `closeTicketWithReason_${channel.id}`) {
                const modal = new ModalBuilder()
                    .setCustomId(`closeTicketReasonModal_${channel.id}`)
                    .setTitle('Close Ticket with Reason');

                const reasonInput = new TextInputBuilder()
                    .setCustomId('reason')
                    .setLabel('Reason for closing the ticket')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true);

                modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));
                await i.showModal(modal);
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                interaction.editReply({ content: 'Ticket close action timed out.', components: [] });
            }
        });
    },
};
