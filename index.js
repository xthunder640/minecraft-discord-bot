const ms = require('ms')
const fetch = require('node-fetch')
const Discord = require('discord.js')
const client = new Discord.Client()

const config = require('./config.json')

/**
 * This function is used to update statistics channel
 */
const updateChannel = async () => {

    // Fetch statistics from mcapi.us
    const res = await fetch(`https://api.minetools.eu/query/${config.ipAddress}/${config.port}`)
    const res1 = await fetch(`https://api.mcsrvstat.us/bedrock/2/${config.ipAddress}:${config.port}`)
    if (!res1) {
        const statusChannelName = `【🛡】Status: Offline`
        client.channels.cache.get(config.statusChannel).setName(statusChannelName)
        return false
    }
    // Parse the mcapi.us response
    const body = await res.json()
    const body1 = await res1.json()

    // Get the current player count, or set it to 0
    const players = body.Players

    // Get the server status
    const status = (body1.online ? "Online" : "Offline")

    // Generate channel names
    const playersChannelName = `【👥】Players: ${players}`
    const statusChannelName = `【🛡】Status: ${status}`

    // Update channel names
    client.channels.cache.get(config.playersChannel).setName(playersChannelName)
    client.channels.cache.get(config.statusChannel).setName(statusChannelName)

    return true
}

client.on('ready', () => {
    console.log(`Ready. Logged as ${client.user.tag}.`)
    setInterval(() => {
        updateChannel()
    }, ms(config.updateInterval))
})

client.on('message', async (message) => {

    if(message.content === `${config.prefix}force-update`){
        if (!message.member.hasPermission('MANAGE_MESSAGES')) {
            return message.channel.send('Only server moderators can run this command!')
        }
        const sentMessage = await message.channel.send("Updating the channels, please wait...")
        await updateChannel()
        sentMessage.edit("Channels were updated successfully!")
    }

    if(message.content === `${config.prefix}stats`){
        const sentMessage = await message.channel.send("Fetching statistics, please wait...")

        // Fetch statistics from mcapi.us
        const res = await fetch(`https://api.minetools.eu/query/${config.ipAddress}/${config.port}`)
        const res1 = await fetch(`https://api.mcsrvstat.us/bedrock/2/${config.ipAddress}:${config.port}`)
        if (!res) return message.channel.send(`Looks like your server is not reachable... Please verify it's online and it isn't blocking access!`)
        // Parse the mcapi.us response
        const body = await res.json()
        const body1 = await res1.json()

        const attachment = new Discord.MessageAttachment(Buffer.from(body.favicon.substr('data:image/png;base64,'.length), 'base64'), "icon.png")

        const embed = new Discord.MessageEmbed()
            .setAuthor(config.ipAddress)
            .attachFiles(attachment)
            .setThumbnail("attachment://icon.png")
            .addField("Version", body.Version)
            .addField("Connected", `${body.Players} players`)
            .addField("Maximum", `${body.MaxPlayers} players`)
            .addField("Status", (body1.online ? "Online" : "Offline"))
            .setColor("#FF0000")
            .setFooter("Open Source Minecraft Discord Bot")
        
        sentMessage.edit(`:chart_with_upwards_trend: Here are the stats for **${config.ipAddress}**:`, { embed })
    }

})

client.login(config.token)
