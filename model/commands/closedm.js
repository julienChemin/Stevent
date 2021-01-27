const fs = require("fs");
const { dmCategorySnowflake, 
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
    snowflakeCategory: dmCategorySnowflake,
    forbiddenChannel: [channelArchivesSnowflake],
    cooldown: 3,
    execute(client, message, args) {
        const anonymousCategory = message.guild.channels.cache.get(dmCategorySnowflake);
        const archivesChannel = anonymousCategory.children.get(channelArchivesSnowflake);   

        // get anonymous user id depending on the channel
        const anonymousId = anonymousHandler.getIdByChannel(message.channel.id, false);

        // get all archives for this anonymous id
        const archiveOfThisUser = fs.readdirSync(archivesFolderPath).filter(file => file.startsWith(anonymousId));

        message.channel.messages.fetch().then(async messages => {
            const archiveFolderFilePath = `${archivesFolderPath}/${anonymousId}-${(archiveOfThisUser.length + 1)}.txt`;
            let fileContent = "";
            messages.array().reverse().map(msg => {
                const username = msg.author.username === 'Stevent' ? msg.embeds[0].author.name : `${msg.author.tag} aka ${msg.author.username}`;
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
                message.reply(`Look like i can't set the archive .. \n Error : ${error}`);
            });

            archivesChannel.send(`\n Archive ${anonymousId} \n`, {
                files:[{
                    attachment: filepath
                }]
            }).then(() => {
                message.channel.delete();
            }).catch(error => {
                message.reply(`Can't delete or order the channels : ${error}`);
            });
        });
    }
}