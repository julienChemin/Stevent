const { dmCategorySnowflake, 
    channelArchivesSnowflake,
    uniqueChannels } = require('../../config.json');
const anonymousHandler = require("./../anonymousHandler.js");

module.exports = {
    name: 'ignore',
    aliases: ['rekt'],
    description: 'prevent an user to dm the bot. Blocked user depend on the anonymous channel where you use that command. Work only on anonymous channel.',
    usage: '<(string) command name, [(string) reason]>',
    guildOnly: true,
    categoryOnly: dmCategorySnowflake,
    forbiddenChannel: uniqueChannels,
    cooldown: 5,
    execute: async (client, message, args) => {
        if (message.channel.id === channelArchivesSnowflake) {
            // avoid the "archives" channel
            return;
        }

        // get anonymous user id depending on the channel
        const anonymousId = await anonymousHandler.getIdByChannel(message.channel.id, false).catch(error => {
            console.error(`Can't find anonymous id \nError : ${error}`);
        });

        const blockedUser = await anonymousHandler.isBlocked(anonymousId);
        if (blockedUser.isBlocked) {
            return message.reply(`This user is already blocked \nReason : ${blockedUser.reason}`);
        }

        // setup args
        let strArgs = '';
        if (args.length > 0) {
            strArgs = args.join(' ').trim();
        }
        const reason = strArgs === '' ? "no reason provided" : strArgs;

        // log blocked user in db
        await anonymousHandler.ignoreUser(anonymousId, reason).catch(error => {
            console.error(`Can't ignore this user \nError : ${error}`);
        });

        // get user id to dm, depending on the channel the message was sent
        const idToDm = anonymousHandler.getIdByChannel(message.channel.id).catch(error => {
            console.error(`Can't find user id \nError : ${error}`);
        });

        // get user with his Id
        const userToRespond = client.users.cache.get(idToDm);
        if (userToRespond === undefined) {
            return message.reply(`Can't find this user in the cache`);
        }

        // tell to the user that she/he is blocked
        userToRespond.send(`You can't send private message anymore because you were blocked by the bot`).then(() => {
            message.channel.send(`User blocked succcesssfullly`);
        }).catch(error => {
            message.channel.send(`I can't DM this user to tell that she/he is blocked \nReason : ${error}`);
        });
    }
}