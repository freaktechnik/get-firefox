import test from 'ava';
import tmp from 'tmp-promise';
import path from 'path';
import util from 'util';
import childProcess from 'child_process';
import fs from 'fs';
import PLATFORMS from '../lib/platforms.json';

const exec = util.promisify(childProcess.exec);
const readDirectory = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);

test.before(() => {
    tmp.setGracefulCleanup();
});

const testGetFirefox = async (t, platform) => {
    const getFirefoxBinary = path.resolve('./bin/get-firefox');
    const temporaryDirectory = await tmp.dir({ unsafeCleanup: true });
    const { stderr } = await exec(`${getFirefoxBinary} -p ${platform} -b ${PLATFORMS[platform].defaultBranch}`, {
        shell: true,
        cwd: temporaryDirectory.path
    });
    t.is(stderr, '');
    const files = await readDirectory(temporaryDirectory.path);
    t.is(files.length, 1, "One file was downloaded");
    const filePath = path.join(temporaryDirectory.path, files[0]);
    const stats = await stat(filePath);
    t.is(stats.size > 0, true, "The file has a size greater than 0");

    temporaryDirectory.cleanup();
};
testGetFirefox.title = (title, platform) => `${title}: ${platform}`;

for(const platform in PLATFORMS) {
    if(PLATFORMS.hasOwnProperty(platform)) {
        test('platform downloads something', testGetFirefox, platform);
    }
}
