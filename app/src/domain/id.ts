export function nextId(prefix: string, existing: Iterable<string>): string {
  const used = new Set(existing);
  let index = 1;
  while (used.has(prefix + "-" + index)) index += 1;
  return prefix + "-" + index;
}
