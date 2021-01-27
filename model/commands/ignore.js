const { dmCategorySnowflake, 
    channelArchivesSnowflake } = require('../../config.json');
const anonymousHandler = require("./../anonymousHandler.js");

module.exports = {
    name: 'ignore',
    aliases: ['rekt'],
    description: 'prevent an user to dm the bot. Blocked user depend on the anonymous channel where you use that command. Work only on anonymous channel.',
    usage: '<(string) command name, [(string) reason]>',
    guildOnly: true,
    snowflakeCategory: dmCategorySnowflake,
    forbiddenChannel: [channelArchivesSnowflake],
    cooldown: 5,
    execute(client, message, args) {
        if (message.channel.id === channelArchivesSnowflake) {
            // avoid the "archives" channel
            return;
        }

        // get anonymous user id depending on the channel
        const anonymousId = anonymousHandler.getIdByChannel(message.channel.id, false);

        if (anonymousHandler.blockedUsers[anonymousId] !== undefined) {
            return message.reply(`This user is already banned\nReason : ${anonymousHandler.blockedUsers[anonymousId]}`);
        }

        // setup args
        let strArgs = '';
        if (args.length > 0) {
            strArgs = args.join(' ').trim();
        }

        const reason = strArgs === '' ? "no reason provided" : strArgs;

        //TODO log in db
        // db.query(`INSERT INTO blocked_user VALUES ('${anonymousId}', reason)`);
        
        // log blocked user in memory
        anonymousHandler.blockedUsers[anonymousId] = reason;

        // get user id to dm, depending on the channel the message was sent
        const idToDm = anonymousHandler.getIdByChannel(message.channel.id);
        
        if (idToDm === undefined) {
            message.reply(`Sorry, i can't find this user`);
            console.error("Can't find the Id to respond to this anonyme user");
            return;
        }

        // get user with his Id
        const userToRespond = client.users.cache.get(idToDm);

        // tell to the user that she/he is blocked
        userToRespond.send(`You can't send private message anymore because you were blocked by the bot`).then(() => {
            message.channel.send(`User blocked succcesssfullly`);
        }).catch(error => {
            message.channel.send(`I can't block this user.. reason : ${error}`);
        });
    }
}