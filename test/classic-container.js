import test from 'ava';
import testContainer from './_test-container.js';
import ClassicContainer from '../lib/classic-container.js';

test("ClassicContainer interface check", testContainer, ClassicContainer);
