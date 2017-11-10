import test from 'ava';
import platforms from '../lib/platforms.json';
import mdu from 'moz-download-url';
import Ajv from 'ajv';
import schema from '../schemas/platforms.json';

// I don't like that this is hardcoded, but this is the best I could come up with for now.
const PROPERTIES = {
    "classic": [
        "path",
        "fileEnding"
    ],
    "mdu": [
        "platform",
        "product",
        "version"
    ],
    "taskcluster": [
        "fileEnding",
        "namespace"
    ]
};

const EXPECTED_BRANCHES = [
    "nightly",
    "devedition",
    "beta",
    "release",
    "esr",
    "unbranded-release"
];

const EXPECTED_ARCHES = [
    "x86_64",
    "x86",
    "arm-v15",
    "multi"
];

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
        t.true(EXPECTED_BRANCHES.includes(b));

        const archProperties = PROPERTIES[branch.type];

        Object.keys(branch.arches).forEach((a) => {
            const arch = branch.arches[a];
            t.true(EXPECTED_ARCHES.includes(a));

            for(const prop of archProperties) {
                t.true(prop in arch);
                t.is(typeof arch[prop], "string");
            }

            if(branch.type == "mdu") {
                t.true(arch.product in mdu);
                t.true(arch.version in mdu[arch.product]);
                t.true(arch.platform in mdu.PLATFORMS);
            }
        });
    });
};
platformStructure.title = (providedTitle) => `${providedTitle} structure`;

Object.keys(platforms).forEach((p) => {
    test(p, platformStructure, platforms[p]);
});

test('Platforms comply to the schema', (t) => {
    //TODO schema should check for the presence of the type specific properties
    const ajv = new Ajv();

    const valid = ajv.validate(schema, platforms);
    if(!valid) {
        t.fail(ajv.errorsText());
    }
    else {
        t.true(valid);
    }
});
