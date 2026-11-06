export type ImportedAccomplishment = {
  date: string;
  target: string;
  output: string;
};

const MONTHS: Record<string, number> = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};

function parseHeadingDate(heading: string) {
  const match = heading.trim().match(/^([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})$/);
  if (!match) return null;
  const month = MONTHS[match[1].toLowerCase()];
  const day = Number(match[2]);
  const year = Number(match[3]);
  if (!month || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function cleanTarget(value: string) {
  return value
    .replace(/^\*\*(.+)\*\*$/, "$1")
    .replace(/^__(.+)__$/, "$1")
    .replace(/^#+\s*/, "")
    .trim();
}

export function parseAccomplishmentReport(source: string): ImportedAccomplishment[] {
  const normalized = source.replace(/\r\n?/g, "\n");
  const headings = [...normalized.matchAll(/^###\s+(.+?)\s*$/gm)]
    .map((match) => ({ index: match.index ?? 0, end: (match.index ?? 0) + match[0].length, date: parseHeadingDate(match[1]) }))
    .filter((heading): heading is { index: number; end: number; date: string } => Boolean(heading.date));

  return headings.flatMap((heading, index) => {
    const section = normalized.slice(heading.end, headings[index + 1]?.index ?? normalized.length).trim();
    const lines = section.split("\n");
    const targetIndex = lines.findIndex((line) => cleanTarget(line).length > 0);
    if (targetIndex < 0) return [];

    const target = cleanTarget(lines[targetIndex]);
    const outputLines = lines
      .slice(targetIndex + 1)
      .map((line) => line.replace(/\\\s*$/, "").trimEnd())
      .filter((line, lineIndex, all) => line.trim() || (lineIndex > 0 && lineIndex < all.length - 1));
    while (outputLines.length && (!outputLines.at(-1)?.trim() || /^-{3,}$/.test(outputLines.at(-1)?.trim() ?? ""))) outputLines.pop();
    const output = outputLines.join("\n").trim();
    if (!target && !output) return [];
    return [{ date: heading.date, target, output }];
  });
}
