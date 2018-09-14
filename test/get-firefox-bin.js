import test from 'ava';
import tmp from 'tmp-promise';
import path from 'path';
import util from 'util';
import child_process from 'child_process';
import fs from 'fs-extra';

const exec = util.promisify(child_process.exec);
tmp.setGracefulCleanup();

const getFirefox = async(t, cliParams = '') => {
  const getFirefoxBinary = path.resolve('./bin/get-firefox');
  const tmpDir = await tmp.dir({ unsafeCleanup: true });
  const { stdout, stderr } = await exec(`${getFirefoxBinary} ${cliParams}`, { shell: true, cwd: tmpDir.path });
  t.is(stderr, '');
  const files = await fs.readdir(tmpDir.path);
  t.is(files.length, 1, "One file was downloaded");
  const filePath = path.join(tmpDir.path, files[0]);
  const stats = await fs.stat(filePath);
  t.is(stats.size > 0, true, "The file has a size greater than 0");
};

test('linux', async(t) => {
  await getFirefox(t, '-p linux');
});

test('mac', async(t) => {
  await getFirefox(t, '-p mac');
});

test('windows', async(t) => {
  await getFirefox(t, '-p win');
});
