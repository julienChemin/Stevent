const db = require('./db');
const { guildSnowflake, 
    dmCategorySnowflake, 
    emojiSuccessSnowflake, 
    emojiFailureSnowflake } = require('../config.json');

const anonymousHandler = require("./../model/anonymousHandler.js");

const AnonymousDm = {
    receiveDm: async (client, message) => {
        const Guild = client.guilds.cache.get(guildSnowflake);
        const anonymousCategory = Guild.channels.cache.get(dmCategorySnowflake);
        const emojiSuccess = Guild.emojis.cache.get(emojiSuccessSnowflake) !== undefined ? Guild.emojis.cache.get(emojiSuccessSnowflake) : '💜';
        const emojiFailure = Guild.emojis.cache.get(emojiFailureSnowflake) !== undefined ? Guild.emojis.cache.get(emojiFailureSnowflake) : '💔';

        if (anonymousHandler.anonymousUsersId[message.author.id] === undefined) {
            // first time this user dm anonymously -> create anonymous id
            //TODO encrypter id
            const anonymousId = anonymousHandler.encrypting(message.author.id);

            //TODO log in db
            // db.query(`INSERT INTO anonymous_user VALUES ('${message.author.id}', '${anonymousId}')`);

            // log in memory
            anonymousHandler.anonymousUsersId[message.author.id] = anonymousId;
        }
        const anonymousUserId = anonymousHandler.anonymousUsersId[message.author.id];

        if (anonymousHandler.blockedUsers[anonymousUserId] !== undefined) {
            // this user is blocked
            return message.channel.send(`You can't send private message anymore because you were blocked by the bot`);
        }

        if (anonymousHandler.anonymousChannels[anonymousUserId] === undefined) {
            // first time this user dm anonymously -> create an associated channel
            const newChannelName = `anonymous_chan_${anonymousCategory.children.size}`;
            const newChannelPosition = anonymousCategory.children.size === 0 ? null : anonymousCategory.children.last.rawPosition ;
            try {
                //TODO overwrite permission to only modo or admin
                const newChannel = await Guild.channels.create(newChannelName, {
                    type: 'text',
                    parent: anonymousCategory,
                    position: newChannelPosition
                });

                //TODO log in db
                // db.query(`INSERT INTO anonymous_channel VALUES ('${anonymousId}', '${//channelId//}')`);

                // log in memory
                anonymousHandler.anonymousChannels[anonymousUserId] = newChannel.id;
            } catch (error) {
                console.error(`Can't create new channel : ${error}`);
            }
        }
        const anonymousChannelId = anonymousHandler.anonymousChannels[anonymousUserId];
        const anonymousChannel = anonymousCategory.children.get(anonymousChannelId);

        if (anonymousChannel === undefined) {
            //TODO might be a better way to handle this error, idk
            console.error(`can't found the channel previously create on the anonymeDm channel`);
            return;
        }

        // embed the dm to post it on the anonymous channel
        anonymousChannel.send(anonymousHandler.getEmbed(message.content))
            .then(() => {
                message.react(emojiSuccess);
            }).catch(() => {
                message.react(emojiFailure);
                message.reply(`I can't your message for now, try again a bit later`);
            });
    }
}

module.exports = AnonymousDm;