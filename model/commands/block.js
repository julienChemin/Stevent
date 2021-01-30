const { dmCategorySnowflake, 
    channelArchivesSnowflake,
    uniqueChannels } = require('../../config.json');
const anonymousHandler = require("./../anonymousHandler.js");

module.exports = {
    name: 'block',
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
        if (blockedUser.is_blocked) {
            return message.reply(`This user is already blocked \nReason : ${blockedUser.blocking_reason}`);
        }

        // setup args
        let reason = 'no reason provided';
        if (args.length > 0) {
            reason = args.join(' ').trim();
        }

        // set is_blocked as true
        await anonymousHandler.blockUser(anonymousId, reason).catch(error => {
            console.error(`Can't block this user \nError : ${error}`);
        });

        // get user id to dm, depending on the channel the message was sent
        const idToDm = await anonymousHandler.getIdByChannel(message.channel.id).catch(error => {
            console.error(`Can't find user id \nError : ${error}`);
        });

        // get user with his Id
        const userToRespond = await client.users.fetch(idToDm).catch(error => {
            console.error(`Can't find this user \nError : ${error}`);
            return message.reply(`Can't find this user`);
        });

        // tell to the user that she/he is blocked
        userToRespond.send(`You can't send private message anymore because you were blocked by the bot`).then(() => {
            return message.channel.send(`User succcesssfullly blocked`);
        }).catch(error => {
            return message.channel.send(`I can't DM this user to tell that she/he is blocked \nError : ${error}`);
        });
    }
}