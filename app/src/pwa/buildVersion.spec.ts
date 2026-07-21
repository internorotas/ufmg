import { describe, expect, it } from 'vitest';
import { resolveBuildVersion } from './buildVersion';

describe('resolveBuildVersion', () => {
  it('prioriza o commit do Cloudflare Pages', () => {
    expect(
      resolveBuildVersion({
        cfPagesCommitSha: 'commit-atual',
        viteBuildId: 'build-manual',
        appVersion: '3.0.0',
      }),
    ).toBe('commit-atual');
  });

  it('usa o build ID configurado antes da versão', () => {
    expect(resolveBuildVersion({ viteBuildId: 'build-manual', appVersion: '3.0.0' })).toBe(
      'build-manual',
    );
  });

  it('usa a versão quando não há identificador de deploy', () => {
    expect(resolveBuildVersion({ appVersion: '3.0.0' })).toBe('3.0.0');
  });
});
