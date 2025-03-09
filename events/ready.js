const { Events, ActivityType } = require('discord.js');
const { checkExpiredBans } = require('../globalsql');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(`Ready! Logged in as ${client.user.tag}`);

        function Status2() {
            client.user.setPresence({
        
              activities: [{
              
              type: ActivityType.Custom,
              
              name: "custom", // name is exposed through the API but not shown in the client for ActivityType.Custom
              
              state: "🪧 | CONFUSED? USE /help"
              
              }]
              
              })
            setTimeout(Status1, 10000)
          }
        
          function Status1() {
            client.user.setPresence({
        
              activities: [{
              
              type: ActivityType.Custom,
              
              name: "custom", // name is exposed through the API but not shown in the client for ActivityType.Custom
              
              state: "🔊 | LISTENING FOR /setup"
              
              }]
              
              })
            setTimeout(Status2, 10000)
          }
        
          Status1()
    },
};