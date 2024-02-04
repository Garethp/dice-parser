import { Client, REST, Routes, SlashCommandBuilder } from "discord.js";
import config from "./config";

import { allCommands } from "./commands";
const { intents, token, clientId } = config;
const rest = new REST({ version: "10" }).setToken(token);

if (!process.env.DISCORD_TOKEN)
  throw new Error("You need to set the DISCORD_TOKEN environment variable");

(async () => {
  try {
    console.log("Started refreshing application (/) commands.");

    const commands = allCommands.map((command) => {
      const builder = new SlashCommandBuilder()
        .setName(command.keyword)
        .setDescription(command.description);

      return command.optionsBuilder(builder);
    });

    await rest.put(Routes.applicationCommands(clientId), {
      body: commands,
    });

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
})();

const client = new Client({
  intents,
  presence: {
    status: "online",
  },
});

client.on("ready", () => {
  console.log(`Logged in as: ${client.user?.tag}`);
});

client.on("interactionCreate", async (interaction): Promise<any> => {
  if (!interaction.isChatInputCommand()) return;

  try {
    const commandToRun = allCommands.find(
      (command) => command.keyword === interaction.commandName
    );
    if (!commandToRun) return;

    return commandToRun.handler(interaction);
  } catch (e) {
    // @ts-ignore
    const message: string = e.message;

    await interaction.reply(`\`\`\`
Error Occurred.
Error: ${message}
Input: ${interaction.toString()}
\`\`\``);

    console.log(e);
  }
});

client.login(token);
