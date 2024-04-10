import freaktechnikConfigNode from "@freaktechnik/eslint-config-node";
import freaktechnikConfigTest from "@freaktechnik/eslint-config-test";

export default [
    ...freaktechnikConfigNode,
    ...freaktechnikConfigTest,
    {
        files: ["**/*.js"],
        rules: {
            "unicorn/import-index": [
                "warn",
                {
                    "ignoreImports": true
                }
            ],
            "node/no-missing-import": "off",
        },
    },
];
