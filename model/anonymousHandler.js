const db = require('./db');
const Discord = require('discord.js');
const { prefixe_table,
    table_anonymous_user } = require('../config.json');
const table_anonymous_with_prefixe = `${prefixe_table}${table_anonymous_user}`;
const { uniqueNamesGenerator, adjectives, colors, animals } = require('unique-names-generator');

const anonymousHandler = {
    anonymousUsersId: {}, // user_id: anonymous_user_id

    init: () => {
        return new Promise((resolve, reject) => {
            db.query(`SELECT user_id, anonymous_user_id FROM ${table_anonymous_with_prefixe}`).on('result', row => {
                anonymousHandler.anonymousUsersId[row.user_id] = row.anonymous_user_id;
            }).on('error', (error) => {
                reject(`Error while initializing AnonymousDm: ${error}`);
            }).on('end', resolve);
        });
    },

    getChannelId: async (anonymousUserId) => {
        const result = await db.asyncQuery(`SELECT channel_id FROM ${table_anonymous_with_prefixe} WHERE anonymous_user_id = '${anonymousUserId}'`);

        if (result === undefined) {
            return false;
        } else {
            return result.channel_id;
        }
    },

    getIdByChannel: async (channelId, trueId = true) => {
        const result = await db.asyncQuery(`SELECT anonymous_user_id FROM ${table_anonymous_with_prefixe} WHERE channel_id = '${channelId}'`);

        if (!trueId) {
            return result.anonymous_user_id;
        } else {
            return anonymousHandler.getUserIdByAnonymousId(result.anonymous_user_id);
        }
    },

    getAnonymousIdByUserId: async (userId) => {
        const result = await db.asyncQuery(`SELECT anonymous_user_id FROM ${table_anonymous_with_prefixe} WHERE user_id = '${userId}'`);
        return result.anonymous_user_id;
    },
    
    getUserIdByAnonymousId: async (anonymousUserId) => {
        const result = await db.asyncQuery(`SELECT user_id FROM ${table_anonymous_with_prefixe} WHERE anonymous_user_id = '${anonymousUserId}'`);
        return result.user_id;
    },

    getPseudo: async (anonymousUserId) => {
        const result = await db.asyncQuery(`SELECT anonymous_pseudo FROM ${table_anonymous_with_prefixe} WHERE anonymous_user_id = '${anonymousUserId}'`);
        return result.anonymous_pseudo;
    },

    setAnonymousUser: async (userId, anonymousUserId, pseudo) => {
        return await db.asyncQuery(`INSERT INTO ${table_anonymous_with_prefixe} (user_id, anonymous_user_id, anonymous_pseudo) VALUES ('${userId}', '${anonymousUserId}', '${pseudo}')`);
    },

    setAnonymousChannel: async (anonymousUserId, channelId) => {
        return await db.asyncQuery(`UPDATE ${table_anonymous_with_prefixe} SET channel_id = '${channelId}' WHERE anonymous_user_id = '${anonymousUserId}'`);
    },

    unsetAnonymousChannel: async (anonymousUserId) => {
        return await db.asyncQuery(`UPDATE ${table_anonymous_with_prefixe} SET channel_id = null WHERE anonymous_user_id = '${anonymousUserId}'`);
    },

    blockUser: async (anonymousUserId, reason) => {
        return await db.asyncQuery(`UPDATE ${table_anonymous_with_prefixe} SET is_blocked = 1, blocking_reason = '${reason}' WHERE anonymous_user_id = '${anonymousUserId}'`);
    },

    unblockUser: async (id) => {
        const regex = /\d{16,19}$/u;//TODO j'ai ajouté "$" au regex pour qu'il passe le test ici car avec le faux encryptage de l'id => (id anonyme = id + "fake")
        if (regex.test(id)) {
            // user_id
            return await db.asyncQuery(`UPDATE ${table_anonymous_with_prefixe} SET is_blocked = 0, blocking_reason = null WHERE user_id = '${id}'`);
        } else {
            // anonymous_user_id
            return await db.asyncQuery(`UPDATE ${table_anonymous_with_prefixe} SET is_blocked = 0, blocking_reason = null WHERE anonymous_user_id = '${id}'`);
        }
    },

    isBlocked: async (anonymousUserId) => {
        return await db.asyncQuery(`SELECT is_blocked, blocking_reason FROM ${table_anonymous_with_prefixe} WHERE anonymous_user_id = '${anonymousUserId}'`);
    },

    getEmbed: (messageContent, username, author = null) => {
        // author = null mean anonymous dm
        const embed = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setDescription(messageContent);
    
        if (author !== null) {
            embed.setAuthor(`${author.tag} aka ${username}`, author.avatarURL());
        } else {
            embed.setAuthor(username)
                .setFooter("!closedm to end this conversation and close the channel.\n!ignore <reason> to block this user");
        }
    
        return embed;
    },

    encrypting: (string) => {
        return string += 'fake';
    },

    createRandomName: () => {
        return uniqueNamesGenerator({ dictionaries: [adjectives, colors, animals] });
    }
}
module.exports = anonymousHandler;