const LOCAL_REDIRECT_BASE = new URL('https://local.invalid');

function hasUnsafePathCharacters(value: string): boolean {
  return (
    value.includes('\\') ||
    Array.from(value).some((character) => {
      const codePoint = character.codePointAt(0) ?? 0;
      return codePoint <= 31 || codePoint === 127;
    })
  );
}

export function normalizeLoginDestination(rawDestination: string): string {
  let decoded = rawDestination;
  try {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    }
  } catch {
    return '/';
  }

  if (!decoded.startsWith('/') || decoded.startsWith('//') || hasUnsafePathCharacters(decoded)) {
    return '/';
  }

  const resolved = new URL(decoded, LOCAL_REDIRECT_BASE);
  if (resolved.origin !== LOCAL_REDIRECT_BASE.origin || resolved.pathname.startsWith('//')) {
    return '/';
  }

  return `${resolved.pathname}${resolved.search}${resolved.hash}`;
}
