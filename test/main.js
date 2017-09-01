import test from 'ava';
import { getContainer } from '../index';

test('getContainer with non-default arch', (t) => {
    const container = getContainer("linux", "beta", "x86");
    t.is(container.platform, "LINUX32");
});
