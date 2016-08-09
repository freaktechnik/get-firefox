import test from 'ava';
import testContainer from './_test-container';
import TaskclusterContainer from '../lib/taskcluster-container';

test("TaskclusterContainer interface check", testContainer, TaskclusterContainer, {
    namespace: "gecko.v2.mozilla-beta.latest.firefox.win64-add-on-devel",
    path: "/artifacts/",
    fileEnding: ".installer.exe"
});
