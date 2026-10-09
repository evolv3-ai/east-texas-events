import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, readlinkSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { STATIC_FILES } from '../static';
const roots: string[] = [];
const script = path.resolve('deploy/eventschedule/activate-static.sh');
const root = () => { const r = mkdtempSync(path.join(tmpdir(), 'etex-delivery-')); roots.push(r); return r; };
const stage = (r: string, release: string, suffix = '') => {
  const dir = path.join(r, 'releases', `${release}.incoming`); mkdirSync(dir, { recursive: true });
  const sums = STATIC_FILES.map(name => { const body = name + suffix; writeFileSync(path.join(dir, name), body); return `${createHash('sha256').update(body).digest('hex')}  ${name}`; });
  writeFileSync(path.join(dir, 'SHA256SUMS'), sums.join('\n') + '\n');
  return dir;
};
const run = (r: string, release: string, action = 'activate') => spawnSync('bash', [script, action, r, release], { encoding: 'utf8' });
afterEach(() => { for (const r of roots.splice(0)) rmSync(r, { recursive: true, force: true }); });
describe('atomic release activation', () => {
  it('activates all four files through a relative current symlink', () => {
    const r = root(); stage(r, '100-1'); const result = run(r, '100-1');
    expect(result.status, result.stderr).toBe(0); expect(readlinkSync(path.join(r, 'current'))).toBe('releases/100-1');
    for (const name of STATIC_FILES) expect(readFileSync(path.join(r, 'current', name), 'utf8')).toBe(name);
  });
  it.each(['missing', 'corrupt', 'manifest'])('keeps the last good release after a %s upload', kind => {
    const r = root(); stage(r, '100-1'); expect(run(r, '100-1').status).toBe(0);
    const dir = stage(r, '101-1');
    if (kind === 'missing') rmSync(path.join(dir, 'openapi.json'));
    if (kind === 'corrupt') writeFileSync(path.join(dir, 'events.json'), 'corrupt');
    if (kind === 'manifest') writeFileSync(path.join(dir, 'SHA256SUMS'), '');
    expect(run(r, '101-1').status).not.toBe(0); expect(readlinkSync(path.join(r, 'current'))).toBe('releases/100-1');
  });
  it('is idempotent and rejects older runs', () => {
    const r = root(); stage(r, '101-1'); expect(run(r, '101-1').status).toBe(0);
    expect(run(r, '101-1').status).toBe(0); stage(r, '100-2');
    expect(run(r, '100-2').status).not.toBe(0); expect(readlinkSync(path.join(r, 'current'))).toBe('releases/101-1');
  });
  it('rolls back only the release that failed verification', () => {
    const r = root(); stage(r, '100-1'); expect(run(r, '100-1').status).toBe(0);
    stage(r, '101-1', 'new'); expect(run(r, '101-1').status).toBe(0);
    expect(run(r, '101-1', 'rollback').status).toBe(0); expect(readlinkSync(path.join(r, 'current'))).toBe('releases/100-1');
    stage(r, '102-1'); expect(run(r, '102-1').status).toBe(0);
    expect(run(r, '101-1', 'rollback').status).not.toBe(0); expect(readlinkSync(path.join(r, 'current'))).toBe('releases/102-1');
  });
  it('removes current on failed first deployment instead of exposing bad data', () => {
    const r = root(); stage(r, '100-1'); expect(run(r, '100-1').status).toBe(0);
    expect(run(r, '100-1', 'rollback').status).toBe(0); expect(() => readlinkSync(path.join(r, 'current'))).toThrow();
  });
});
