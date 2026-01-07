/**
 * Compare segment IDs for natural sorting
 * Examples: "6" < "6a" < "7" < "7a" < "8"
 */
export function compareSegmentIds(a: string, b: string): number {
  const parseId = (id: string): [number, string] => {
    const match = id.match(/^(\d+)([a-z]?)$/);
    if (!match) {
      return [0, ''];
    }
    return [parseInt(match[1], 10), match[2] || ''];
  };

  const [numA, varA] = parseId(a);
  const [numB, varB] = parseId(b);

  if (numA !== numB) {
    return numA - numB;
  }

  return varA.localeCompare(varB);
}
