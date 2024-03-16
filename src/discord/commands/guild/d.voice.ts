import {
  // Guild,
  Colors,
  SlashCommandBuilder,
  GuildMember,
  PermissionsBitField,
  EmbedBuilder,
  VoiceBasedChannel,
  TextChannel,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import commandContext from '../../utils/context';

const F = f(__filename);

type VoiceActions = 'lock' | 'hide' | 'add' | 'ban' | 'rename' | 'mute' | 'cohost' | 'bitrate' | 'ping' | 'settings';

async function tentRename(
  voiceChannel: VoiceBasedChannel,
  newName: string,
):Promise<EmbedBuilder> {
  voiceChannel.setName(`⛺│${newName}`);

  // log.debug(F, `${voiceChannel} hab been named to ${newName}`);

  return embedTemplate()
    .setTitle('Success')
    .setColor(Colors.Green)
    .setDescription(`${voiceChannel} has been renamed to ${newName}`);
}

async function tentLock(
  voiceChannel: VoiceBasedChannel,
): Promise<EmbedBuilder> {
  let verb = '';
  let mode = '';
  let explanation = '';

  // Fetch the tentChannel data from the database
  const tentChannel = await db.tentChannel.findFirst({
    where: {
      channelId: voiceChannel.id,
    },
  });

  if (!tentChannel) {
    throw new Error(`TentChannel with ID ${voiceChannel.id} not found`);
  }

  if (tentChannel.mode !== 'locked') {
    voiceChannel.permissionOverwrites.edit(voiceChannel.guild.roles.everyone, { Connect: false });
    // If the channel is hidden, explain that it will be unhidden but remain locked
    if (tentChannel.mode === 'hidden') {
      verb = 'unhidden and ';
    }
    verb = 'locked';
    mode = 'locked';
    explanation = 'The Tent is locked and cannot be joined.';

    // Update the tentChannel mode in the database
    await db.tentChannel.update({
      where: {
        id: tentChannel.id,
      },
      data: {
        mode: 'locked',
      },
    });

    // Update the user's preferredTentMode in the database
    await db.users.update({
      where: {
        id: tentChannel.userId,
      },
      data: {
        preferredTentMode: 'locked',
      },
    });
  } else {
    voiceChannel.permissionOverwrites.edit(voiceChannel.guild.roles.everyone, { Connect: true });
    verb = 'unlocked';
    mode = 'open';
    explanation = 'The Tent is now open and can be joined.';

    // Update the tentChannel mode in the database
    await db.tentChannel.update({
      where: {
        id: tentChannel.id,
      },
      data: {
        mode: 'open',
      },
    });

    // Update the user's preferredTentMode in the database
    await db.users.update({
      where: {
        id: tentChannel.userId,
      },
      data: {
        preferredTentMode: 'open',
      },
    });
  }

  // Edit the info message with the new mode
  const infoMessage = await voiceChannel.messages.fetch(tentChannel.infoMessageId);
  if (infoMessage) {
    // Update the info message with the new mode using regex
    const newContent = infoMessage.content.replace(/Mode: .*/, `Mode: ${mode.charAt(0).toUpperCase() + mode.slice(1)}`);
    infoMessage.edit(newContent);
  }

  // log.debug(F, `Channel is now ${verb}`);
  return embedTemplate()
    .setTitle(`Mode set to **${mode}**`)
    .setColor(Colors.Green)
    .setDescription(`${explanation}`);
}

async function tentHide(
  voiceChannel: VoiceBasedChannel,
): Promise<EmbedBuilder> {
  let verb = '';
  let mode = '';
  let explanation = '';

  // Fetch the tentChannel data from the database
  const tentChannel = await db.tentChannel.findFirst({
    where: {
      channelId: voiceChannel.id,
    },
  });

  if (!tentChannel) {
    throw new Error(`TentChannel with ID ${voiceChannel.id} not found`);
  }

  if (tentChannel.mode !== 'hidden') {
    voiceChannel.permissionOverwrites.edit(voiceChannel.guild.roles.everyone, { ViewChannel: false });
    voiceChannel.permissionOverwrites.edit(voiceChannel.guild.roles.everyone, { Connect: false });
    verb = 'hidden (and locked)';
    mode = 'hidden';
    explanation = 'Tent is hidden from the channel list and locked.';

    // Update the tentChannel mode in the database
    await db.tentChannel.update({
      where: {
        id: tentChannel.id,
      },
      data: {
        mode: 'hidden',
      },
    });

    // Update the user's preferredTentMode in the database
    await db.users.update({
      where: {
        id: tentChannel.userId,
      },
      data: {
        preferredTentMode: 'hidden',
      },
    });
  } else {
    voiceChannel.permissionOverwrites.edit(voiceChannel.guild.roles.everyone, { ViewChannel: true });
    voiceChannel.permissionOverwrites.edit(voiceChannel.guild.roles.everyone, { Connect: true });
    verb = 'unhidden (and unlocked)';
    mode = 'open';
    explanation = 'The tent is visible and can be joined.';

    // Update the tentChannel mode in the database
    await db.tentChannel.update({
      where: {
        id: tentChannel.id,
      },
      data: {
        mode: 'open',
      },
    });

    // Update the user's preferredTentMode in the database
    await db.users.update({
      where: {
        id: tentChannel.userId,
      },
      data: {
        preferredTentMode: 'open',
      },
    });
  }

  // Edit the info message with the new mode
  const infoMessage = await voiceChannel.messages.fetch(tentChannel.infoMessageId);
  if (infoMessage) {
    // Update the info message with the new mode using regex
    const newContent = infoMessage.content.replace(/Mode: .*/, `Mode: ${mode.charAt(0).toUpperCase() + mode.slice(1)}`);
    infoMessage.edit(newContent);
  }

  // log.debug(F, `Channel is now ${verb}`);
  return embedTemplate()
    .setTitle(`Mode set to **${mode}**`)
    .setColor(Colors.Green)
    .setDescription(`${explanation}`);
}

// async function tentAdd(
//   voiceChannel: VoiceBasedChannel,
//   target: GuildMember,
// ):Promise<EmbedBuilder> {
//   let verb = '';
//
//   if (voiceChannel.permissionsFor(target).has(PermissionsBitField.Flags.ViewChannel) === false){
//     return embedTemplate()
//       .setTitle('Error')
//       .setColor(Colors.Red)
//       .setDescription(`${target} is banned from ${voiceChannel}, unban them first!`);
//   }
//
//   if (!voiceChannel.permissionsFor(target).has(PermissionsBitField.Flags.ViewChannel) === true){
//     voiceChannel.permissionOverwrites.create(target, { ViewChannel: true, Connect: true });
//     verb = 'added';
//   } else {
//     voiceChannel.permissionOverwrites.delete(target);
//     verb = 'unadded';
//   }
//   // log.debug(F, `${target.displayName} is now ${verb}`);
//
//   return embedTemplate()
//     .setTitle('Success')
//     .setColor(Colors.Green)
//     .setDescription(`${target} has been ${verb} from ${voiceChannel}`);
// }

async function tentBan(
  voiceChannel: VoiceBasedChannel,
  target: GuildMember,
): Promise<EmbedBuilder> {
  let verb = '';

  // Fetch the tentChannel data from the database
  const tentChannel = await db.tentChannel.findFirst({
    where: {
      channelId: voiceChannel.id,
    },
  });

  if (!tentChannel) {
    throw new Error(`TentChannel with ID ${voiceChannel.id} not found`);
  }

  // Fetch the user data from the database
  const user = await db.users.findFirst({
    where: {
      id: tentChannel.userId,
    },
  });

  if (!user) {
    throw new Error(`User with ID ${tentChannel.userId} not found`);
  }

  // Check if the target user is already banned or not
  if (user.banList && user.banList.includes(target.id) === false) {
    // If not, add the target user to the ban list
    voiceChannel.permissionOverwrites.edit(target, { ViewChannel: false, Connect: false });
    if (target.voice.channel === voiceChannel) {
      target.voice.setChannel(null);
    }
    verb = 'added to your ban list and disconnected';

    // Add the target user to the ban list in the database
    if (user.banList) {
      user.banList.push(target.id);
    } else {
      user.banList = [target.id];
    }

    await db.users.update({
      where: {
        id: tentChannel.userId,
      },
      data: {
        banList: user.banList,
      },
    });
  } else {
    // If the target user is already banned, remove them from the ban list
    voiceChannel.permissionOverwrites.delete(target);
    verb = 'removed from your ban list';

    // Remove the target user from the ban list in the database
    if (user.banList) {
      user.banList = user.banList.filter(id => id !== target.id);
    }

    await db.users.update({
      where: {
        id: tentChannel.userId,
      },
      data: {
        banList: user.banList,
      },
    });
  }

  // log.debug(F, `${target.displayName} is now ${verb}`);

  return embedTemplate()
    .setTitle('Success')
    .setColor(Colors.Green)
    .setDescription(`${target} has been ${verb}`);
}

async function tentMute(
  voiceChannel: VoiceBasedChannel,
  target: GuildMember,
):Promise<EmbedBuilder> {
  let verb = '';

  if (voiceChannel.permissionsFor(target).has(PermissionsBitField.Flags.Speak) === true) {
    voiceChannel.permissionOverwrites.edit(target, { Speak: false });
    verb = 'muted';
    // log.debug(F, 'User is now muted');
  } else {
    voiceChannel.permissionOverwrites.edit(target, { Speak: true });
    verb = 'unmuted';
  }

  // log.debug(F, `${target.displayName} is now ${verb}`);

  return embedTemplate()
    .setTitle('Success')
    .setColor(Colors.Green)
    .setDescription(`${target} has been ${verb} in ${voiceChannel}`);
}

async function tentCohost(
  voiceChannel: VoiceBasedChannel,
  target: GuildMember,
):Promise<EmbedBuilder> {
  let verb = '';

  if (voiceChannel.permissionsFor(target).has(PermissionsBitField.Flags.MoveMembers) === false) {
    voiceChannel.permissionOverwrites.edit(target, { MoveMembers: true });
    verb = 'co-hosted';
    // log.debug(F, 'User is now muted');
  } else {
    voiceChannel.permissionOverwrites.edit(target, { MoveMembers: false });
    verb = 'removed as a co-host';
  }

  // log.debug(F, `${target.displayName} is now ${verb}`);

  return embedTemplate()
    .setTitle('Success')
    .setColor(Colors.Green)
    .setDescription(`${target} has been ${verb} in ${voiceChannel}`);
}

async function tentBitrate(
  voiceChannel: VoiceBasedChannel,
  bitrate: string,
):Promise<EmbedBuilder> {
  if (voiceChannel.bitrate === parseInt(bitrate, 10)) {
    return embedTemplate()
      .setTitle('Error')
      .setColor(Colors.Red)
      .setDescription(`${voiceChannel} is already set to ${(parseInt(bitrate, 10)) / 1000}kbps`);
  }

  // Change the bitrate
  voiceChannel.setBitrate(parseInt(bitrate, 10));
  log.debug(F, `Bitrate ${bitrate}`);
  log.debug(F, `Bitrate is now ${voiceChannel.bitrate}`);

  // log.debug(F, `${target.displayName} is now ${verb}`);

  return embedTemplate()
    .setTitle('Success')
    .setColor(Colors.Green)
    .setDescription(`${voiceChannel} has been set to ${(parseInt(bitrate, 10)) / 1000}kbps`);
}

// Command that makes the bot ping the Join VC role
let lastTentPingTime = Date.now() - 3600000; // Initialize to one hour ago
const userTentPingTimes: { [userId: string]: number } = {}; // Initialize an empty object to store user ping times
const globalCooldown = 3600000; // 1 hour
const userCooldown = 10800000; // 3 hours

async function tentPing(
  voiceChannel: VoiceBasedChannel,
  member: GuildMember,
): Promise<EmbedBuilder> {
  const role = voiceChannel.guild.roles.cache.get(env.ROLE_JOINVC);
  if (role) {
    const now = Date.now();
    const userId = member.id;

    // Check if the user used the command less than the user cooldown
    if (userTentPingTimes[userId] && now - userTentPingTimes[userId] < userCooldown) {
      return embedTemplate()
        .setTitle('Cooldown')
        .setColor(Colors.Red)
        .setDescription(`You already used this command <t:${Math.floor(userTentPingTimes[userId] / 1000)}:R>. 
        You can use it again <t:${Math.floor((userTentPingTimes[userId] + userCooldown) / 1000)}:R>.`);
    }

    // Check if the command was used less than the global cooldown
    if (now - lastTentPingTime < globalCooldown) {
      return embedTemplate()
        .setTitle('Cooldown')
        .setColor(Colors.Red)
        .setDescription(`This command is on cooldown. 
        It can next be used <t:${Math.floor((lastTentPingTime + globalCooldown) / 1000)}:R>.`);
    }

    // Update the last usage times
    lastTentPingTime = now;
    userTentPingTimes[userId] = now;

    // Ping the role
    // Get the lounge channel
    const channelID = env.CHANNEL_LOUNGE;
    const channel = member.guild.channels.cache.get(channelID) as TextChannel | undefined;
    if (!channel || !(channel instanceof TextChannel)) {
      return embedTemplate()
        .setTitle('Error')
        .setColor(Colors.Red)
        .setDescription('The lounge channel could not be found.');
    }

    // Send the ping
    channel.send(`<@${member.id}> wants you to <@&${role.id}> in ${voiceChannel}!`);
    // Send the confirmation message
    return embedTemplate()
      .setTitle('Success')
      .setColor(Colors.Green)
      .setDescription('The Join VC role has been pinged. ');
  }

  return embedTemplate()
    .setTitle('Error')
    .setColor(Colors.Red)
    .setDescription('The Join VC role could not be found.');
}

const buttonTentViewBan = new ButtonBuilder()
  .setCustomId('TentViewBan')
  .setLabel('View Ban List')
  .setEmoji('🚫')
  .setStyle(ButtonStyle.Primary);

async function tentSettings(
  member: GuildMember,
) {
  // Fetch the user's data from the database
  const user = await db.users.findFirst({
    where: {
      discord_id: member.id,
    },
  });

  if (!user) {
    throw new Error(`User with ID ${member.id} not found`);
  }

  // Show embed with ban list
  return embedTemplate()
    .setTitle('Tent Settings')
    .setColor(Colors.Blue)
    .setDescription(`Ban List: ${user.banList}`)
    .setTimestamp();
}

export const dVoice: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('voice')
    .setDescription('Control your Campfire Tent')
    .addSubcommand(subcommand => subcommand
      .setName('rename')
      .setDescription('Rename your Tent')
      .addStringOption(option => option
        .setName('name')
        .setDescription('The new name for your Tent')
        .setRequired(true)))
    .addSubcommand(subcommand => subcommand
      .setName('lock')
      .setDescription('Lock/Unlock the Tent'))
    .addSubcommand(subcommand => subcommand
      .setName('hide')
      .setDescription('Remove the Tent from the channel list'))
    .addSubcommand(subcommand => subcommand
      .setName('ban')
      .setDescription('Ban and disconnect a user from your Tent')
      .addUserOption(option => option
        .setName('target')
        .setDescription('The user to ban/unban')
        .setRequired(true)))
    .addSubcommand(subcommand => subcommand
      .setName('cohost')
      .setDescription('Make another user able to use /voice commands')
      .addUserOption(option => option
        .setName('target')
        .setDescription('The user to make co-host')
        .setRequired(true)))
    .addSubcommand(subcommand => subcommand
      .setName('ping')
      .setDescription('Ping the Join VC role'))
    .addSubcommand(subcommand => subcommand
      .setName('settings')
      .setDescription('View and change your Tent settings')),

  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ ephemeral: true });

    const command = interaction.options.getSubcommand() as VoiceActions;
    const member = interaction.member as GuildMember;
    const target = interaction.options.getMember('target') as GuildMember;
    const newName = interaction.options.getString('name') as string;
    // const stationid = interaction.options.getString('station') as string;
    // const guild = interaction.guild as Guild;
    const bitrate = interaction.options.getString('bitrate') as string;
    const voiceChannel = member.voice.channel;
    let embed = embedTemplate()
      .setTitle('Error')
      .setColor(Colors.Red)
      .setDescription('You can only use this command in a voice channel Tent that you own!');

    // Check if user is in a voice channel
    if (voiceChannel === null) {
      await interaction.editReply({ embeds: [embed] });
      return false;
    }

    // Check if user is in a Tent
    if (voiceChannel.name.includes('⛺') === false) {
      await interaction.editReply({ embeds: [embed] });
      return false;
    }

    // Check if a user is the one who created it, only users with MoveMembers permission can do this
    if (!voiceChannel.permissionsFor(member).has(PermissionsBitField.Flags.MoveMembers)) {
      await interaction.editReply({ embeds: [embed] });
      return false;
    }

    // Check the user is trying to act on themselves
    if (target === member) {
      await interaction.editReply({ embeds: [embed.setDescription('Stop playing with yourself!')] });
      return false;
    }

    // Check if the target user is a moderator
    if (target && target.roles.cache.has(env.ROLE_MODERATOR)) {
      await interaction.editReply({ embeds: [embed.setDescription('You cannot do that to a moderator!')] });
      return false;
    }

    // log.debug(F, `Command: ${command}`);
    if (command === 'rename') {
      embed = await tentRename(voiceChannel, newName);
    }

    if (command === 'lock') {
      embed = await tentLock(voiceChannel);
    }

    if (command === 'hide') {
      embed = await tentHide(voiceChannel);
    }

    // if (command === 'add') {
    //   embed = await tentAdd(voiceChannel, target);
    // }

    if (command === 'ban') {
      embed = await tentBan(voiceChannel, target);
    }

    if (command === 'mute') {
      embed = await tentMute(voiceChannel, target);
    }

    if (command === 'cohost') {
      embed = await tentCohost(voiceChannel, target);
    }

    if (command === 'bitrate') {
      embed = await tentBitrate(voiceChannel, bitrate);
    }

    if (command === 'ping') {
      embed = await tentPing(voiceChannel, member);
    }

    if (command === 'settings') {
      embed = await tentSettings(member);
    }

    await interaction.editReply({ embeds: [embed] });
    return true;
  },
};

export default dVoice;
