import { RoleMaster } from "./commands";
import {
  ChatInputCommandInteraction,
  CommandInteractionOptionResolver,
} from "discord.js";
import { DiceRoller } from "dice-roller-parser";

jest.spyOn(DiceRoller.prototype, "roll");

describe("RoleMaster roller", () => {
  let mockInteraction: Partial<ChatInputCommandInteraction>;
  let mockOptionResolver: Partial<CommandInteractionOptionResolver>;

  beforeEach(() => {
    mockOptionResolver = {
      getString: jest.fn(),
    };

    // @ts-ignore
    mockInteraction = {
      options: mockOptionResolver as CommandInteractionOptionResolver,
      reply: jest.fn(),
    };

    // @ts-ignore
    DiceRoller.prototype.roll.mockClear();
  });

  it("should reply with a message when the input is valid", async () => {
    jest.spyOn(mockOptionResolver, "getString").mockReturnValue("10");

    await RoleMaster.handler(mockInteraction as ChatInputCommandInteraction);

    expect(mockInteraction.reply).toHaveBeenCalled();
  });

  it("should reply with an error message when the input is not a number", async () => {
    jest.spyOn(mockOptionResolver, "getString").mockReturnValue("not a number");

    await RoleMaster.handler(mockInteraction as ChatInputCommandInteraction);

    expect(mockInteraction.reply).toHaveBeenCalledWith({
      content: "The modifier you entered is not a number",
      ephemeral: true,
    });
  });

  it("should default to 1d100 when no input is provided", async () => {
    jest.spyOn(mockOptionResolver, "getString").mockReturnValue("");

    await RoleMaster.handler(mockInteraction as ChatInputCommandInteraction);

    expect(DiceRoller.prototype.roll).toHaveBeenCalledWith("1d100!>95+0");
  });

  it("should allow passing in a negative number", async () => {
    jest.spyOn(mockOptionResolver, "getString").mockReturnValue("-10");

    await RoleMaster.handler(mockInteraction as ChatInputCommandInteraction);

    expect(DiceRoller.prototype.roll).toHaveBeenCalledWith("1d100!>95+-10");
  });

  it("should allow passing in a number with a plus sign at the beginning", async () => {
    jest.spyOn(mockOptionResolver, "getString").mockReturnValue("+10");

    await RoleMaster.handler(mockInteraction as ChatInputCommandInteraction);

    expect(DiceRoller.prototype.roll).toHaveBeenCalledWith("1d100!>95+10");
  });

  it("should allow passing in multiple numbers", async () => {
    jest.spyOn(mockOptionResolver, "getString").mockReturnValue("+10-5+3-2");

    await RoleMaster.handler(mockInteraction as ChatInputCommandInteraction);

    expect(DiceRoller.prototype.roll).toHaveBeenCalledWith(
      "1d100!>95+10-5+3-2"
    );
  });
});
