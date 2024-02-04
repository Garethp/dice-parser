import { GatewayIntentBits } from "discord.js";

export default {
  prefix: "!",
  token: process.env.DISCORD_TOKEN!,
  clientId: "1018614997665980416",
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
};
