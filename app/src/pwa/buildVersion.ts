interface BuildVersionInput {
  cfPagesCommitSha?: string;
  viteBuildId?: string;
  appVersion: string;
}

function firstDefined(...values: Array<string | undefined>): string | null {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }

  return null;
}

export function resolveBuildVersion({
  cfPagesCommitSha,
  viteBuildId,
  appVersion,
}: BuildVersionInput): string {
  return firstDefined(cfPagesCommitSha, viteBuildId, appVersion) ?? 'unknown';
}
