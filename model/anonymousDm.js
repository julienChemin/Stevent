const db = require('./db');
const { guildSnowflake, 
    dmCategorySnowflake, 
    emojiSuccessSnowflake, 
    emojiFailureSnowflake,
    channelToPingForWarn,
    roleToPingForWarn } = require('../config.json');

const anonymousHandler = require("./../model/anonymousHandler.js");
const { anonymousPseudos } = require('./../model/anonymousHandler.js');
const maxChannelByCategory = 50;
const limiteAmountChannelBeforeWarning = Math.ceil((maxChannelByCategory * 60) / 100);
const grade = "Modérateurs";

const AnonymousDm = {
    receiveDm: async (client, message) => {
        const Guild = client.guilds.cache.get(guildSnowflake);
        const anonymousCategory = Guild.channels.cache.get(dmCategorySnowflake);
        const emojiSuccess = Guild.emojis.cache.get(emojiSuccessSnowflake) !== undefined ? Guild.emojis.cache.get(emojiSuccessSnowflake) : '💜';
        const emojiFailure = Guild.emojis.cache.get(emojiFailureSnowflake) !== undefined ? Guild.emojis.cache.get(emojiFailureSnowflake) : '💔';

        if (anonymousHandler.anonymousUsersId[message.author.id] === undefined) {
            // first time this user dm anonymously -> create anonymous id + pseudo
            //TODO encrypter id
            const anonymousId = anonymousHandler.encrypting(message.author.id);
            const randomPseudo = anonymousHandler.createRandomName();

            //TODO log anonymous_user_id and random_user_name into db
            // db.query(`INSERT INTO anonymous_user VALUES ('${message.author.id}', '${anonymousId}')`);
            // db.query(`INSERT INTO anonymous_pseudo VALUES ('${anonymousId}', '${pseudo}')`);

            // log in memory
            anonymousHandler.anonymousUsersId[message.author.id] = anonymousId;
            anonymousHandler.anonymousPseudos[anonymousId] = randomPseudo;
        }
        const anonymousUserId = anonymousHandler.anonymousUsersId[message.author.id];
        const pseudo = anonymousHandler.anonymousPseudos[anonymousUserId];

        if (anonymousHandler.blockedUsers[anonymousUserId] !== undefined) {
            // this user is blocked
            return message.channel.send(`You can't send private message anymore because you were blocked by the bot`);
        }

        if ((anonymousCategory.children.size + 1) >= limiteAmountChannelBeforeWarning) {
            // ping appropriate role to tell that the amount of channel is close to the max amount
            const roleToPing = Guild.roles.cache.get(roleToPingForWarn);
            const mention = roleToPing.toString();
            Guild.channels.cache.get(channelToPingForWarn).send(`${mention}, il y a ${anonymousCategory.children.size}/${maxChannelByCategory} channels dans la catégorie "DM anonyme - ${grade}". Remerciez Lily pour le ping.`);
        }

        if (anonymousHandler.anonymousChannels[anonymousUserId] === undefined) {
            // first time this user dm anonymously -> create an associated channel
            const newChannelName = `${pseudo}${anonymousUserId.substr(0, 5)}`;
            const newChannelPosition = anonymousCategory.children.size === 0 ? null : anonymousCategory.children.last.rawPosition ;
            try {
                //TODO overwrite permission to only modo or admin
                const newChannel = await Guild.channels.create(newChannelName, {
                    type: 'text',
                    parent: anonymousCategory,
                    position: newChannelPosition
                });

                //TODO log anonymous_channel_id into db
                // db.query(`INSERT INTO anonymous_channel VALUES ('${anonymousId}', '${channelId}')`);

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
        anonymousChannel.send(anonymousHandler.getEmbed(message.content, pseudo))
            .then(() => {
                message.react(emojiSuccess);
            }).catch(() => {
                message.react(emojiFailure);
                message.reply(`I can't your message for now, try again a bit later`);
            });
    }
}

module.exports = AnonymousDm;