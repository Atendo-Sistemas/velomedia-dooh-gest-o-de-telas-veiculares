import { execFileSync, spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const hasDocker = process.env.VELOMEDIA_TEST_DOCKER === 'true' && spawnSync('docker', ['version']).status === 0;
const dockerSuite = hasDocker ? describe : describe.skip;

dockerSuite('docker image', () => {
  it('builds and ships migrations, schema and bundle, running as non-root', () => {
    const tag = 'velomedia-test:ci';
    execFileSync('docker', ['build', '-t', tag, '.'], { stdio: 'inherit' });
    const run = (...cmd: string[]) => execFileSync('docker', ['run', '--rm', '--entrypoint', cmd[0], tag, ...cmd.slice(1)]).toString().trim();
    expect(run('ls', 'server/db/migrations')).toContain('001_repository_records.sql');
    expect(run('ls', 'server/db')).toContain('schema.sql');
    expect(run('ls', 'dist')).toContain('server.cjs');
    expect(run('id', '-u')).not.toBe('0');
  }, 600_000);
});
