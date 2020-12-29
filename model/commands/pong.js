module.exports = {
    name: "pong",
    description: "say 'pong' as many time as you want",
    guildOnly: true,
    args: true,
    usage:'<number>',
    execute(message, args) {
        if (isNaN(args[0])) {
            return;
        }

        let response = '';
        if (args[0] > 0 && args[0] <= 50) {
            // 1 - 50 include
            do {
                response += 'pong ';
                args[0]--;
            } while (args[0] !== 0);
        } else if (args[0] <= 0) {
            // 0 and less
            response += `...Wtf ${message.author.username}`;
        } else if (args[0] > 50) {
            // 51 and more
            response += 'No way.';
        }
        return message.channel.send(response);
    }
}