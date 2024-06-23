import { RoleMaster, ScumAndVillainy } from "./commands";
import {
  ChatInputCommandInteraction,
  CommandInteractionOptionResolver,
} from "discord.js";
import { DiceRoller, DiceRollResult } from "dice-roller-parser";

const rollSpy = jest.spyOn(DiceRoller.prototype, "roll");

describe("Scum and Villainy Roller", () => {
  let mockInteraction: Partial<ChatInputCommandInteraction>;
  let mockOptionResolver: Partial<CommandInteractionOptionResolver>;
  const roller = new DiceRoller();

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

  it("should reply with a message when the input is invalid", async () => {
    jest.spyOn(mockOptionResolver, "getString").mockReturnValue("not a number");

    await ScumAndVillainy.handler(
      mockInteraction as ChatInputCommandInteraction
    );

    expect(mockInteraction.reply).toHaveBeenCalledWith({
      content: "The modifier you entered is not a number",
      ephemeral: true,
    });
  });

  it("should roll a number of dice equal to the input", async () => {
    jest.spyOn(mockOptionResolver, "getString").mockReturnValue("4");

    await ScumAndVillainy.handler(
      mockInteraction as ChatInputCommandInteraction
    );

    expect(DiceRoller.prototype.roll).toHaveBeenCalledWith("4d6");
  });

  it.each([1, 2, 3])(
    "should return Failure for a roll with a %s high",
    async (diceValue) => {
      const roll = roller.roll("1d6") as DiceRollResult;
      rollSpy.mockImplementationOnce(() => ({
        ...roll,
        rolls: [
          {
            ...roll.rolls[0],
            roll: diceValue,
          },
        ],
      }));

      jest.spyOn(mockOptionResolver, "getString").mockReturnValue("1");

      await ScumAndVillainy.handler(
        mockInteraction as ChatInputCommandInteraction
      );

      expect(mockInteraction.reply).toHaveBeenCalledWith(
        expect.stringContaining("Bad Outcome:")
      );
    }
  );

  it.each([4, 5])(
    "should return Partial Success for a roll with a %s high",
    async (diceValue) => {
      const roll = roller.roll("1d6") as DiceRollResult;
      rollSpy.mockImplementationOnce(() => ({
        ...roll,
        rolls: [
          {
            ...roll.rolls[0],
            roll: diceValue,
          },
        ],
      }));

      jest.spyOn(mockOptionResolver, "getString").mockReturnValue("1");

      await ScumAndVillainy.handler(
        mockInteraction as ChatInputCommandInteraction
      );

      expect(mockInteraction.reply).toHaveBeenCalledWith(
        expect.stringContaining("Partial Success:")
      );
    }
  );

  it("should return Full Success for a roll with a 6 high", async () => {
    const roll = roller.roll("1d6") as DiceRollResult;
    rollSpy.mockImplementationOnce(() => ({
      ...roll,
      rolls: [
        {
          ...roll.rolls[0],
          roll: 6,
        },
      ],
    }));

    jest.spyOn(mockOptionResolver, "getString").mockReturnValue("1");

    await ScumAndVillainy.handler(
      mockInteraction as ChatInputCommandInteraction
    );

    expect(mockInteraction.reply).toHaveBeenCalledWith(
      expect.stringContaining("Full Success:")
    );
  });

  it("should return Critical Success for a roll with two 6's", async () => {
    const roll = roller.roll("2d6") as DiceRollResult;
    rollSpy.mockImplementationOnce(() => ({
      ...roll,
      rolls: [
        {
          ...roll.rolls[0],
          roll: 6,
        },
        {
          ...roll.rolls[1],
          roll: 6,
        },
      ],
    }));

    jest.spyOn(mockOptionResolver, "getString").mockReturnValue("2");

    await ScumAndVillainy.handler(
      mockInteraction as ChatInputCommandInteraction
    );

    expect(mockInteraction.reply).toHaveBeenCalledWith(
      expect.stringContaining("Critical Success:")
    );
  });

  it.each([0, -1])(
    "should take the lowest of two dice when rolling with a %s",
    async (diceValue) => {
      const roll = roller.roll("2d6") as DiceRollResult;
      rollSpy.mockImplementationOnce(() => ({
        ...roll,
        rolls: [
          {
            ...roll.rolls[0],
            roll: 1,
          },
          {
            ...roll.rolls[1],
            roll: 6,
          },
        ],
      }));

      jest
        .spyOn(mockOptionResolver, "getString")
        .mockReturnValue(`${diceValue}`);

      ScumAndVillainy.handler(mockInteraction as ChatInputCommandInteraction);

      expect(mockInteraction.reply).toHaveBeenCalledWith(
        expect.stringContaining("Bad Outcome:")
      );
    }
  );

  it("should not let you roll a critical success with negative dice", async () => {
    const roll = roller.roll("2d6") as DiceRollResult;
    rollSpy.mockImplementationOnce(() => ({
      ...roll,
      rolls: [
        {
          ...roll.rolls[0],
          roll: 6,
        },
        {
          ...roll.rolls[1],
          roll: 6,
        },
      ],
    }));

    jest.spyOn(mockOptionResolver, "getString").mockReturnValue(`0`);

    ScumAndVillainy.handler(mockInteraction as ChatInputCommandInteraction);

    expect(mockInteraction.reply).toHaveBeenCalledWith(
      expect.stringContaining("Full Success:")
    );
  });
});

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
