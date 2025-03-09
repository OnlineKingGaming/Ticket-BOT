const mysql = require("mysql");
const { PermissionsBitField, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder, StringSelectMenuBuilder } = require('discord.js');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  timezone: '+01:00' // Set timezone to UTC+1
});

connection.connect(err => {
  if (err) throw err;
  console.log("Connected to MySQL");
});

// Add error handling for the connection
connection.on('error', (err) => {
  console.error('MySQL connection error:', err);
  // Handle the error appropriately, e.g., reconnect or exit process
});

// Function to execute a query
function executeQuery(query, params = []) {
  return new Promise((resolve, reject) => {
    connection.query(query, params, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

// Function to save ticket variant
async function saveTicketVariant(guildId, variantName, description, emoji, roleId, categoryId) {
  const query = `
    INSERT INTO ticket_variants (guild_id, variant_name, description, emoji, role_id, category_id)
    VALUES (?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE description = VALUES(description), emoji = VALUES(emoji), role_id = VALUES(role_id), category_id = VALUES(category_id)
  `;
  await executeQuery(query, [guildId, variantName, description, emoji, roleId, categoryId]);
}

// Function to get ticket variants
async function getTicketVariants(guildId) {
  const query = `SELECT * FROM ticket_variants WHERE guild_id = ?`;
  const results = await executeQuery(query, [guildId]);
  return results;
}

// Function to save ticket questions
async function saveTicketQuestions(guildId, variantName, questionIndex, questionTitle, questionPlaceholder, questionType, question) {
  const query = `
    INSERT INTO ticket_questions (guild_id, variant_name, question_index, question_title, question_placeholder, question_type, question)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE question_title = VALUES(question_title), question_placeholder = VALUES(question_placeholder), question_type = VALUES(question_type), question = VALUES(question)
  `;
  await executeQuery(query, [guildId, variantName, questionIndex, questionTitle, questionPlaceholder, questionType, question]);
}

// Function to get ticket questions
async function getTicketQuestions(guildId, variantName) {
  const query = `SELECT * FROM ticket_questions WHERE guild_id = ? AND variant_name = ? ORDER BY question_index`;
  const results = await executeQuery(query, [guildId, variantName]);
  return results;
}

// Function to save ticket transcript
async function saveTicketTranscript(guildId, channelId, messages) {
  const query = `
    INSERT INTO ticket_transcripts (guild_id, channel_id, messages)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE messages = VALUES(messages)
  `;
  await executeQuery(query, [guildId, channelId, JSON.stringify(messages)]);
}

// Function to save log channel
async function saveLogChannel(guildId, channelId) {
  const query = `
    INSERT INTO log_channels (guild_id, channel_id)
    VALUES (?, ?)
    ON DUPLICATE KEY UPDATE channel_id = VALUES(channel_id)
  `;
  await executeQuery(query, [guildId, channelId]);
}

// Function to get log channel
async function getLogChannel(guildId) {
  const query = `SELECT channel_id FROM log_channels WHERE guild_id = ?`;
  const results = await executeQuery(query, [guildId]);
  return results.length > 0 ? results[0].channel_id : null;
}

// Function to log message
async function logMessage(guild, title, description, color) {
  const logChannelId = await getLogChannel(guild.id);
  if (logChannelId) {
    const logChannel = guild.channels.cache.get(logChannelId);
    if (logChannel) {
      const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(color)
        .setTimestamp();
      await logChannel.send({ embeds: [embed] });
    }
  }
}

// Function to create ticket channel
async function createTicketChannel(interaction, variantName, fields = null) {
  const guild = interaction.guild;
  const member = interaction.member;
  const variant = await getTicketVariants(guild.id).then(variants => variants.find(v => v.variant_name === variantName));

  if (!variant) {
    return interaction.reply({ content: `Ticket variant "${variantName}" not found.`, ephemeral: true });
  }

  const role = guild.roles.cache.get(variant.role_id);
  if (!role) {
    return interaction.reply({ content: `Role with ID "${variant.role_id}" not found.`, ephemeral: true });
  }

  const channelOptions = {
    name: `${variantName.toLowerCase()}-${member.user.username}`,
    type: ChannelType.GuildText,
    permissionOverwrites: [
      {
        id: guild.id,
        deny: [PermissionsBitField.Flags.ViewChannel],
      },
      {
        id: member.id,
        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory],
      },
      {
        id: role.id,
        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory],
      },
    ],
  };

  if (variant.category_id) {
    channelOptions.parent = variant.category_id;
  }

  const channel = await guild.channels.create(channelOptions);

  const embed = new EmbedBuilder()
    .setTitle('Ticket Created')
    .setDescription(`A staff member will be with you shortly, ${member.user.username}.`)
    .setThumbnail(member.guild.iconURL())
    .setColor(0x00FF00)
    .setTimestamp();

  if (fields) {
    const questions = await getTicketQuestions(guild.id, variantName);
    questions.forEach((question, index) => {
      const response = fields.getTextInputValue(`question_${index}`);
      embed.addFields({ name: question.question_title, value: response });
    });
  }

  const closeButton = new ButtonBuilder()
    .setCustomId(`closeTicket_${channel.id}`)
    .setLabel('Close Ticket')
    .setStyle(ButtonStyle.Danger);

  const closeWithReasonButton = new ButtonBuilder()
    .setCustomId(`closeTicketWithReason_${channel.id}`)
    .setLabel('Close with Reason')
    .setStyle(ButtonStyle.Secondary);

  const saveTranscriptButton = new ButtonBuilder()
    .setCustomId(`saveTranscript_${channel.id}`)
    .setLabel('Save Transcript')
    .setStyle(ButtonStyle.Secondary);

  const row = new ActionRowBuilder().addComponents(closeButton, closeWithReasonButton, saveTranscriptButton);

  await channel.send({ embeds: [embed], components: [row], content: `<@${member.id}>` });

  await interaction.reply({ content: `Ticket created: ${channel} (ID: ${channel.id})`, ephemeral: true });

  // Log the ticket creation
  await logMessage(guild, 'Ticket Created', `Ticket created by ${member.user.tag} in ${channel} (ID: ${channel.id}).`, 0x00FF00);

  // Deselect the value in the embed
}

// Function to close ticket
async function closeTicket(interaction, channelId, reason = null) {
  await interaction.deferReply({ ephemeral: true });
  const channel = interaction.guild.channels.cache.get(channelId);
  if (channel) {
    const msgs = await channel.messages.fetch({ limit: 10 });
    const botMessage = msgs.find(msg => msg.author.bot && msg.embeds.length > 0 && msg.mentions.users.size > 0);
    const member = botMessage ? botMessage.mentions.users.first() : null;
    const embed = new EmbedBuilder()
    .setTitle('Ticket Closed')
    .setDescription(`The ticket has been closed by ${interaction.user.username}.`)
    .addFields({ name: 'Reason', value: reason || 'No reason provided' }) // Ensure reason is a valid string
    .setColor(0xFF0000)
    .setTimestamp();

  await channel.send({ embeds: [embed] });

    const messages = await channel.messages.fetch({ limit: 100 });
    const transcript = messages.map(msg => ({
      author: msg.author.tag,
      content: msg.content,
      timestamp: msg.createdTimestamp
    }));

    await saveTicketTranscript(interaction.guild.id, channelId, transcript);

    const transcriptText = transcript.map(msg => `[${new Date(msg.timestamp).toLocaleString()}] ${msg.author}: ${msg.content}`).join('\n');
    const filePath = path.join(__dirname, `transcript_${channelId}.txt`);
    fs.writeFileSync(filePath, transcriptText);

    const attachment = new AttachmentBuilder(filePath);

    if (member) {
      const user = await interaction.guild.members.fetch(member.id);
      const dmEmbed = new EmbedBuilder()
        .setTitle('Ticket Closed')
        .setDescription(`Your ticket on server ${interaction.guild.name} has been closed by ${interaction.user.username}.`)
        .addFields({ name: 'Reason', value: reason || 'No reason provided' }) // Ensure reason is a valid string
        .setColor(0xFF0000)
        .setTimestamp();

      await user.send({ embeds: [dmEmbed], files: [attachment] });
    }

    fs.unlinkSync(filePath);

    setTimeout(() => {if (channel) channel.delete()}, 5000);
    await interaction.editReply({ content: `Ticket has been closed and will automatically delete soon. (ID: ${channel.id})`, ephemeral: true });

    // Log the ticket closure
    await logMessage(interaction.guild, 'Ticket Closed', `Ticket closed by ${interaction.user.tag} in ${channel} (ID: ${channel.id}). Reason: ${reason || 'No reason provided'}`, 0xFF0000);
  } else {
    await interaction.editReply({ content: `Ticket channel not found.`, ephemeral: true });
  }
}

// Function to save transcript
async function saveTranscript(interaction, channelId) {
  const channel = interaction.guild.channels.cache.get(channelId);
  if (channel) {
    const messages = await channel.messages.fetch({ limit: 100 });
    const transcript = messages.map(msg => ({
      author: msg.author.tag,
      content: msg.content,
      timestamp: msg.createdTimestamp
    }));

    await saveTicketTranscript(interaction.guild.id, channelId, transcript);

    const transcriptText = transcript.map(msg => `[${new Date(msg.timestamp).toLocaleString()}] ${msg.author}: ${msg.content}`).join('\n');
    const filePath = path.join(__dirname, `transcript_${channelId}.txt`);
    fs.writeFileSync(filePath, transcriptText);

    const attachment = new AttachmentBuilder(filePath);

    await channel.send({ content: 'Transcript saved:', files: [attachment] });

    fs.unlinkSync(filePath);

    await interaction.reply({ content: `Transcript saved for channel ${channel.name}.`, ephemeral: true });

    // Log the transcript saving
    await logMessage(interaction.guild, 'Transcript Saved', `Transcript saved for ${channel} by ${interaction.user.tag}.`, 0x00FF00);
  } else {
    await interaction.reply({ content: `Ticket channel not found.`, ephemeral: true });
  }
}

// Function to get ticket transcript by ticket ID
async function getTicketTranscript(guildId, channelId) {
  const query = `SELECT messages FROM ticket_transcripts WHERE guild_id = ? AND channel_id = ?`;
  const results = await executeQuery(query, [guildId, channelId]);
  return results.length > 0 ? JSON.parse(results[0].messages) : null;
}

module.exports = {
  executeQuery,
  saveTicketVariant,
  getTicketVariants,
  saveTicketQuestions,
  getTicketQuestions,
  createTicketChannel,
  closeTicket,
  saveTranscript,
  getTicketTranscript,
  saveLogChannel,
  getLogChannel,
  logMessage,
};
