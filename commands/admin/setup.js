const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, StringSelectMenuBuilder } = require('discord.js');
const { saveSetupData, updateCommandStatus, setLogChannel, addWelcomeRole, setWelcomeChannel, getWelcomeRoles } = require('../../globalsql');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Sets up server configurations.'),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ ephemeral: true, content: "You do not have permission to use this command." });
        }

        await interaction.deferReply({ ephemeral: true });

    },
};
