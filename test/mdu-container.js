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

    return t.throws(container.getChecksums(), Error, "No checksums available");
});
