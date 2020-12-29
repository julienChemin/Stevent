module.exports = {
    name: "ping",
    aliases:["reping", "rereping"],
    description: "reply 'pong'",
    dmOnly: true,
    execute(message, args) {
        message.channel.send('pong !');
    }
}