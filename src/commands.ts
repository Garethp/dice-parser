import {
  ChannelType,
  SlashCommandBuilder,
  ThreadAutoArchiveDuration,
  ChatInputCommandInteraction,
} from "discord.js";
import { DiceRoller, DiceRollResult } from "dice-roller-parser";
import { DiscordRollRenderer } from "./renderer";

const diceRoller = new DiceRoller();
const renderer = new DiscordRollRenderer();

type Command = {
  keyword: string;
  description: string;
  optionsBuilder: (
    builder: SlashCommandBuilder
  ) => Partial<SlashCommandBuilder>;
  handler: (interaction: ChatInputCommandInteraction) => Promise<any>;
};

export const PingPong: Command = {
  keyword: "ping",
  description: "A quick ping pong test",
  optionsBuilder: (builder) => builder,
  handler: async (interaction) => {
    await interaction.reply("Pong!");
  },
};

export const GURPS: Command = {
  keyword: "gurps",
  description: "A GURPS dice roller than defaults to 3d6",
  optionsBuilder: (builder) =>
    builder.addStringOption((option) =>
      option
        .setName("input")
        .setDescription("The dice to roll")
        .setRequired(false)
    ),
  handler: async (interaction) => {
    const input = interaction.options.getString("input") ?? "3d6";

    const roll = diceRoller.roll(input);

    return await interaction.reply(renderer.render(input, roll));
  },
};

export const ShadowRun: Command = {
  keyword: "shadowrun",
  description: "Roll a number of dice for Shadowrun",
  optionsBuilder: (builder) =>
    builder.addStringOption((option) =>
      option
        .setName("input")
        .setDescription("The number of dice in the pool")
        .setRequired(true)
    ),
  handler: async (interaction) => {
    const input = interaction.options.getString("input") ?? "";

    if (!!input.match(/[^0-9]/))
      return await interaction.reply({
        content: "The number of dice you entered is not a number",
        ephemeral: true,
      });

    const inputNum = parseInt(input.trim());
    const roll = diceRoller.roll(`${inputNum}d6`);

    // @ts-ignore
    const values: number[] = roll.rolls.map((roll) => roll.roll);

    const successes = values.filter((roll) => roll >= 5).length;

    const glitch =
      values.filter((value) => value === 1).length >= values.length / 2
        ? "### GLITCH DETECTED ###\r\n\r\n"
        : "";

    return await interaction.reply(
      `\`\`\`md\r\n${glitch}# ${successes} successes \r\n# Rolls: [${inputNum}d6: (${values.join(
        ", "
      )})]\`\`\``
    );
  },
};

export const RoleMaster: Command = {
  keyword: "rolemaster",
  description: "Roll with a D100 with a modifier",
  optionsBuilder: (builder) =>
    builder.addStringOption((option) =>
      option
        .setName("input")
        .setDescription("The modifier to add to the roll")
        .setRequired(false)
    ),
  handler: async (interaction) => {
    const input = interaction.options.getString("input") || "0";

    if (!!input.match(/[^0-9-+]/))
      return await interaction.reply({
        content: "The modifier you entered is not a number",
        ephemeral: true,
      });

    const inputNum = input.trim().replace(/^\+/, "");
    const roll = diceRoller.roll(`1d100!>95+${inputNum}`);

    return await interaction.reply(renderer.render(`1d100+${input}`, roll));
  },
};

export const ScumAndVillainy: Command = {
  keyword: "scum",
  description:
    "Roll a number of d6 for Scum and Villainy. Returns the highest number rolled",
  optionsBuilder: (builder) =>
    builder.addStringOption((option) =>
      option
        .setName("input")
        .setDescription("The number of d6 to roll")
        .setRequired(true)
    ),
  handler: async (interaction) => {
    // Get the number of d6 to roll from the input, return an error if it's not a number. Roll that many d6 and return the highest number rolled
    const input = interaction.options.getString("input") ?? "";

    if (!!input.match(/[^0-9-+]/))
      return await interaction.reply({
        content: "The modifier you entered is not a number",
        ephemeral: true,
      });

    const inputNum = input.trim().replace(/^\+/, "");
    const roll = diceRoller.roll(`${inputNum}d6`) as DiceRollResult;

    const values = roll.rolls.map((roll) => roll.roll);
    const result = Math.max(...values);
    let status = "";

    if (result <= 3) {
      status = "Bad Outcome:";
    } else if (result <= 5) {
      status = "Partial Success:";
    } else {
      status =
        values.filter((x) => x === 6).length > 1
          ? "Critical Success:"
          : "Full Success:";
    }

    roll.value = result;

    return await interaction.reply(
      renderer.render(`${status} ${inputNum}d6`, roll)
    );
  },
};

