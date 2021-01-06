const { Op } = require('sequelize');

const { MessageEmbed } = require('discord.js');

const Ban = require('../database/models/Ban');

const ParticipatingServer = require('../database/models/ParticipatingServer');

const UserIDAssociation = require('../database/models/UserIDAssociation');

// looksup usertag in list if recorded
async function checkTag(userTag) {
  const found = await UserIDAssociation.findOne({ where: { userTag } })
    .catch(errHander);
  return found;
}

async function postUserinfo(client, message, userID) {
  const embed = new MessageEmbed().setColor(message.member.displayColor);
  let failed = false;
  const discordUser = await client.users.fetch(userID, false)
    .catch((err) => {
      if (err.code === 10013) embed.setAuthor('This user doesn\'t exist.');
      else embed.setAuthor('An error occurred!');
      embed.addField('Stopcode', err.message);
      failed = true;
      return message.channel.send({ embed });
    });
  if (!failed) {
    embed
      .addField('Usertag', `\`${discordUser.tag}\``)
      .addField('ID', `\`${userID}\``)
      .addField('Account Creation Date', discordUser.createdAt, true)
      .setThumbnail(discordUser.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }));
    return message.channel.send({ embed });
  }
}

async function getBanns(userID) {
  // adds a user to the Maintainer table
  const found = await Ban.findAll({ where: { userID } })
    .catch((err) => console.error(err));
  return found;
}

async function getServerName(serverID) {
  // adds a user to the Maintainer table
  const found = await ParticipatingServer.findOne({ where: { serverID } })
    .catch((err) => console.error(err));
  if (!found) return 'unknown server';
  return found.serverName;
}

async function postBanns(message, userID) {
  const banns = await getBanns(userID);
  banns.forEach(async (ban) => {
    const embed = new MessageEmbed()
      .addField('ServerID', `\`${ban.serverID}\``, true)
      .addField('Is banned', `\`${ban.userBanned}\``, true)
      .addField('Reason', `\`\`\`${ban.reason || 'None'}\`\`\``)
      .addField('Ban creation date', ban.createdAt, true)
      .addField('Ban updated date', ban.updatedAt, true);
    const serverName = await getServerName(ban.serverID);
    // check if user is still banned
    if (ban.userBanned) {
      embed
        .setColor(16739072) // orange
        .setAuthor(`Banned on ${serverName}`);
    } else {
      embed
        .setColor(4296754) // green
        .setAuthor(`Was banned on ${serverName}`);
    }
    message.channel.send({ embed });
  });
}

function getID(message, args) {
  // check if mention is in content
  if (message.mentions.members.first()) return message.mentions.members.first().id;
  // get userID
  const [userID] = args;
  // ckeck if content is not NaN
  if (!isNaN(userID)) return userID;
}

async function checkUserTag(uTag, IDArr) {
  // adds a user to the Maintainer table
  // FIXME: lowercase DB search
  const results = await UserIDAssociation.findAll({ limit: 4, where: { userTag: { [Op.substring]: uTag } } })
    .catch((err) => console.error(err));
  if (!results) return;
  results.forEach((result) => {
    if (IDArr.includes(result.userID)) return;
    IDArr.push(result.userID);
  });
  return IDArr;
}

module.exports.run = async (client, message, args, config) => {
  // check permissions if MANAGE_MESSAGES and if send in DMs
  if (!await client.functions.get('FUNC_checkPermissions').run(message.member, message, 'MANAGE_MESSAGES')) {
    messageFail(message, `You are not authorized to use \`${config.prefix}${module.exports.help.name}\``);
    return;
  }

  const IDArr = [];
  const userID = getID(message, args);
  if (userID) IDArr.push(userID);
  else {
    // parse username
    const userTag = message.content.slice(config.prefix.length + module.exports.help.name.length + 1);
    // make DB search
    await checkUserTag(userTag, IDArr);
  }
  // if no info is given, return author ID
  if (IDArr.length === 0 && args.length === 0) IDArr.push(message.author.id);
  // else return messageFail(message, 'Couldn\'t find any results with your search querry.');

  // not needed, not enough banns
  // const sentMessage = await sendUserinfo(client, message, args);
  IDArr.forEach(async (ID) => {
    await postUserinfo(client, message, ID);
    await postBanns(message, ID);
  });
};

module.exports.help = {
  name: 'lookup',
  usage: 'USERID|USERTAG|USERMENTION|USERSEARCH',
  desc: 'Uses the Discord API to lookup userinformaiton',
};
