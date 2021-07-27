import test from 'ava';
import testContainer from './_test-container.js';
import TaskclusterContainer from '../lib/taskcluster-container.js';

test("TaskclusterContainer interface check", testContainer, TaskclusterContainer, {
    namespace: "gecko.v2.mozilla-beta.latest.firefox.win64-add-on-devel",
    path: "/artifacts/",
    fileEnding: ".installer.exe"
});
