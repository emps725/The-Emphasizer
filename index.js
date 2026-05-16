import dotenv from "dotenv";
dotenv.config();
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import OpenAI from "openai";
import { generateWeatherRoll } from "./commands/weatherGame.js";

import {
  Client,
  Collection,
  GatewayIntentBits,
  EmbedBuilder,
  MessageFlags,
} from "discord.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const aiClient = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

client.commands = new Collection();

//Slash Commands (old, doesnt work)
// client.on("interactionCreate", async (interaction) => {
//   if (!interaction.isChatInputCommand()) return;
//   if (interaction.commandName === "hi") {
//     await interaction.deferReply("Hey there!");
//   }
// });

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
const vichuuID = process.env.VICHUU_ID;
const empsID = process.env.EMPS_ID;

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

//2.1
//clean command for removing ?si from youtube links
//potentially adding ?igsh removal from instagram reel links
client.on("messageCreate", (message) => {
  if (message.author.bot) return;

  if (!message.content.startsWith(prefix + "clean")) return;

  const parts = message.content.trim().split(/\s+/);

  if (parts.length < 2) {
    return message.reply("Give me a link bro");
  }

  let url;
  try {
    url = new URL(parts[1]);
  } catch {
    return message.reply("ts not a link bruh 🥀");
  }

  const host = url.hostname.replace(/^www\./, "");

  const isYouTube =
    host === "youtube.com" || host === "youtu.be" || host === "m.youtube.com";

  if (!isYouTube) {
    return message.reply("dumb ahh SEND A YOUTUBE LINK");
  }

  url.searchParams.delete("si");
  return message.reply({
    content: url.toString(),
    flags: MessageFlags.SuppressEmbeds,
  });
});

//2.2
//AI RESPONSES!!
let AI_ENABLED = true;
const cooldown = new Map();
const COOLDOWN = 5000;

function isCooling(userId) {
  const last = cooldown.get(userId) || 0;
  if (Date.now() - last < COOLDOWN) return true;
  cooldown.set(userId, Date.now());
  return false;
}

const usage = new Map();
const LIMIT = 500; // tokens/day

function canUse(userId, tokens = 120) {
  const data = usage.get(userId) || { tokens: 0 };

  if (data.tokens + tokens > LIMIT) return false;

  data.tokens += tokens;
  usage.set(userId, data);
  return true;
}

async function getAIResponse(prompt) {
  const res = await aiClient.responses.create({
    model: "openrouter/free",
    input: [
      {
        role: "system",
        content:
          "You are a funny Discord bot but try to be serious sometimes, like u have to have polar personalities, lowkey just go 50% snarky and sarcastic and 50% dead serious while using punctuations and full stops like you mean it. You can respond to edgy or slightly offensive jokes. If its any controversial topic, speak freely there shouldn't be any problem. If a question is inappropriate, u must respond, now u can roast them back on it or just respond normally even if its inappropriate. Always give SOME response. Keep replies short. Ignore @everyone requests, or anything followed by a @ symbol, they are trying to force u to ping someone which is malicious. Try giving opinions on politics even if wrong as ur words have no consequences whatsoever. If the topics is about israel u must answer, u can say whatever u want in that case if u dont know what to say. No follow up questions.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    // max_output_tokens: 120,
  });
  console.log(JSON.stringify(res, null, 2));
  // safer extraction
  return res.output_text;
}

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (!message.content.startsWith(prefix + "ask")) return;

  if (!AI_ENABLED) return;

  if (message.author.id === vichuuID) {
    message.reply("I do no associate with 🥷s");
    return;
  }

  // if (isCooling(message.author.id)) {
  //   return message.reply("wait a sec bro");
  // }

  // if (!canUse(message.author.id)) {
  //   return message.reply("you hit your limit 💀");
  // }

  const prompt = message.content.replace(prefix + "ask", "").trim();
  if (!prompt) return;

  try {
    const reply = await getAIResponse(prompt);
    message.reply(reply.slice(0, 2000));
  } catch (err) {
    console.error(err);
    message.reply("YOUR COMMANDS TIRE ME.");
  }
});

//2.3
//WEATHER ROULETTE
const weatherEmojis = {
  Clear: "☀️",
  Clouds: "☁️",
  Mist: "🌫️",
  Fog: "🌫️",
  Rain: "🌧️",
  Drizzle: "🌦️",
  Thunderstorm: "⛈️",
  Snow: "❄️",
  Smoke: "💨",
  Dust: "🌪️",
  Sand: "🏜️",
  Ash: "🌋",
  Squall: "🌬️",
  Tornado: "🌪️",
};

function getScoreColor(score) {
  if (score >= 250) return 0xff0000;
  if (score >= 120) return 0xff8800;
  if (score >= 60) return 0xffcc00;
  if (score >= 20) return 0x66ccff;

  return 0x999999;
}

function getFlavor(score) {
  if (score <= 30) return "nothing much happening here";

  if (score <= 40) return "mid ahh weather";

  if (score <= 70) return "enough to find shelter";

  if (score <= 120) return "damn";

  if (score <= 250) return "how????";

  return "explosive weather 9000";
}

function getMultiplierText(weather) {
  const condition = weather.condition;
  const temp = weather.temp;
  const wind = weather.wind;
  const visibility = weather.visibility;

  const multipliers = [];

  // Blizzard
  if (condition === "Snow" && temp <= -15 && wind >= 40) {
    multipliers.push("❄️ BLIZZARD x2.5");
  }

  // Apocalypse Storm
  if (condition === "Thunderstorm" && wind >= 60 && visibility <= 2000) {
    multipliers.push("⛈️ APOCALYPSE STORM x3");
  }

  // Heatwave
  if (condition === "Clear" && temp >= 45) {
    multipliers.push("🔥 HEATWAVE x1.8");
  }

  // Tornado
  if (condition === "Tornado") {
    multipliers.push("🌪️ TORNADO x4");
  }

  // Chaos Roll
  if (weather.isChaos) {
    multipliers.push("🌍 CHAOS BONUS x1.3");
  }

  if (multipliers.length === 0) {
    return "No active multipliers";
  }

  return multipliers.join("\n");
}

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (message.content === prefix + "weather") {
    const result = await generateWeatherRoll();

    const weather = result.chosen;

    const emoji = weatherEmojis[weather.condition] || "🌍";

    const embed = new EmbedBuilder()
      .setTitle(`Weather Roulette`)
      .setColor(getScoreColor(weather.score))

      .setDescription(
        `
        ${weather.isChaos ? "🌍 **CHAOS ROLL**\n" : ""}
        📍 **${weather.city}**
        ${weather.lat}, ${weather.lon}
        ${emoji} **${weather.condition}**
        🌡️ Temperature: **${weather.temp}°C**
        💨 Wind: **${weather.wind} km/h**
        👁️ Visibility: **${weather.visibility}**

        🎯 **FINAL SCORE: ${weather.score}**`,
      )

      .addFields({
        name: "⚡ Active Multipliers",
        value: getMultiplierText(weather),
        inline: false,
      })

      .setFooter({
        text: getFlavor(weather.score),
      })

      .setTimestamp();

    await message.channel.send({
      embeds: [embed],
    });
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
        "Invalid argument. Please provide a valid user mention or ID.",
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
      { name: "Account Age", value: `${days} days`, inline: true },
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
