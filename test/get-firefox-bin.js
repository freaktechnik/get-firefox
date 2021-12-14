import test from 'ava';
import tmp from 'tmp-promise';
import path from 'node:path';
import util from 'node:util';
import childProcess from 'node:child_process';
import fs from 'node:fs/promises';
const PLATFORMS = JSON.parse(await fs.readFile(new URL('../lib/platforms.json', import.meta.url)));

const exec = util.promisify(childProcess.exec);

test.before(() => {
    tmp.setGracefulCleanup();
});

const testGetFirefox = async (t, platform) => {
    const getFirefoxBinary = path.resolve('./bin/get-firefox.js');
    const temporaryDirectory = await tmp.dir({ unsafeCleanup: true });
    const { stderr } = await exec(`${getFirefoxBinary} -p ${platform} -b ${PLATFORMS[platform].defaultBranch}`, {
        shell: true,
        cwd: temporaryDirectory.path
    });
    t.regex(stderr, /\^(node:\d+\) ExperimentalWarning: stream\/web is an experimental feature\. This feature could change at any time\n\(Use `node --trace-warnings \.\.\.` to show where the warning was created\)\n$/);
    const files = await fs.readdir(temporaryDirectory.path);
    t.is(files.length, 1, "One file was downloaded");
    const filePath = path.join(temporaryDirectory.path, files[0]);
    const stats = await fs.stat(filePath);
    t.is(stats.size > 0, true, "The file has a size greater than 0");

    temporaryDirectory.cleanup();
};
testGetFirefox.title = (title, platform) => `${title}: ${platform}`;

for(const platform in PLATFORMS) {
    if(PLATFORMS.hasOwnProperty(platform)) {
        test('platform downloads something', testGetFirefox, platform);
    }
}
