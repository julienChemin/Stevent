const Discord = require('discord.js');
const { guildSnowflake, 
    dmCategorySnowflake, 
    emojiSuccessSnowflake, 
    emojiFailureSnowflake,
    channelToPingForWarn,
    roleToPingForWarn,
    prefixe_table } = require('../config.json');

const anonymousHandler = require("./../model/anonymousHandler.js");
const maxChannelByCategory = 50;
const limiteAmountChannelBeforeWarning = Math.ceil((maxChannelByCategory * 60) / 100);

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

            // log anonymous_user (id / anonymous_id / pseudo) into db and memory
            await anonymousHandler.setAnonymousUser(message.author.id, anonymousId, randomPseudo).catch(error => {
                console.error(`Can't set a new anonymous user \nError : ${error}`);
            });
            anonymousHandler.anonymousUsersId[message.author.id] = anonymousId;
        }

        // log anonymous_user (id / anonymous_id) into  memory
        const anonymousUserId = anonymousHandler.anonymousUsersId[message.author.id];
        const pseudo = await anonymousHandler.getPseudo(anonymousUserId).catch(error => {
            console.error(`Can't find user's pseudo : ${error}`);
        });

        const {is_blocked} = await anonymousHandler.isBlocked(anonymousUserId);
        if (is_blocked) {
            // this user is blocked
            return message.channel.send(`You can't send private message anymore because you were blocked by the bot`);
        }

        if ((anonymousCategory.children.size + 1) >= limiteAmountChannelBeforeWarning) {
            // ping appropriate role to tell that the amount of channel is close to the max amount
            const roleToPing = Guild.roles.cache.get(roleToPingForWarn);
            const mention = roleToPing.toString();
            Guild.channels.cache.get(channelToPingForWarn).send(`${mention}, il y a ${anonymousCategory.children.size}/${maxChannelByCategory} channels dans la catégorie "DM anonyme - ${prefixe_table}". Remerciez Lily pour le ping.`);
        }

        let anonymousChannelId = await anonymousHandler.getChannelId(anonymousUserId).catch(error => {
            console.error(`Can't find anonymous channel id \nError : ${error}`);
        });
        if (!anonymousChannelId) {
            // this user don't have an anonymous channel open -> create that channel
            const newChannelName = `${pseudo}${anonymousUserId.substr(0, 5)}`;
            const newChannelPosition = anonymousCategory.children.size === 0 ? null : anonymousCategory.children.last.rawPosition ;
            try {
                //TODO overwrite permission to only modo or admin
                const newChannel = await Guild.channels.create(newChannelName, {
                    type: 'text',
                    parent: anonymousCategory,
                    position: newChannelPosition
                });

                // log channel_id into db
                await anonymousHandler.setAnonymousChannel(anonymousUserId, newChannel.id).catch(error => {
                    console.error(`Can't set a new anonymous channel \nError : ${error}`);
                });
                anonymousChannelId = newChannel.id;
            } catch (error) {
                console.error(`Can't create new channel : ${error}`);
            }
        }
        const anonymousChannel = anonymousCategory.children.get(anonymousChannelId);

        if (anonymousChannel === undefined) {
            //TODO might be a better way to handle this impossible error, idk
            console.error(`can't found the channel previously create on the anonymeDm channel`);
            return;
        }

        // embed the dm to post it on the anonymous channel
        anonymousChannel.send({
            embed: anonymousHandler.getEmbed(message.content, pseudo),
            files: message.attachments.map(messageAttachment => {
                return new Discord.MessageAttachment(messageAttachment.url, messageAttachment.filename);
            })
        }).then(() => {
            message.react(emojiSuccess);
        }).catch(() => {
            message.react(emojiFailure);
            message.reply(`I can't your message for now, try again a bit later`);
        });
    }
}

module.exports = AnonymousDm;