const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const PREFIX = require('path').parse(__filename).name;
const fs = require('fs');

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}
const TS_ICON = process.env.TS_ICON;

const db_name = 'ts_data.json';
const rawdata = fs.readFileSync(`./src/data/${db_name}`);
const ts_data = JSON.parse(rawdata);
const blacklist_guilds = ts_data.blacklist.guilds;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gunban')
        .setDescription('Un-Bans a guild from the bot')
        .addStringOption(option => option.setName('guild').setDescription('The guild to ban')),
    async execute(interaction, logger) {
        const username = `${interaction.member.user.username}#${interaction.member.user.discriminator}`;
        const channel = interaction.channel.name;
        const guild = interaction.guild.name;
        logger.info(`[${PREFIX}] Initialized by ${username} in ${channel} on ${guild}!`);

        const guildID = interaction.options.getString('guild');
        logger.debug(`[${PREFIX}] guildID: ${guild}`);

        // if guildID is in black_list guilds, remove it, and save the new json file
        if (blacklist_guilds.includes(guildID)) {
            blacklist_guilds.splice(blacklist_guilds.indexOf(guildID), 1);
            logger.debug(`[${PREFIX}] blacklist_guilds: ${blacklist_guilds}`);
            ts_data.blacklist.guilds = blacklist_guilds;
            fs.writeFileSync(`./src/data/${db_name}`, JSON.stringify(ts_data));
            const embed = new MessageEmbed()
                .setAuthor({ name: 'TripSit.Me', iconURL: TS_ICON, url: 'http://www.tripsit.me' })
                .setColor('RED')
                .setTitle('Guild Unbanned')
                .addFields(
                    { name: 'Guild ID', value: guildID },
                );
            return interaction.reply({ embeds: [embed] });
        }

        if (!blacklist_guilds.includes(guildID)) {
            const embed = new MessageEmbed()
                .setAuthor({ name: 'TripSit.Me', iconURL: TS_ICON, url: 'http://www.tripsit.me' })
                .setColor('GREEN')
                .setTitle('Guild Not Banned')
                .addFields(
                    { name: 'Guild ID', value: guildID },
                );
            return interaction.reply({ embeds: [embed] });
        }
    },
};