export const NotePassing: Command = {
  keyword: "note",
  description: "Pass a note to another user",
  optionsBuilder: (builder) =>
    builder
      .addUserOption((option) =>
        option
          .setName("user")
          .setDescription("The user that you want to message")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("message")
          .setDescription("The message to send")
          .setRequired(true)
      ),
  handler: async (interaction) => {
    // @TODO Error checking on this
    const recipient = interaction.options.getUser("user");
    const message = interaction.options.getString("message");

    if (!recipient)
      return await interaction.reply({
        content: "You did not select a user",
        ephemeral: true,
      });

    const channel = interaction.channel;

    if (channel?.type !== ChannelType.GuildText) {
      return;
    }

    const participants = [interaction.user.username, recipient.username].sort();

    await channel.send(
      `<@${interaction.user.id}> has passed a note to <@${recipient.id}>`
    );
    const threads = await channel.threads.fetch();
    const ourThread =
      threads.threads.find(
        (thread) =>
          thread.name === `${participants[0]}-${participants[1]}-notes`
      ) ??
      (await channel.threads.create({
        type: ChannelType.PrivateThread,
        name: `${participants[0]}-${participants[1]}-notes`,
        autoArchiveDuration: ThreadAutoArchiveDuration.OneDay,
      }));

    await ourThread.setLocked(false);
    await ourThread.edit({
      autoArchiveDuration: ThreadAutoArchiveDuration.OneDay,
    });

    await ourThread.members.add(interaction.user.id);
    await ourThread.members.add(recipient.id);

    await ourThread.send(`<@${
      interaction.user.id
    }> passes the following note to <@${recipient.id}>:
> ${message ?? "Empty Note"}`);

    await ourThread.setLocked(true);

    await interaction.reply({
      content: "Note sent",
      ephemeral: true,
    });
    await interaction.deleteReply();

    return;
  },
};

export const Par: Command = {
  keyword: "par",
  description: "Roll some D6, Catch the computers attention!",
  optionsBuilder: (builder) =>
    builder.addStringOption((option) =>
      option
        .setName("input")
        .setDescription("Format: numberOfRolles,successesNeeded (Example: 5,3)")
        .setRequired(true)
    ),
  handler: async (interaction) => {
    const input = interaction.options.getString("input") ?? "";
    const [rolls, required] = input.split(",");
    if (!rolls || !required)
      return await interaction.reply(
        "The input is not valid. Please try in the format {diceToRolls,successesRequired}. For example: /par 5,3"
      );

    if (!!rolls.match(/[^0-9]/))
      return await interaction.reply({
        content: "The number of rolls you entered is not a number",
        ephemeral: true,
      });
    if (!!required.match(/[^0-9]/))
      return await interaction.reply(
        "The number of successes needed you entered is not a number"
      );

    const rollsNum = parseInt(rolls.trim());
    const requiredNum = parseInt(required.trim());

    const playerRolls = diceRoller.roll(`${rollsNum}d6`);
    const computerRolls = diceRoller.roll(`1d6`);

    // @ts-ignore
    const playerValues = playerRolls.rolls.map((roll) => roll.roll);
    // @ts-ignore
    const computerValue = computerRolls.rolls[0].roll;

    const successes = [...playerValues, computerValue].filter(
      (roll) => roll >= 5
    ).length;
    const successString =
      successes >= requiredNum ? "The action succeeded" : "The action failed";
    const computerNoticeString =
      computerValue >= 6 ? "The computer is watching" : "";

    return await interaction.reply(
      `${successString} ${computerNoticeString} \`\`\`md\r\n# Players: [${playerValues.join(
        ", "
      )}] \r\n# Computer: [${computerValue}]\`\`\``
    );
  },
};

export const Roll: Command = {
  keyword: "roll",
  description: "The default dice roller",
  optionsBuilder: (builder) =>
    builder.addStringOption((option) =>
      option
        .setName("input")
        .setDescription("The dice command to roll (Example: 3d6)")
        .setRequired(true)
    ),
  handler: async (interaction) => {
    const input = interaction.options.getString("input") ?? "";

    const roll = diceRoller.roll(input);
    return await interaction.reply(renderer.render(input, roll));
  },
};

export const allCommands: Command[] = [
  Roll,
  GURPS,
  ShadowRun,
  RoleMaster,
  NotePassing,
  Par,
  ScumAndVillainy,
  { ...ScumAndVillainy, keyword: "d" },
];
