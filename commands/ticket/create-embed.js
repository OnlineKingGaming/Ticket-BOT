const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');
const { getTicketVariants } = require('../../globalsql');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('create-embed')
        .setDescription('Creates an embed with a select menu for ticket variations.')
        .addStringOption(option => 
            option.setName('variants')
                .setDescription('Comma-separated list of ticket variant names to include in the embed')
                .setRequired(false)
                .setAutocomplete(true)),
    async execute(interaction) {
        const variants = await getTicketVariants(interaction.guild.id);
        if (variants.length === 0) {
            return interaction.reply({ content: 'No ticket variants found. Please set up ticket variants first.', ephemeral: true });
        }

        const selectedVariants = interaction.options.getString('variants')?.split(',').map(v => v.trim()) || variants.map(v => v.variant_name);
        const filteredVariants = variants.filter(variant => selectedVariants.includes(variant.variant_name));

        const rows = [];
        for (let i = 0; i < filteredVariants.length; i += 25) {
            const options = filteredVariants.slice(i, i + 25).map(variant => ({
                label: `${variant.emoji ? `${variant.emoji} ` : ''}${variant.variant_name}`,
                value: variant.variant_name,
                description: variant.description
            }));

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId(`selectTicketVariant_${i / 25}`)
                .setPlaceholder('Select a ticket variant')
                .addOptions(options)
                .setMinValues(1)
                .setMaxValues(1);

            rows.push(new ActionRowBuilder().addComponents(selectMenu));
        }

        const embed = new EmbedBuilder()
            .setTitle('Create a Ticket')
            .setDescription('Please select a ticket variant from the menu below.')
            .setColor(0x00FF00);

        await interaction.reply({ embeds: [embed], components: rows, ephemeral: false });
    },
    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused();
        const variants = await getTicketVariants(interaction.guild.id);
        const choices = variants.map(variant => variant.variant_name);
        const filtered = choices.filter(choice => choice.startsWith(focusedValue));
        await interaction.respond(
            filtered.map(choice => ({ name: choice, value: choice }))
        );
    },
};
