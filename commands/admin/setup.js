const { SlashCommandBuilder, PermissionsBitField, ChannelType } = require('discord.js');
const { saveTicketVariant, saveTicketQuestions, saveLogChannel } = require('../../globalsql');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Sets up server configurations.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('ticket')
                .setDescription('Sets up a ticket variant.')
                .addStringOption(option => 
                    option.setName('variant_name')
                        .setDescription('Enter the ticket variant name')
                        .setRequired(true))
                .addStringOption(option => 
                    option.setName('description')
                        .setDescription('Enter the description for this ticket variant')
                        .setRequired(true))
                .addRoleOption(option => 
                    option.setName('role')
                        .setDescription('Select a role for this variant')
                        .setRequired(true))
                .addIntegerOption(option => 
                    option.setName('questions')
                        .setDescription('Number of questions to ask')
                        .setRequired(true)
                        .setMinValue(0)
                        .setMaxValue(4))
                .addStringOption(option => 
                    option.setName('emoji')
                        .setDescription('Enter an emoji for this ticket variant')
                        .setRequired(false))
                .addChannelOption(option => 
                    option.setName('category')
                        .setDescription('Select a category (optional)')
                        .addChannelTypes(ChannelType.GuildCategory)
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('log')
                .setDescription('Sets up a log channel.')
                .addChannelOption(option => 
                    option.setName('channel')
                        .setDescription('Select a channel for logging')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true))),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ ephemeral: true, content: "You do not have permission to use this command." });
        }

        if (interaction.options.getSubcommand() === 'ticket') {
            const variantName = interaction.options.getString('variant_name');
            const description = interaction.options.getString('description');
            const emoji = interaction.options.getString('emoji') || '';
            const roleId = interaction.options.getRole('role').id;
            const categoryId = interaction.options.getChannel('category')?.id || null;
            const questionCount = interaction.options.getInteger('questions');

            await saveTicketVariant(interaction.guild.id, variantName, description, emoji, roleId, categoryId);

            if (questionCount === 0) {
                return interaction.reply({ content: `Ticket variant "${variantName}" has been set up with no questions.`, ephemeral: true });
            }
            await interaction.deferReply({ ephemeral: true });
            const questions = [];
            for (let i = 0; i < questionCount; i++) {
                await interaction.editReply({ content: `Please provide the title for question ${i + 1}:`, ephemeral: true });
                const questionTitle = await interaction.channel.awaitMessages({
                    filter: m => m.author.id === interaction.user.id,
                    max: 1,
                    time: 60000,
                    errors: ['time']
                }).then(collected => {
                    const message = collected.first();
                    message.delete();
                    return message.content;
                }).catch(() => null);

                if (!questionTitle) {
                    return interaction.followUp({ content: 'You did not provide a question title in time.', ephemeral: true });
                }

                await interaction.editReply({ content: `Please provide the placeholder for question ${i + 1}:`, ephemeral: true });
                const questionPlaceholder = await interaction.channel.awaitMessages({
                    filter: m => m.author.id === interaction.user.id,
                    max: 1,
                    time: 60000,
                    errors: ['time']
                }).then(collected => {
                    const message = collected.first();
                    message.delete();
                    return message.content;
                }).catch(() => null);

                if (!questionPlaceholder) {
                    return interaction.followUp({ content: 'You did not provide a question placeholder in time.', ephemeral: true });
                }

                await interaction.editReply({ content: `Please provide the type for question ${i + 1} (Short, Paragraph, Number):`, ephemeral: true });
                const questionType = await interaction.channel.awaitMessages({
                    filter: m => m.author.id === interaction.user.id,
                    max: 1,
                    time: 60000,
                    errors: ['time']
                }).then(collected => {
                    const message = collected.first();
                    message.delete();
                    return message.content;
                }).catch(() => null);

                if (!questionType) {
                    return interaction.followUp({ content: 'You did not provide a question type in time.', ephemeral: true });
                }
                var question = ""
                questions.push({ questionTitle, questionPlaceholder, questionType, question });
            }

            for (let i = 0; i < questions.length; i++) {
                const { questionTitle, questionPlaceholder, questionType, question } = questions[i];
                await saveTicketQuestions(interaction.guild.id, variantName, i, questionTitle, questionPlaceholder, questionType, question);
            }

            await interaction.editReply({ content: `Ticket variant "${variantName}" has been set up with ${questionCount} questions.`, ephemeral: true });
        } else if (interaction.options.getSubcommand() === 'log') {
            const logChannel = interaction.options.getChannel('channel');
            await saveLogChannel(interaction.guild.id, logChannel.id);
            await interaction.reply({ content: `Log channel has been set to ${logChannel}.`, ephemeral: true });
        }
    },
};
