import slugify from 'slugify';

export function baseSlug(input: string): string {
  return slugify(input, { lower: true, strict: true, trim: true });
}

/**
 * Given a desired base slug and a function that checks whether a candidate
 * is already taken, returns the first free slug: "title", "title-2", "title-3"...
 */
export async function uniqueSlug(
  input: string,
  isTaken: (candidate: string) => Promise<boolean>
): Promise<string> {
  const base = baseSlug(input) || 'stream';
  let candidate = base;
  let suffix = 2;

  while (await isTaken(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}
