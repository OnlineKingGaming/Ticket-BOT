const { Events, ModalSubmitInteraction, ButtonInteraction, StringSelectMenuInteraction, AutocompleteInteraction, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { createTicketChannel, closeTicket, getTicketQuestions, saveTranscript } = require('../globalsql');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (interaction.isCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(`Error executing ${interaction.commandName}`);
                console.error(error);
                await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
            }
        } else if (interaction instanceof StringSelectMenuInteraction) {
            if (interaction.customId.startsWith('selectTicketVariant_')) {
                const variantName = interaction.values[0];
                const questions = await getTicketQuestions(interaction.guild.id, variantName);

                if (questions.length > 0) {
                    const modal = new ModalBuilder()
                        .setCustomId(`ticketQuestionsModal_${variantName}`)
                        .setTitle(`Ticket Questions for ${variantName}`);

                    questions.forEach((question, index) => {
                        const questionInput = new TextInputBuilder()
                            .setCustomId(`question_${index}`)
                            .setLabel(question.question_title)
                            .setPlaceholder(question.question_placeholder)
                            .setStyle(question.question_type === 'Paragraph' ? TextInputStyle.Paragraph : TextInputStyle.Short)
                            .setRequired(true);

                        modal.addComponents(new ActionRowBuilder().addComponents(questionInput));
                    });

                    await interaction.showModal(modal);
                } else {
                    await createTicketChannel(interaction, variantName);
                }
            }
        } else if (interaction instanceof ButtonInteraction) {
            if (interaction.customId.startsWith('createTicket_')) {
                const variantName = interaction.customId.split('_')[1];
                const questions = await getTicketQuestions(interaction.guild.id, variantName);

                if (questions.length > 0) {
                    const modal = new ModalBuilder()
                        .setCustomId(`ticketQuestionsModal_${variantName}`)
                        .setTitle(`Ticket Questions for ${variantName}`);

                    questions.forEach((question, index) => {
                        const questionInput = new TextInputBuilder()
                            .setCustomId(`question_${index}`)
                            .setLabel(question.question_title)
                            .setPlaceholder(question.question_placeholder)
                            .setStyle(question.question_type === 'Paragraph' ? TextInputStyle.Paragraph : TextInputStyle.Short)
                            .setRequired(true);

                        modal.addComponents(new ActionRowBuilder().addComponents(questionInput));
                    });

                    await interaction.showModal(modal);
                } else {
                    await createTicketChannel(interaction, variantName);
                }
            } else if (interaction.customId.startsWith('closeTicket_')) {
                const channelId = interaction.customId.split('_')[1];
                await closeTicket(interaction, channelId, null);
            } else if (interaction.customId.startsWith('closeTicketWithReason_')) {
                const channelId = interaction.customId.split('_')[1];
                const modal = new ModalBuilder()
                    .setCustomId(`closeTicketReasonModal_${channelId}`)
                    .setTitle('Close Ticket with Reason');

                const reasonInput = new TextInputBuilder()
                    .setCustomId('reason')
                    .setLabel('Reason for closing the ticket')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true);

                modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));

                await interaction.showModal(modal);
            } else if (interaction.customId.startsWith('saveTranscript_')) {
                const channelId = interaction.customId.split('_')[1];
                await saveTranscript(interaction, channelId);
            }
        } else if (interaction instanceof ModalSubmitInteraction) {
            if (interaction.customId.startsWith('ticketQuestionsModal_')) {
                const variantName = interaction.customId.split('_')[1];
                await createTicketChannel(interaction, variantName, interaction.fields);
            } else if (interaction.customId.startsWith('closeTicketReasonModal_')) {
                const channelId = interaction.customId.split('_')[1];
                const reason = interaction.fields.getTextInputValue('reason');
                await closeTicket(interaction, channelId, reason);
            }
        } else if (interaction instanceof AutocompleteInteraction) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (command && command.autocomplete) {
                try {
                    await command.autocomplete(interaction);
                } catch (error) {
                    console.error(`Error handling autocomplete for ${interaction.commandName}`);
                    console.error(error);
                }
            }
        }
    },
};
