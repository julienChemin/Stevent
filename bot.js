// file reader
const fs = require('fs');
const Discord = require('discord.js');
const { prefixe, token } = require("./config.json");

const client = new Discord.Client();
client.commands = new Discord.Collection();
const cooldowns = new Discord.Collection();

// get and set all commands
const commandFiles = fs.readdirSync('./model/commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./model/commands/${file}`);
    client.commands.set(command.name, command);
}

// client is ready
client.once('ready', () => {
    console.log('Let\'s try that !');
});

// on message
client.on('message', message => {
    // message without the good prefixe OR bot message
    if (!message.content.startsWith(prefixe) || message.author.bot) {
        return;
    }

    // setup args and command
    const args = message.content.slice(prefixe.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    // check if command exist
    const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
    if (!command) {
        return;
    }

    // check if message is guild or dm only and if this is the good channel
    if (command.guildOnly && message.channel.type === 'dm') {
        return message.channel.send('sorry, you can\'t ask me that in dm');
    }
    if (command.dmOnly && message.channel.type === 'text') {
        return message.channel.send('dude, this is private ! ask me in Dm..');
    }

    // check if args are require and if there are
    if (command.args && !args.length) {
        let response = 'There are missings args';
        if (command.usage) {
            response += `\n I expected : ${command.usage}`;
        }
        return message.reply(response);
    }

    //check cooldowns
    if (!cooldowns.has(command.name)) {
        cooldowns.set(command.name, new Discord.Collection());
    }
    
    const now = Date.now();
    const timestamps = cooldowns.get(command.name);
    const cooldown = (command.cooldown || 3) * 1000;
    if (timestamps.has(message.author.id)) {
        const expirationTime = timestamps.get(message.author.id) + cooldown;
        if (now < expirationTime) {
            const timeLeft = Math.ceil((expirationTime - now) / 1000);
            return message.channel.send(`Hey i'm not a robot, give me time, like.. ${timeLeft}sec`);
        } else {
            timestamps.set(message.author.id, now);
        }
    } else {
        timestamps.set(message.author.id, now);
    }

    try {
        command.execute(message, args);
    } catch (error) {
        console.error(error);
        message.reply('Sorry, i can\'t get what you said');
    }
});

// execute
client.login(token);