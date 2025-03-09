const { Events, ModalSubmitInteraction, ButtonInteraction, StringSelectMenuInteraction, AutocompleteInteraction, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder, StringSelectMenuBuilder } = require('discord.js');
const { createTicketChannel, closeTicket, getTicketQuestions, saveTranscript, getTicketVariants } = require('../globalsql');

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

                    const variants = await getTicketVariants(interaction.guild.id);
                    if (variants.length === 0) {
                        return interaction.reply({ content: 'No ticket variants found. Please set up ticket variants first.', ephemeral: true });
                    }
                    const oldOptions = interaction.message.components.map(row => row.components[0].options).flat();
                    const filteredVariants = variants.filter(variant => oldOptions.some(option => option.value === variant.variant_name));
            
                    const rows = [];
                    for (let i = 0; i < filteredVariants.length; i += 25) {
                        const options = filteredVariants.slice(i, i + 25).map(variant => ({
                            label: `${variant.emoji ? `${variant.emoji} ` : ''}${variant.variant_name}`,
                            value: variant.variant_name,
                            description: variant.description
                        }));
            
                        if (options.length > 0) {
                            const selectMenu = new StringSelectMenuBuilder()
                                .setCustomId(`selectTicketVariant_${i / 25}`)
                                .setPlaceholder('Select a ticket variant')
                                .addOptions(options)
                                .setMinValues(1)
                                .setMaxValues(1);
            
                            rows.push(new ActionRowBuilder().addComponents(selectMenu));
                        }
                    }
            
                    const embed = new EmbedBuilder()
                        .setTitle('Create a Ticket')
                        .setDescription('Please select a ticket variant from the menu below.')
                        .setColor(0x00FF00);
            
                    await interaction.showModal(modal);

                    await interaction.message.edit({ embeds: [embed], components: rows, ephemeral: false });
                } else {
                    await createTicketChannel(interaction, variantName);
                }

                // Clear the placeholder
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
