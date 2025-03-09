const mysql = require("mysql");
const axios = require("axios");
require('dotenv').config();

const connection = mysql.createConnection({
  host: "localhost",
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: "SmartSystems",
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

// Function to save setup data
async function saveSetupData(guildId, mutedRoleId) {
  const query = `
    INSERT INTO setup (guild_id, muted_role_id)
    VALUES (?, ?)
    ON DUPLICATE KEY UPDATE muted_role_id = VALUES(muted_role_id)
  `;
  await executeQuery(query, [guildId, mutedRoleId]);
}

// Function to get setup data
async function getSetupData(guildId) {
  const query = `SELECT * FROM setup WHERE guild_id = ?`;
  const results = await executeQuery(query, [guildId]);
  return results[0];
}

// Function to update command status
async function updateCommandStatus(guildId, command, status) {
  const query = `
    INSERT INTO command_status (guild_id, command, status)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE status = VALUES(status)
  `;
  await executeQuery(query, [guildId, command, status]);
}

// Function to check if a command is enabled
async function isCommandEnabled(guildId, command) {
  const query = `SELECT status FROM command_status WHERE guild_id = ? AND command = ?`;
  const results = await executeQuery(query, [guildId, command]);
  return results.length > 0 ? results[0].status : true;
}

// Function to set log channel
async function setLogChannel(guildId, channelId) {
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

// Function to save punishment data
async function savePunishmentData(guildId, userId, type, reason, expiresAt) {
  const formattedExpiresAt = expiresAt ? new Date(expiresAt).toISOString().slice(0, 19).replace('T', ' ') : null;
  const query = `
    INSERT INTO punishments (guild_id, user_id, type, reason, expires_at)
    VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE reason = VALUES(reason), expires_at = VALUES(expires_at)
  `;
  const result = await executeQuery(query, [guildId, userId, type, reason, formattedExpiresAt]);
  console.log(result.insertId)
  return result.insertId;
}

// Function to remove punishment data
async function removePunishmentData(guildId, userId, type, id = null) {
  let query = `DELETE FROM punishments WHERE guild_id = ? AND user_id = ? AND type = ?`;
  const params = [guildId, userId, type];
  if (id !== null) {
    query += ` AND id = ?`;
    params.push(id);
  }
  const result = await executeQuery(query, params);
  return result;
}

// Function to check if a user is punished
async function isUserPunished(guildId, userId, type) {
  const query = `SELECT * FROM punishments WHERE guild_id = ? AND user_id = ? AND type = ?`;
  const results = await executeQuery(query, [guildId, userId, type]);
  return results.length > 0 && (!results[0].expires_at || new Date(results[0].expires_at) > new Date());
}

// Function to check if a mute has expired
async function checkExpiredMutes(client) {
  const query = `SELECT * FROM punishments WHERE type = 'mute' AND expires_at IS NOT NULL AND expires_at <= CURRENT_TIMESTAMP`;
  const results = await executeQuery(query);
  for (const result of results) {
    const guild = client.guilds.cache.get(result.guild_id);
    if (guild) {
      const member = guild.members.cache.get(result.user_id);
      const setupData = await getSetupData(result.guild_id);
      if (member && setupData && setupData.muted_role_id) {
        const muteRole = guild.roles.cache.get(setupData.muted_role_id);
        if (muteRole) {
          await member.roles.remove(muteRole);
        }
      }
    }
    await removePunishmentData(result.guild_id, result.user_id, 'mute');
  }
}

// Function to check if a ban has expired
async function checkExpiredBans(client) {
  const query = `SELECT * FROM punishments WHERE type = 'ban' AND expires_at IS NOT NULL AND expires_at <= CURRENT_TIMESTAMP`;
  const results = await executeQuery(query);
  for (const result of results) {
    await removePunishmentData(result.guild_id, result.user_id, 'ban');
  }
}

// Function to get punishment data for a user
async function getPunishmentData(guildId, userId) {
  const query = `SELECT * FROM punishments WHERE guild_id = ? AND user_id = ?`;
  const results = await executeQuery(query, [guildId, userId]);
  return results;
}

// Function to get punishment data by ID
async function getPunishmentById(guildId, userId, type, id) {
  const query = `SELECT * FROM punishments WHERE guild_id = ? AND user_id = ? AND type = ? AND id = ?`;
  const results = await executeQuery(query, [guildId, userId, type, id]);
  return results[0];
}

// Function to save a note
async function saveNote(guildId, userId, note) {
  const query = `
    INSERT INTO notes (guild_id, user_id, note)
    VALUES (?, ?, ?)
  `;
  await executeQuery(query, [guildId, userId, note]);
}

// Function to get notes
async function getNotes(guildId, userId) {
  const query = `SELECT id, note FROM notes WHERE guild_id = ? AND user_id = ?`;
  const results = await executeQuery(query, [guildId, userId]);
  return results;
}

// Function to set welcome role
async function setWelcomeRole(guildId, roleId) {
  const query = `
    INSERT INTO welcome_roles (guild_id, role_id)
    VALUES (?, ?)
    ON DUPLICATE KEY UPDATE role_id = VALUES(role_id)
  `;
  await executeQuery(query, [guildId, roleId]);
}

// Function to get welcome role
async function getWelcomeRole(guildId) {
  const query = `SELECT role_id FROM welcome_roles WHERE guild_id = ?`;
  const results = await executeQuery(query, [guildId]);
  return results.length > 0 ? results[0].role_id : null;
}

// Function to add a welcome role
async function addWelcomeRole(guildId, roleId) {
  const query = `
    INSERT INTO welcome_roles (guild_id, role_id)
    VALUES (?, ?)
  `;
  await executeQuery(query, [guildId, roleId]);
}

// Function to remove a welcome role
async function removeWelcomeRole(guildId, roleId) {
  const query = `DELETE FROM welcome_roles WHERE guild_id = ? AND role_id = ?`;
  await executeQuery(query, [guildId, roleId]);
}

// Function to get welcome roles
async function getWelcomeRoles(guildId) {
  const query = `SELECT role_id FROM welcome_roles WHERE guild_id = ?`;
  const results = await executeQuery(query, [guildId]);
  return results.map(result => result.role_id);
}

// Function to set welcome channel
async function setWelcomeChannel(guildId, channelId) {
  const query = `
    INSERT INTO welcome_channels (guild_id, channel_id)
    VALUES (?, ?)
    ON DUPLICATE KEY UPDATE channel_id = VALUES(channel_id)
  `;
  await executeQuery(query, [guildId, channelId]);
}

// Function to get welcome channel
async function getWelcomeChannel(guildId) {
  const query = `SELECT channel_id FROM welcome_channels WHERE guild_id = ?`;
  const results = await executeQuery(query, [guildId]);
  return results.length > 0 ? results[0].channel_id : null;
}

module.exports = {
  executeQuery,
  saveSetupData,
  getSetupData,
  updateCommandStatus,
  isCommandEnabled,
  setLogChannel,
  getLogChannel,
  savePunishmentData,
  removePunishmentData,
  isUserPunished,
  checkExpiredMutes,
  checkExpiredBans,
  getPunishmentData,
  getPunishmentById,
  saveNote,
  getNotes,
  setWelcomeRole,
  getWelcomeRole,
  addWelcomeRole,
  removeWelcomeRole,
  getWelcomeRoles,
  setWelcomeChannel,
  getWelcomeChannel,
};
