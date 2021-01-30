const Discord = require('discord.js');
const { guildSnowflake, 
    dmCategorySnowflake, 
    uniqueChannels, 
    emojiSuccessSnowflake, 
    emojiFailureSnowflake } = require('../../config.json');
const anonymousHandler = require("./../anonymousHandler.js");

module.exports = {
    name: 'dm',
    description: 'Dm an anonymous user. User depend on the anonymous channel where you use that command. Work only on anonymous channel.',
    usage: '<(string) command name, (string) message>',
    guildOnly: true,
    categoryOnly: dmCategorySnowflake,
    forbiddenChannel: uniqueChannels,
    cooldown: 0,
    execute: async (client, message, args) => {
        if (args.length < 1) {
            return;
        }

        const Guild = client.guilds.cache.get(guildSnowflake);
        const anonymousCategory = Guild.channels.cache.get(dmCategorySnowflake);
        const emojiSuccess = Guild.emojis.cache.get(emojiSuccessSnowflake) !== undefined ? Guild.emojis.cache.get(emojiSuccessSnowflake) : '💜';
        const emojiFailure = Guild.emojis.cache.get(emojiFailureSnowflake) !== undefined ? Guild.emojis.cache.get(emojiFailureSnowflake) : '💔';

        if (anonymousCategory.children.get(message.channel.id) === undefined) {
            //the message is not send in an anonymous channel
            return;
        }

        // get user id to dm, depending on the channel the message was sent
        const anonymousId = await anonymousHandler.getIdByChannel(message.channel.id, false).catch(error => {
            console.error(`Can't find anonymous id \nError : ${error}`);
        });

        const idToDm = await anonymousHandler.getIdByChannel(message.channel.id).catch(error => {
            console.error(`Can't find user id \nError : ${error}`);
        });

        const blockedUser = await anonymousHandler.isBlocked(anonymousId);
        if (blockedUser.is_blocked) {
            // this user is blocked
            return message.reply(`Can't Dm this user, she/he is blocked \nReason : ${blockedUser.blocking_reason}`);
        }

        // get user with his Id
        //TODO si j'ouvre une conv anonyme, puis que je stop le bot et le relance, et que j'essaie de repondre au dm, grosse erreur l'user n'est pas trouvable dans le cache
        const userToRespond = await client.users.fetch(idToDm).catch(error => {
            console.error(`Can't find this user \nError : ${error}`);
            return message.reply(`Can't find this user in the cache`);
        });

        // take off ".dm " from the message content before sending it
        //TODO maybe better to substr prefixe then command.name
        const messageContent = message.content.substr(3);

        userToRespond.send({
            embed: anonymousHandler.getEmbed(messageContent, message.author.username, message.author),
            files: message.attachments.map(messageAttachment => {
                return new Discord.MessageAttachment(messageAttachment.url, messageAttachment.filename);
            })
        }).then(() => {
            message.react(emojiSuccess);
        }).catch(() => {
            message.react(emojiFailure);
            message.reply(`I can't Dm this user`);
        });
    }
}