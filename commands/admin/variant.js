const { SlashCommandBuilder } = require('@discordjs/builders');
const { updateTicketVariant, deleteTicketVariant, getTicketVariants } = require('../../globalsql');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('variant')
    .setDescription('Manage ticket variants')
    .addSubcommand(subcommand =>
      subcommand
        .setName('update')
        .setDescription('Update an existing ticket variant')
        .addStringOption(option => 
          option.setName('variantname')
            .setDescription('The name of the variant')
            .setRequired(true)
            .setAutocomplete(true))
        .addStringOption(option => option.setName('description').setDescription('The description of the variant').setRequired(true))
        .addStringOption(option => option.setName('roleid').setDescription('The role ID of the variant').setRequired(true))
        .addStringOption(option => option.setName('emoji').setDescription('The emoji of the variant').setRequired(false))
        .addStringOption(option => option.setName('categoryid').setDescription('The category ID of the variant').setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('delete')
        .setDescription('Delete an existing ticket variant')
        .addStringOption(option => 
          option.setName('variantname')
            .setDescription('The name of the variant')
            .setRequired(true)
            .setAutocomplete(true))),
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (subcommand === 'update') {
      const variantName = interaction.options.getString('variantname');
      const description = interaction.options.getString('description');
      const emoji = interaction.options.getString('emoji');
      const roleId = interaction.options.getString('roleid');
      const categoryId = interaction.options.getString('categoryid');

      try {
        await updateTicketVariant(guildId, variantName, description, emoji, roleId, categoryId);
        await interaction.reply({ content: `Ticket variant "${variantName}" updated successfully.`, ephemeral: true });
      } catch (error) {
        console.error('Error updating ticket variant:', error);
        await interaction.reply({ content: `An error occurred while updating the ticket variant.`, ephemeral: true });
      }
    } else if (subcommand === 'delete') {
      const variantName = interaction.options.getString('variantname');

      try {
        await deleteTicketVariant(guildId, variantName);
        await interaction.reply({ content: `Ticket variant "${variantName}" deleted successfully.`, ephemeral: true });
      } catch (error) {
        console.error('Error deleting ticket variant:', error);
        await interaction.reply({ content: `An error occurred while deleting the ticket variant.`, ephemeral: true });
      }
    }
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
