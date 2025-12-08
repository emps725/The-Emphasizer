import dotenv from "dotenv";
dotenv.config();

import { Client, GatewayIntentBits, EmbedBuilder } from "discord.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
});

//1
//KEYS
client.login(process.env.DISCORD_TOKEN);
const OWM_KEY = process.env.OWM_KEY;
if (!OWM_KEY) console.warn("Warning: OWM_KEY not set in .env");
//DISCORD SERVER IDS
const slumpID = process.env.SLUMP_ID;
const lockedInID = process.env.LOCKEDIN_ID;
//DISCORD USER IDS
const issyID = process.env.ISSY_ID;

//2
//Global Commands
const prefix = ".";

client.on("messageCreate", (message) => {
  if (message.author.bot) return;
  if (message.content === prefix + "hi") {
    message.channel.send("Hey there!");
  }
  if (message.content.toLowerCase().includes("thanks emphasizer")) {
    message.reply("no problem bby");
  }
});

//3
//whois Command
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  // await message.guild.members.fetch();
  if (!message.content.startsWith(prefix + "whois")) return;

  const args = message.content.trim().split(/\s+/);
  const maybeArgs = args[1];

  const idRegex = /^\d{17,19}$/;
  const mentionMember = message.mentions.members.first();

  let member = null;
  let user = null;
  try {
    if (!maybeArgs && !mentionMember) {
      member = message.member;
      user = message.author;
    } else if (mentionMember) {
      member = mentionMember;
      user = member.user;
    } else if (idRegex.test(maybeArgs)) {
      try {
        member = await message.guild.members.fetch(maybeArgs);
        user = member.user;
      } catch (e) {
        user = await client.users.fetch(maybeArgs);
        member = null;
      }
    } else {
      message.channel.send(
        "Invalid argument. Please provide a valid user mention or ID."
      );
      return;
    }
  } catch (error) {
    console.error("Error fetching user or member:", error);
    return message.channel.send("Failed to lookup user.");
  }

  const displayname = user.displayName;
  const username = user.username;
  const globalAvatar = user.displayAvatarURL({ dynamic: true, size: 1024 });
  const creation = user.createdAt.toLocaleDateString();
  const days = Math.floor((Date.now() - user.createdTimestamp) / 86400000);
  // let position = null;
  // message.channel.send(globalAvatar);
  // message.channel.send("Account created on: " + creation);

  // if (member) {
  //   const joins = [...message.guild.members.cache.values()].sort(
  //     (a, b) => a.joinedTimestamp - b.joinedTimestamp
  //   );

  //   position = String(joins.findIndex((m) => m.id === member.id) + 1);

  //   if (position.endsWith("1") && !position.endsWith("11")) {
  //     position += "st";
  //   } else if (position.endsWith("2") && !position.endsWith("12")) {
  //     position += "nd";
  //   } else if (position.endsWith("3") && !position.endsWith("13")) {
  //     position += "rd";
  //   } else {
  //     position += "th";
  //   }
  // } else {
  //   position = "Not in this server.";
  // }

  //Embed
  const embed = new EmbedBuilder()
    .setTitle(`${displayname}` + ` (` + `${username}` + `)`)
    .setThumbnail(globalAvatar)
    .addFields(
      { name: "User ID", value: `${user.id}`, inline: false },
      { name: "Created on", value: creation, inline: true },
      member
        ? {
            name: "Joined on",
            value: member.joinedAt.toLocaleDateString(),
            inline: true,
          }
        : { name: "Joined on", value: "N/A", inline: true },
      { name: "\u200B", value: "\u200B", inline: true },
      { name: "Account Age", value: `${days} days`, inline: true }
      // member
      //   ? {
      //       name: "",
      //       value: `${position}` + ` member to join.`,
      //       inline: false,
      //     }
      //   : { name: "", value: `${position}`, inline: false }
    )
    .setTimestamp()
    .setColor(0x00ae86);
  return message.channel.send({ embeds: [embed] });
});

// Note: Following section works for only specific servers

//4
//Locked In Server
client.on("messageCreate", (message) => {
  if (message.author.bot) return;
  if (message.guild?.id !== lockedInID) return;
  if (message.content.toLowerCase().includes("gay")) {
    console.log("Triggered");
    console.log(message.author.id);
    message.reply("Vichuu gay af");
  }
});

//5
//Slump Server
client.on("messageCreate", (message) => {
  if (message.author.bot) return;
  if (message.channel.name.toLowerCase() === "rules") return;
  if (message.channel.name.toLowerCase() === "cult-announcement") return;
  if (message.channel.name.toLowerCase() === "qotd") return;

  if (message.guild?.id !== slumpID) return;
  if (!message.reference && message.mentions.users.has(issyID)) {
    message.reply("sissy the faggot");
  }
  if (message.mentions.everyone) {
    message.reply("WE ARE CHARLIE KIIIIRRRRK");
  }
  if (message.content.toLowerCase().includes("mortis")) {
    message.channel.send("mortise main");
  }
});
