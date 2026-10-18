import { afterEach, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const roots: string[] = [];
afterEach(() => { for (const r of roots.splice(0)) rmSync(r, { recursive: true, force: true }); });

it.each(['cancel-activation', 'activation-disconnect', 'bad-public', 'success'])('handles transport outcome %s', mode => {
  const root = mkdtempSync(path.join(tmpdir(), 'etex-transport-')); roots.push(root);
  mkdirSync(path.join(root, 'bin')); mkdirSync(path.join(root, 'dist-eventschedule'));
  mkdirSync(path.join(root, 'deploy/eventschedule'), { recursive: true });
  writeFileSync(path.join(root, 'deploy/eventschedule/activate-static.sh'), '# unused by simulated SSH server');
  for (const name of ['events.json', 'llms.txt', 'openapi.json', 'sitemap-index.xml']) writeFileSync(path.join(root, 'dist-eventschedule', name), name);
  const scripts: Record<string, string> = {
    npm: 'if [[ "$*" == *--public* && "$TEST_MODE" == bad-public ]]; then exit 1; fi',
    scp: 'exit 0', sleep: 'exit 0',
    ssh: `case "$*" in
      *'-- activate '*) echo activated >> "$TEST_LOG"; if [[ "$TEST_MODE" == cancel-activation ]]; then kill -TERM "$PPID"; fi; if [[ "$TEST_MODE" == activation-disconnect ]]; then exit 255; fi;;
      *'-- rollback '*) echo rollback >> "$TEST_LOG";;
    esac`,
  };
  for (const [name, body] of Object.entries(scripts)) writeFileSync(path.join(root, 'bin', name), '#!/usr/bin/env bash\n' + body + '\n', { mode: 0o755 });
  const result = spawnSync('bash', [path.resolve('scripts/deploy-eventschedule-static.sh')], {
    cwd: root, encoding: 'utf8', env: { ...process.env, PATH: `${root}/bin:${process.env.PATH}`,
      TEST_MODE: mode, TEST_LOG: `${root}/log`, ES_SSH_HOST: 'origin.example', ES_SSH_USER: 'publisher',
      ES_SSH_KEY: 'fixture', ES_SSH_KNOWN_HOSTS: 'fixture', ES_STATIC_ROOT: '/tmp/static', ES_BASE_URL: 'https://e-tex.events',
      GITHUB_RUN_ID: '123', GITHUB_RUN_ATTEMPT: '1' },
  });
  expect(result.status === 0).toBe(mode === 'success');
  expect(readFileSync(`${root}/log`, 'utf8')).toBe(mode === 'success' ? 'activated\n' : 'activated\nrollback\n');
});
