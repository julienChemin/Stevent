const { dmCategorySnowflake, 
    channelArchivesSnowflake,
    uniqueChannels } = require('../../config.json');
const anonymousHandler = require("./../anonymousHandler.js");

module.exports = {
    name: 'unblock',
    aliases: ['unrekt'],
    description: 'unblock an user. You can give a user_id or an anonymous_user_id',
    usage: '<(string) command name, (string) id>',
    guildOnly: true,
    cooldown: 1,
    execute: async (client, message, args) => {
        if (args.length < 1) {
            return message.channel.send(`You should provide me a user id or an anonymous id`);
        }

        let userId = null;
        let anonymousId = null;

        // get user id and anonymous user id
        const regex = /\d{16,19}$/u;
        if (!regex.test(args[0])) {
            userId = await anonymousHandler.getUserIdByAnonymousId(args[0]).catch(error => {
                console.error(`Can't find this user \nError : ${error}`);
            });
            anonymousId = args[0];
        } else {
            anonymousId = await anonymousHandler.getAnonymousIdByUserId(args[0]).catch(error => {
                console.error(`Can't find this anonymous user \nError : ${error}`);
            });
            userId = args[0];
        }

        if (userId === undefined || anonymousId === undefined) {
            // this ID is not in the database of anonymous_dm feature
            return message.reply(`This user is not in the database of anonymous_dm feature`);
        }

        //check if user is ban
        const blockedUser = await anonymousHandler.isBlocked(anonymousId);
        if (!blockedUser.is_blocked) {
            return message.reply(`This user is not blocked`);
        }

        // get user with his Id
        const userToRespond = await client.users.fetch(userId).catch(error => {
            console.error(`Can't find this user \nError : ${error}`);
            return message.reply(`Can't find this user`);
        });

        // set is_blocked as false
        await anonymousHandler.unblockUser(args[0]).catch(error => {
            console.error(`Can't unblock this user \nError : ${error}`);
        });

        // tell to the user that she/he is unblocked
        userToRespond.send(`You have been unblocked`).then(() => {
            return message.channel.send(`User succcesssfullly unblocked`);
        }).catch(error => {
            return message.channel.send(`I can't DM this user to tell that she/he is unblocked \nReason : ${error}`);
        });
    }
}