export type WfhTaskInput = {
  perspective: string;
  target: string;
  accomplished: string;
  notes: string;
};

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
