import test from 'ava';
import testContainer from './_test-container';
import MDUContainer from '../lib/mdu-container';

test("MDUContainer interface check", testContainer, MDUContainer, {
    platform: "LINUX64",
    product: "FIREFOX",
    version: "LATEST"
});

test("Get Checksums rejects", (t) => {
    const container = new MDUContainer({});

    return t.throwsAsync(container.getChecksums(), {
        instanceOf: Error,
        message: "No checksums available"
    });
});
