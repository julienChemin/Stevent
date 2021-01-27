const { guildSnowflake, 
    dmCategorySnowflake, 
    channelArchivesSnowflake, 
    emojiSuccessSnowflake, 
    emojiFailureSnowflake } = require('../../config.json');
const anonymousHandler = require("./../anonymousHandler.js");

module.exports = {
    name: 'dm',
    description: 'Dm an anonymous user. User depend on the anonymous channel where you use that command. Work only on anonymous channel.',
    usage: '<(string) command name, (string) message>',
    guildOnly: true,
    snowflakeCategory: dmCategorySnowflake,
    forbiddenChannel: [channelArchivesSnowflake],
    cooldown: 0,
    execute: (client, message, args) => {
        const Guild = client.guilds.cache.get(guildSnowflake);
        const anonymousCategory = Guild.channels.cache.get(dmCategorySnowflake);
        const emojiSuccess = Guild.emojis.cache.get(emojiSuccessSnowflake) !== undefined ? Guild.emojis.cache.get(emojiSuccessSnowflake) : '💜';
        const emojiFailure = Guild.emojis.cache.get(emojiFailureSnowflake) !== undefined ? Guild.emojis.cache.get(emojiFailureSnowflake) : '💔';

        if (anonymousCategory.children.get(message.channel.id) === undefined) {
            //the message is not send in an anonymous channel
            return;
        }

        // get user id to dm, depending on the channel the message was sent
        const anonymousId = anonymousHandler.getIdByChannel(message.channel.id, false);
        const idToDm = anonymousHandler.getIdByChannel(message.channel.id);
        
        if (idToDm === undefined) {
            message.reply(`Sorry, i can't find this user`);
            console.error("Can't find the Id to respond to this anonyme user");
            return;
        }

        if (anonymousHandler.blockedUsers[anonymousId] !== undefined) {
            return message.reply(`Can't Dm this user, she/he is blocked\nReason : ${anonymousHandler.blockedUsers[anonymousId]}`);
        }

        // get user with his Id
        const userToRespond = client.users.cache.get(idToDm);

        // take off ".dm " from the message content before sending it
        const messageContent = message.content.substr(3);

        userToRespond.send(anonymousHandler.getEmbed(messageContent, message.author.username, message.author))
            .then(() => {
                message.react(emojiSuccess);
            }).catch(() => {
                message.react(emojiFailure);
                message.reply(`I can't Dm this user`);
            });
    }
}