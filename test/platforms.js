import test from 'ava';
import platforms from '../lib/platforms.json';

// I don't like that this is hardcoded, but this is the best I could come up with for now.
const PROPERTIES = {
    "classic": [
        "path",
        "fileEnding"
    ],
    "mdu": [
        "platform",
        "product"
    ],
    "taskcluster": [
        "path",
        "fileEnding",
        "namespace"
    ]
};

const platformStructure = (t, platform) => {
    t.true("defaultBranch" in platform);
    t.true("branches" in platform);

    t.is(typeof platform.defaultBranch, "string");
    t.is(typeof platform.branches, "object");

    t.true(platform.defaultBranch in platform.branches);

    Object.keys(platform.branches).forEach((b) => {
        const branch = platform.branches[b];
        t.true("defaultArch" in branch);
        t.true("type" in branch);
        t.true("arches" in branch);

        t.is(typeof branch.defaultArch, "string");
        t.is(typeof branch.type, "string");
        t.is(typeof branch.arches, "object");

        t.true(branch.type in PROPERTIES);
        t.true(branch.defaultArch in branch.arches);

        const archProperties = PROPERTIES[branch.type];

        Object.keys(branch.arches).forEach((a) => {
            const arch = branch.arches[a];
            for(const prop of archProperties) {
                t.true(prop in arch);
                t.is(typeof arch[prop], "string");
            }
        });
    });
};
platformStructure.title = (providedTitle, platform) => `${platform} structure`;

Object.keys(platforms).forEach((p) => {
    test(platformStructure, platforms[p]);
});
