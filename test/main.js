import test from 'ava';
import { getContainer } from '../index';

test('getContainer with non-default arch and branch', (t) => {
    const container = getContainer("beta", "linux", "x86");
    t.is(container.platform, "LINUX32");
    t.is(container.version, "LATEST_BETA");
});
