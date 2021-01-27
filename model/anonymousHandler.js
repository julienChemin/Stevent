const Discord = require('discord.js');
const { uniqueChannels } = require('../config.json');
const { uniqueNamesGenerator, adjectives, colors, animals } = require('unique-names-generator');

const anonymousHandler = {
    anonymousUsersId: {}, // user_id: anonymous_user_id
    anonymousPseudos: {}, // anonymous_user_id: anonymous_pseudo
    anonymousChannels: {}, // anonymous_user_id: channel_id
    blockedUsers: {}, // blocked_anonymous_user_id: reason

    //TODO delete commentary under (query)
    /* init: () => {
        return new Promise((resolve, reject) => {
            db.query('SELECT user_id, anonymous_user_id FROM anonymous_user').on('result', row => {
                anonymousHandler.anonymousUsersId[row.user_id] = row.anonymous_user_id;
            }).on('error', (error) => {
                reject(`Error loading AnonymousDm: ${error}`);
            }).on('end', resolve);
        });
    }, */

    getIdByChannel: (channelId, trueId = true) => {
        const arrKey = Object.keys(anonymousHandler.anonymousChannels);
        const arrChannel = Object.values(anonymousHandler.anonymousChannels);
        
        for (let i = 0; i < arrChannel.length; i++) {
            if (arrChannel[i] === channelId) {
                if (trueId) {
                    return anonymousHandler.getUserIdByAnonymousId(arrKey[i]);
                }
                return arrKey[i];
            }
        }
        return undefined;
    },
    
    getUserIdByAnonymousId: (anonymousId) => {
        const arrKey = Object.keys(anonymousHandler.anonymousUsersId);
        const arrUser = Object.values(anonymousHandler.anonymousUsersId);
        
        for (let i = 0; i < arrUser.length; i++) {
            if (arrUser[i] === anonymousId) {
                return arrKey[i];
            }
        }
        return undefined;
    },

    getEmbed: (messageContent, author = null) => {
        // author = null mean anonymous dm
        const embed = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .addField('Message', messageContent);
    
        if (author !== null) {
            embed.setAuthor(`${author.tag} aka ${author.username}`, author.avatarURL());
        } else {
            embed.setAuthor(`Anonyme user`)
                .setFooter("Use !closedm to end this conversation and close the channel");
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