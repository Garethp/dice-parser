import {
  DiceExpressionRoll,
  DiceRollResult,
  DieRoll,
  ExpressionRoll,
  FateDieRoll,
  GroupRoll,
  MathFunctionRoll,
  RollBase,
} from "dice-roller-parser";

/** An example renderer class that renders a roll to a string in a markdown format, compatible with Discord */
export class DiscordRollRenderer {
  /**
   * Renders a dice roll in a format compatible with Discord
   * @param roll a {@link RollBase} object that has been generated by the {@link DiceRoller}
   * @returns a string representing the roll that can be used on Discord
   */
  public render(input: string, roll: RollBase) {
    return `\`\`\`md\r\n# ${roll.value} \r\nDetails: [${input} (${this.doRender(
      roll,
      true
    )})]\`\`\``;
  }

  private doRender(roll: RollBase, root = false) {
    let render = "";
    const type = roll.type;

    switch (type) {
      case "diceexpressionroll":
        render += this.renderGroupExpr(roll as DiceExpressionRoll);
        break;
      case "grouproll":
        render += this.renderGroup(roll as GroupRoll);
        break;
      case "die":
        render += this.renderDie(roll as DiceRollResult);
        break;
      case "expressionroll":
        render += this.renderExpression(roll as ExpressionRoll);
        break;
      case "mathfunction":
        render += this.renderFunction(roll as MathFunctionRoll);
        break;
      case "roll":
        return this.renderRoll(roll as DieRoll);
      case "fateroll":
        return this.renderFateRoll(roll as FateDieRoll);
      case "number":
        const label = roll.label ? ` (${roll.label})` : "";
        return `${roll.value}${label}`;
      case "fate":
        return `F`;
      default:
        throw new Error("Unable to render");
    }

    if (!roll.valid) {
      render = "~~" + render.replace(/~~/g, "") + "~~";
    }

    if (root) {
      return this.stripBrackets(render);
    }

    return roll.label ? `(${roll.label}: ${render})` : render;
  }

  private renderGroup(group: GroupRoll) {
    const replies: string[] = [];

    for (const die of group.dice) {
      replies.push(this.doRender(die));
    }

    if (replies.length > 1) {
      return `{ ${replies.join(" + ")} }`;
    }

    const reply = this.stripBrackets(replies[0]);
    return `{ ${reply} }`;
  }

  private renderGroupExpr(group: DiceExpressionRoll) {
    const replies: string[] = [];

    for (const die of group.dice) {
      replies.push(this.doRender(die));
    }

    return replies.length > 1 ? `(${replies.join(" + ")})` : replies[0];
  }

  private renderDie(die: DiceRollResult) {
    const replies: string[] = [];

    for (const roll of die.rolls) {
      replies.push(this.doRender(roll));
    }

    let reply = `${replies.join(", ")}`;

    return `(${reply})`;
  }

  private renderExpression(expr: ExpressionRoll) {
    if (expr.dice.length > 1) {
      const expressions: string[] = [];

      for (let i = 0; i < expr.dice.length - 1; i++) {
        expressions.push(this.doRender(expr.dice[i]));
        expressions.push(expr.ops[i]);
      }

      expressions.push(this.doRender(expr.dice.slice(-1)[0]));

      return `(${expressions.join(" ")})`;
    } else if (expr.dice[0].type === "number") {
      return expr.value + "";
    } else {
      return this.doRender(expr.dice[0]);
    }
  }

  private renderFunction(roll: MathFunctionRoll) {
    const render = this.doRender(roll.expr);
    return `(${roll.op}${this.addBrackets(render)})`;
  }

  private addBrackets(render: string) {
    if (!render.startsWith("(")) {
      render = `(${render}`;
    }
    if (!render.endsWith(")")) {
      render = `${render})`;
    }
    return render;
  }

  private stripBrackets(render: string) {
    if (render.startsWith("(")) {
      render = render.substring(1);
    }
    if (render.endsWith(")")) {
      render = render.substring(0, render.length - 1);
    }
    return render;
  }

  private renderRoll(roll: DieRoll) {
    return `${roll.roll}`;
  }

  private renderFateRoll(roll: FateDieRoll) {
    const rollValue: string = roll.roll === 0 ? "0" : roll.roll > 0 ? "+" : "-";

    let rollDisplay = `${roll.roll}`;
    if (!roll.valid) {
      rollDisplay = `~~${rollValue}~~`;
    } else if (roll.success && roll.value === 1) {
      rollDisplay = `**${rollValue}**`;
    } else if (roll.success && roll.value === -1) {
      rollDisplay = `*${rollValue}*`;
    }

    if (roll.matched) {
      rollDisplay = `__${rollDisplay}__`;
    }

    return rollDisplay;
  }
}
