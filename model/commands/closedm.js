const Discord = require('discord.js');
const fs = require("fs");
const { dmCategorySnowflake, channelArchivesSnowflake } = require('../../config.json');
const anonymousHandler = require("./../anonymousHandler.js");

const writeFile = (filePath, fileContent) => {
    return new Promise((resolve, reject) => {
        fs.writeFile(filePath, fileContent, writeFileError => {
            if (writeFileError) {
                reject(writeFileError);
                return;
            }
            
            resolve(filePath);
        });
    });
}

module.exports = {
    name: 'closedm',
    aliases: ['close-dm', 'close_dm'],
    description: 'Close an anonymousDm channel and archive discussion',
    usage: '<[command name]>',
    guildOnly: true,
    snowflakeCategory: dmCategorySnowflake,
    cooldown: 5,
    execute(message, args) {
        if (message.channel.id === channelArchivesSnowflake) {
            // avoid to delete the "archives" channel
            return;
        }

        const anonymousCategory = message.guild.channels.cache.get(dmCategorySnowflake);
        const archivesChannel = anonymousCategory.children.get(channelArchivesSnowflake);   

        // get anonymous user id depending on the channel
        const anonymousId = anonymousHandler.getIdByChannel(message.channel.id, false);

        // get all archives for this anonymous id
        const archiveOfThisUser = fs.readdirSync('./util/archivesDm').filter(file => file.startsWith(anonymousId));

        message.channel.messages.fetch().then(async messages => {
            const archiveFolderFilePath = `./util/archivesDm/${anonymousId}-${(archiveOfThisUser.length + 1)}.txt`;
            let fileContent = "";
            messages.array().reverse().map(msg => {
                const username = msg.author.username === 'Stevent' ? "Anonymous user" : `${msg.author.tag} aka ${msg.author.username}`;
                const content = msg.content !== '' ? msg.content : msg.embeds[0].content;
                fileContent += `${username} \n\n`;
                fileContent += `${content} \n\n`;
                fileContent += `____ ____ ____ ____ ____ ____ ____ ____ \n\n`;
            });
            const filepath = await writeFile(archiveFolderFilePath, fileContent).catch(error => {
                message.reply(`Look like i can't set the archive .. \n Error : ${error}`);
            });

            archivesChannel.send(`Archive ${anonymousId}`, {
                files:[{
                    attachment: filepath
                }]
            }).then(() => {
                message.channel.delete();
            }).catch(error => {
                message.reply(`I don't know why but, i can't delete this channel.. Just do it !`);
            });
        });
    }
}