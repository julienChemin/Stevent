const Discord = require('discord.js');
const { prefixe } = require('../../config.json');

module.exports = {
    name: 'help',
    aliases: ['command', 'commands'],
    description: 'display all commands or info about a specific command',
    usage: '<[command name]>',
    cooldown: 5,
    execute(message, args) {
        const { commands } = message.client;
        if (!args.length) {
            // display all commands
            const data = [];
            data.push(`Liste des commandes :`);
            data.push(commands.map(cmd => `${prefixe}${cmd.name} ${cmd.usage || ''}`).join('\n'));
            data.push(`You can use ${prefixe}help <command name> to get more info.`);
            return message.author.send(data, {split:true})
                .then(() => {
                    if (message.channel.type === 'dm') {
                        return;
                    } else {
                        message.reply('I send you a DM dude');
                    }
                }).catch(error => {
                    console.log(`Can't send DM to this user : ${message.author.tag}, ${error}`);
                    message.reply('looks like i can\'t DM you, sry.');
                });
        } else {
            // display info about a specific command
            const name = args[0];
            const command = commands.get(name) || commands.find(cmd => cmd.aliases && cmd.aliases.includes(name));
            if (!command) {
                return message.channel.send(`I don't have a command with this name`);
            } else {
                const data = [];
                data.push(`${command.name} (${command.aliases || 'no aliases'})`);
                data.push(`${command.description}`);
                data.push(`${prefixe}${command.name} ${command.usages || ''}`);
                return message.channel.send(data);
            }
        }
    }
}