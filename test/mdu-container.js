import test from 'ava';
import testContainer from './_test-container';
import MDUContainer from '../lib/mdu-container';

test("MDUContainer interface check", testContainer, MDUContainer);

test("Get Checksums rejects", async (t) => {
    const container = new MDUContainer({});

    const reason = await container.getChecksums().then(() => {
        throw "Should reject";
    }, (e) => e);
    t.false(reason);
});
