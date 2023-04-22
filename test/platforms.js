import test from 'ava';
import fs from 'node:fs/promises';
import mdu from 'moz-download-url';
import Ajv from 'ajv';
const platforms = JSON.parse(await fs.readFile(new URL('../lib/platforms.json', import.meta.url)));
const schema = JSON.parse(await fs.readFile(new URL('../schemas/platforms.json', import.meta.url)));

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

const EXPECTED_BRANCHES = new Set([
    "nightly",
    "devedition",
    "beta",
    "release",
    "esr",
    "unbranded-release"
]);

const EXPECTED_ARCHES = new Set([
    "x86_64",
    "x86",
    "arm",
    "multi",
    "arm64"
]);

const platformStructure = (t, platform) => {
    t.true("defaultBranch" in platform);
    t.true("branches" in platform);

    t.is(typeof platform.defaultBranch, "string");
    t.is(typeof platform.branches, "object");

    t.true(platform.defaultBranch in platform.branches);

    for(const [
        b,
        branch
    ] of Object.entries(platform.branches)) {
        t.true("defaultArch" in branch);
        t.true("type" in branch);
        t.true("arches" in branch);

        t.is(typeof branch.defaultArch, "string");
        t.is(typeof branch.type, "string");
        t.is(typeof branch.arches, "object");

        t.true(branch.type in PROPERTIES);
        t.true(branch.defaultArch in branch.arches);
        t.true(EXPECTED_BRANCHES.has(b));

        const archProperties = PROPERTIES[branch.type];

        for(const [
            a,
            arch
        ] of Object.entries(branch.arches)) {
            t.true(EXPECTED_ARCHES.has(a));

            for(const property of archProperties) {
                t.true(property in arch);
                t.is(typeof arch[property], "string");
            }

            if(branch.type == "mdu") {
                t.true(arch.product in mdu);
                t.true(arch.version in mdu[arch.product]);
                t.true(arch.platform in mdu.PLATFORMS);
            }
        }
    }
};
platformStructure.title = (providedTitle) => `${providedTitle} structure`;

for(const [
    p,
    platform
] of Object.entries(platforms)) {
    test(p, platformStructure, platform);
}

test('Platforms comply to the schema', (t) => {
    //TODO schema should check for the presence of the type specific properties
    const ajv = new Ajv();

    const valid = ajv.validate(schema, platforms);
    if(valid) {
        t.true(valid);
    }
    else {
        t.fail(`${ajv.errorsText()}`);
    }
});
