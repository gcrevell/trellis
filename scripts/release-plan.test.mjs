import { describe, it, expect } from 'vitest';
import {
  bumpPatch, compareSemver, parseSemver, tagFor,
} from './release-plan.mjs';

describe('parseSemver', () => {
  it('parses a plain version', () => {
    expect(parseSemver('1.2.3')).toEqual({
      major: 1,
      minor: 2,
      patch: 3,
      prerelease: null,
      raw: '1.2.3',
    });
  });

  it('parses a prerelease', () => {
    expect(parseSemver('1.2.0-rc.1').prerelease).toBe('rc.1');
  });

  it('tolerates surrounding whitespace', () => {
    expect(parseSemver(' 1.0.0 ').raw).toBe('1.0.0');
  });

  it('rejects anything that is not X.Y.Z', () => {
    for (const bad of ['1.2', 'v1.2.3', '1.2.3.4', 'latest', '', '01.2.3-']) {
      expect(parseSemver(bad), `expected ${JSON.stringify(bad)} to be rejected`).toBeNull();
    }
  });
});

describe('compareSemver', () => {
  const cmp = (a, b) => compareSemver(parseSemver(a), parseSemver(b));

  it('orders by major, then minor, then patch', () => {
    expect(cmp('2.0.0', '1.9.9')).toBeGreaterThan(0);
    expect(cmp('1.2.0', '1.1.9')).toBeGreaterThan(0);
    expect(cmp('1.1.2', '1.1.1')).toBeGreaterThan(0);
    expect(cmp('1.1.1', '1.1.2')).toBeLessThan(0);
  });

  it('treats equal versions as equal', () => {
    expect(cmp('1.2.3', '1.2.3')).toBe(0);
  });

  it('compares numerically, not as strings', () => {
    // The bug this guards: '10' < '9' lexicographically.
    expect(cmp('1.10.0', '1.9.0')).toBeGreaterThan(0);
    expect(cmp('1.0.10', '1.0.9')).toBeGreaterThan(0);
  });

  it('sorts a prerelease below its release', () => {
    expect(cmp('1.2.0-rc.1', '1.2.0')).toBeLessThan(0);
    expect(cmp('1.2.0', '1.2.0-rc.1')).toBeGreaterThan(0);
    expect(cmp('1.2.0-rc.2', '1.2.0-rc.1')).toBeGreaterThan(0);
  });

  it('sorts a list into ascending order', () => {
    const sorted = ['1.0.10', '1.0.2', '2.0.0', '1.1.0'].map(parseSemver).sort(compareSemver);
    expect(sorted.map((v) => v.raw)).toEqual(['1.0.2', '1.0.10', '1.1.0', '2.0.0']);
  });
});

describe('bumpPatch', () => {
  it('increments only the patch component', () => {
    expect(bumpPatch(parseSemver('1.2.3'))).toBe('1.2.4');
    expect(bumpPatch(parseSemver('1.2.9'))).toBe('1.2.10');
    expect(bumpPatch(parseSemver('0.0.0'))).toBe('0.0.1');
  });

  it('drops any prerelease suffix when bumping', () => {
    expect(bumpPatch(parseSemver('1.2.3-rc.1'))).toBe('1.2.4');
  });
});

describe('tagFor', () => {
  it('prefixes the bare semver, which is what latestTag() strips back off', () => {
    expect(tagFor('1.0.1')).toBe('v1.0.1');
  });
});

// The decision table from the top of release-plan.mjs, expressed as the rule
// the release workflow depends on: no manual bump means patch, a manual
// minor/major bump is taken literally.
describe('release version rule', () => {
  const decide = (declared, previous) => {
    const d = parseSemver(declared);
    const p = parseSemver(previous);
    return compareSemver(d, p) > 0 ? d.raw : bumpPatch(p);
  };

  it('auto-bumps the patch when package.json was left alone', () => {
    expect(decide('1.0.0', '1.0.0')).toBe('1.0.1');
    expect(decide('1.0.0', '1.0.7')).toBe('1.0.8');
  });

  it('honours a minor bump made in the PR', () => {
    expect(decide('1.1.0', '1.0.7')).toBe('1.1.0');
  });

  it('honours a major bump made in the PR', () => {
    expect(decide('2.0.0', '1.9.3')).toBe('2.0.0');
  });

  it('still patches when the declared version trails the last release', () => {
    expect(decide('0.9.0', '1.0.3')).toBe('1.0.4');
  });
});
