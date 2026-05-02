import dotenv from "dotenv";
dotenv.config();

import { SlashCommandBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder().setName("hi").setDescription("Say hi!"),
  async execute(interaction) {
    await interaction.reply("faggot");
  },
};
// const commands = [{ name: "hi", description: "Say hi!" }];

// const rest = new REST({ version: 10 }).setToken(process.env.DISCORD_TOKEN);

// const guildIDs = [
//   process.env.SLUMP_ID,
//   process.env.LOCKEDIN_ID,
//   process.env.TEST_ID,
//   process.env.PINKDEV_ID,
// ];

// (async () => {
//   try {
//     for (const gid of guildIDs) {
//       await rest.put(
//         Routes.applicationGuildCommands(process.env.CLIENT_ID, gid),
//         { body: commands }
//       );
//     }
//   } catch (error) {
//     console.error(error);
//   }
// })();
