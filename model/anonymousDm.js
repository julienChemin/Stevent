const Discord = require('discord.js');
const db = require('./db');
const { guildSnowflake, dmCategorySnowflake } = require('../config.json');

const anonymousHandler = require("./../model/anonymousHandler.js");

function getEmbed(message, author = null) {
    // author = null mean anonymous dm
    const embed = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .addField('Message', message.content);

    if (author !== null) {
        embed.setAuthor(`${author.tag} aka ${author.username}`, author.avatarURL());
    } else {
        embed.setAuthor(`Anonyme user`)
            .setFooter("Use !closedm to end this conversation and close the channel");
    }

    return embed;
}

const AnonymousDm = {
    receiveDm: async (client, message) => {
        const Guild = client.guilds.cache.get(guildSnowflake);
        const anonymousCategory = Guild.channels.cache.get(dmCategorySnowflake);

        if (anonymousHandler.anonymousUsersId[message.author.id] === undefined) {
            // first time this user dm anonymously -> create anonymous id
            //TODO encrypter id
            const anonymousId = anonymousHandler.fakeEncrypting(message.author.id);

            //TODO log in db
            // db.query(`INSERT INTO anonymous_user VALUES ('${message.author.id}', '${anonymousId}')`);

            // log in memory
            anonymousHandler.anonymousUsersId[message.author.id] = anonymousId;
        }
        const anonymousUserId = anonymousHandler.anonymousUsersId[message.author.id];

        if (anonymousHandler.anonymousChannels[anonymousUserId] === undefined) {
            // first time this user dm anonymously -> create an associated channel
            const newChannelName = `anonymous_chan_${anonymousCategory.children.size + 1}`;
            const newChannelPosition = anonymousCategory.children.size === 0 ? null : anonymousCategory.children.last.rawPosition ;
            try {
                //TODO overwrite permission to only modo or admin
                const newChannel = await Guild.channels.create(newChannelName, {
                    type: 'text',
                    parent: anonymousCategory,
                    position: newChannelPosition
                });
                //TODO log in db
                // kapoué db.query(`INSERT INTO anonymous_channel VALUES ('${anonymousId}', '${//channelId//}')`);
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
        anonymousChannel.send(getEmbed(message))
            .then(() => {
                //TODO edit to use guild emoji
                message.react('💜');
            }).catch(() => {
                //TODO edit to use guild emoji
                message.react('💔');
                message.reply(`I can't your message for now, try again a bit later`);
            });
    },

    replyToDm: (client, message) => {
        const Guild = client.guilds.cache.get(guildSnowflake);
        const anonymousCategory = Guild.channels.cache.get(dmCategorySnowflake);

        if (anonymousCategory.children.get(message.channel.id) === undefined) {
            //the message is not send in an anonymous channel
            return;
        }

        // get user id to dm, depending on the channel the message was sent
        const idToDm = anonymousHandler.getIdByChannel(message.channel.id);
        
        if (idToDm === undefined) {
            message.reply(`Sorry, i can't find this user`);
            console.error("Can't find the Id to respond to this anonyme user");
            return;
        }

        // get user with his Id
        const userToRespond = client.users.cache.get(idToDm);

        userToRespond.send(getEmbed(message, message.author))
            .then(() => {
                //TODO edit to use guild emoji
                message.react('💜');
            }).catch(() => {
                //TODO edit to use guild emoji
                message.react('💔');
                message.reply(`I can't Dm this user`);
            });
    }
}

module.exports = AnonymousDm;