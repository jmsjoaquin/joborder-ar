export type WfhTaskInput = {
  perspective: string;
  target: string;
  accomplished: string;
  notes: string;
};

const targetVerbForms: Array<[RegExp, string]> = [
  [/^attended\b/i, "Attend"],
  [/^assessed\b/i, "Assess"],
  [/^developed\b/i, "Develop"],
  [/^prepared\b/i, "Prepare"],
  [/^researched\b/i, "Research"],
  [/^completed\b/i, "Complete"],
  [/^conducted\b/i, "Conduct"],
  [/^created\b/i, "Create"],
  [/^implemented\b/i, "Implement"],
  [/^resolved\b/i, "Resolve"],
  [/^reviewed\b/i, "Review"],
  [/^updated\b/i, "Update"],
];

function targetFromAccomplishment(accomplishment: string) {
  let target = accomplishment;
  let convertedOpening = false;
  for (const [pattern, replacement] of targetVerbForms) {
    if (pattern.test(target)) {
      target = target.replace(pattern, replacement);
      convertedOpening = true;
      break;
    }
  }
  return convertedOpening ? target.replace(/\band prepared\b/i, "and prepare") : target;
}

export function parseWfhAccomplishmentPaste(source: string, perspective: string): WfhTaskInput[] {
  const normalized = source.replace(/\r\n?/g, "\n").trim();
  const accomplishments = normalized
    .split(/\n\s*(?=[-*•]\s+)/)
    .map((block) => block.match(/^\s*[-*•]\s+([\s\S]+)$/)?.[1]?.trim() ?? "")
    .filter(Boolean);
  return accomplishments.map((accomplished) => ({
    perspective,
    target: targetFromAccomplishment(accomplished),
    accomplished,
    notes: "",
  }));
}

export function seedWfhTasks(input: { target: string; output: string; perspective: string }) {
  return [{
    perspective: input.perspective,
    target: input.target,
    accomplished: input.output,
    notes: "",
    sortOrder: 0,
  }];
}

export function dailyFieldsFromWfhTasks(tasks: WfhTaskInput[]) {
  const populated = tasks.filter((task) => task.target.trim() || task.accomplished.trim());
  return {
    target: populated.map((task) => task.target.trim()).filter(Boolean).join("\n"),
    output: populated.map((task) => task.accomplished.trim()).filter(Boolean).join("\n"),
  };
}
