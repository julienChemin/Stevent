const Discord = require('discord.js');
const { prefixe } = require('../../config.json');

let index = 0;
const arrayEmoji = [];
const arrayEmbeds = [];
// page 1 (index 0)
arrayEmoji.push(['➡']);
arrayEmbeds.push(new Discord.MessageEmbed()
    .setColor('#0099ff')
    .setTitle('Shop')
    .setDescription('Récompenses potentielles')
    .setThumbnail('https://loirevintagediscovery.com/wp-content/uploads/2017/02/cadeau.jpeg')
    .setFooter('Page 1. Use ⬅️ ➡️ to navigate')
    .addField(`Vous connaissez Kwiziq ?`, `2 500 points`)
    .addField(`1 ans de nitro ?`, `1 000 points`));
// page 2 (index 1)
arrayEmoji.push(['⬅']);
arrayEmbeds.push(new Discord.MessageEmbed()
    .setColor('#0099ff')
    .setTitle('Shop')
    .setDescription('Récompenses potentielles')
    .setThumbnail('https://loirevintagediscovery.com/wp-content/uploads/2017/02/cadeau.jpeg')
    .setFooter('Page 2. Use ⬅️ ➡️ to navigate')
    .addField(`Lily vous fait livrer une pizza chez vous !`, `100 points`)
    .addField(`Julien enregistre un .sound 'damn' à votre image`, `100 000 points`));

function multipleReact(msg, arrayEmoji) {
    if (msg && arrayEmoji.length > 0) {
        arrayEmoji.map(emoji => msg.react(emoji));
    }
    return msg;
}

function checkReaction(embededMsg, emoji) {
    if (embededMsg && emoji) {
        switch (emoji) {
            case '➡':
                index++;
                break;
            case '⬅':
                index--;
                break;
        }
    }
}

module.exports = {
    name: 'shop',
    description: 'Display the event shop',
    guildOnly: true,
    cooldown: 5,
    execute(message, args) {
        const { commands } = message.client;
        const reactFilter = (reaction, user) => user.id === message.author.id && arrayEmoji[index].includes(reaction.emoji.name);
        const addReactToEmbed = (embededMsg) => {
            // add reactions on the 'shop' embed
            multipleReact(embededMsg, arrayEmoji[index]);
            embededMsg.awaitReactions(reactFilter, { max: 1, maxEmojis: 1, time: 15000 })
                .then(collectedReactions => {
                    if (!collectedReactions.first()) {
                        // user don't react
                        embededMsg.reactions.removeAll();
                    } else {
                        // user react
                        checkReaction(embededMsg, collectedReactions.first()._emoji.name);
                        embededMsg.reactions.removeAll()
                            .then(addReactToEmbed);
                        // set edited content
                        const newEmbed = arrayEmbeds[index]
                            .setAuthor(message.author.tag, message.author.avatarURL());
                        embededMsg.edit(newEmbed);
                    }
                });
        };

        // set content
        const newEmbed = arrayEmbeds[index]
            .setAuthor(message.author.tag, message.author.avatarURL());
        // Manage and send embed
        return message.channel.send(newEmbed)
            .then(addReactToEmbed)
            .catch(error => {
                console.log(error);
            });
    }
}