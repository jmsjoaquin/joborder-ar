const irregularPastTense: Record<string, string> = {
  arise: "arose",
  begin: "began",
  build: "built",
  buy: "bought",
  catch: "caught",
  choose: "chose",
  come: "came",
  do: "did",
  draw: "drew",
  find: "found",
  get: "got",
  give: "gave",
  go: "went",
  have: "had",
  hold: "held",
  keep: "kept",
  lead: "led",
  make: "made",
  meet: "met",
  read: "read",
  run: "ran",
  see: "saw",
  send: "sent",
  set: "set",
  take: "took",
  teach: "taught",
  write: "wrote",
};

const alreadyPastTense = new Set([
  ...Object.values(irregularPastTense),
  "built",
  "completed",
  "conducted",
  "created",
  "developed",
  "implemented",
  "prepared",
  "resolved",
  "reviewed",
  "updated",
]);

function preserveCapitalization(source: string, replacement: string) {
  if (source === source.toUpperCase()) return replacement.toUpperCase();
  if (source[0] === source[0]?.toUpperCase()) return replacement[0].toUpperCase() + replacement.slice(1);
  return replacement;
}

function verbToPastTense(verb: string) {
  const lower = verb.toLowerCase();
  if (alreadyPastTense.has(lower) || lower.endsWith("ed")) return verb;
  const irregular = irregularPastTense[lower];
  if (irregular) return preserveCapitalization(verb, irregular);

  let past: string;
  if (lower.endsWith("e")) past = `${lower}d`;
  else if (/[^aeiou]y$/.test(lower)) past = `${lower.slice(0, -1)}ied`;
  else if (/(?:plan|stop|drop|submit|commit|refer|occur)$/.test(lower)) past = `${lower}${lower.at(-1)}ed`;
  else past = `${lower}ed`;
  return preserveCapitalization(verb, past);
}

export function outputHeadingFromTarget(target: string) {
  const trimmed = target.trim();
  return trimmed.replace(/^([A-Za-z]+)(\b)/, (_match, verb: string, wordBoundary: string) => `${verbToPastTense(verb)}${wordBoundary}`);
}

export function outputAsBulletedList(output: string) {
  return output
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return "";

      const text = trimmed.replace(/^(?:(?:[-*\u2022\u2023\u25e6\u25aa])|(?:\d+[.)]))\s+/, "");
      return `\u2022 ${text}`;
    })
    .join("\n");
}
