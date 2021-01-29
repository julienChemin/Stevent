const fs = require("fs");
const { uniqueChannels,
    dmCategorySnowflake, 
    channelArchivesSnowflake,
    archivesFolderPath } = require('../../config.json');
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
    description: 'Close an anonymousDm channel and archive discussion. Depend on the anonymous channel where you use that command. Work only on anonymous channel.',
    usage: '<(string) command name>',
    guildOnly: true,
    categoryOnly: dmCategorySnowflake,
    forbiddenChannel: uniqueChannels,
    cooldown: 3,
    execute: async (client, message, args) => {
        const anonymousCategory = message.guild.channels.cache.get(dmCategorySnowflake);
        const archivesChannel = anonymousCategory.children.get(channelArchivesSnowflake);   

        // get anonymous user id depending on the channel, and anonymous pseudo
        const anonymousUserId = await anonymousHandler.getIdByChannel(message.channel.id, false).catch(error => {
            console.error(`Can't find anonymous id \nError : ${error}`);
        });
        const pseudo = await anonymousHandler.getPseudo(anonymousUserId).catch(error => {
            console.error(`Can't find user's pseudo : ${error}`);
        });

        const fullPseudo = `${pseudo}${anonymousUserId.substr(0, 5)}`;

        // get all archives for this anonymous id
        const archiveOfThisUser = fs.readdirSync(archivesFolderPath).filter(file => file.startsWith(fullPseudo));

        message.channel.messages.fetch().then(async messages => {
            const archiveFolderFilePath = `${archivesFolderPath}/${fullPseudo}-${(archiveOfThisUser.length + 1)}.txt`;
            let fileContent = "";
            messages.array().reverse().map(msg => {
                const username = msg.author.username === 'Stevent' ? fullPseudo : `${msg.author.tag} aka ${msg.author.username}`;
                let content = '';
                if (msg.content !== '') {
                    content = msg.content;
                } else {
                    for (field of msg.embeds[0].fields) {
                        content += `${field.value} \n`;
                    }
                }

                fileContent += `${username} \n\n`;
                fileContent += `${content} \n\n`;
                fileContent += `____ ____ ____ ____ ____ ____ ____ ____ \n\n`;
            });
            const filepath = await writeFile(archiveFolderFilePath, fileContent).catch(error => {
                message.reply(`Look like i can't set the archive \nError : ${error}`);
            });

            archivesChannel.send(`\n Archive ${fullPseudo}-${(archiveOfThisUser.length + 1)} \n`, {
                files:[{
                    attachment: filepath
                }]
            }).then(async () => {
                message.channel.delete();
                // set channel_id to null into db
                return await anonymousHandler.unsetAnonymousChannel(anonymousUserId).catch(error => {
                    console.error(`Can't set a new anonymous channel \nError : ${error}`);
                });
            }).catch(error => {
                message.reply(`Can't delete or order the channels : ${error}`);
            });
        });
    }
}